import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk";
import fs from "fs/promises";

const serviceAccountKey = JSON.parse(
  await fs.readFile(new URL("./service-account.json", import.meta.url))
);
console.log(import.meta.url);

//Schemas
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";

const server = express();
let PORT = 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(cors({ origin: "*" })); // Allow all origins
server.use(express.json());
mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

server.listen(PORT, () => {
  console.log("listening on port -> " + PORT);
});

const formatDataToSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.AWS_SECRET_ACCESS_KEY
  );

  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

const generateUserName = async (email) => {
  let username = email.split("@")[0];
  let isUserNameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);

  isUserNameNotUnique ? (username += nanoid().substring(0, 5)) : "";
  return username;
};

server.post("/signup", (req, res) => {
  let { fullname, email, password } = req.body;
  //validating data from frontend
  if (fullname.length < 3) {
    return res
      .status(403)
      .json({ Error: "FullName must be greater than 3 letters" });
  }
  if (!email.length) {
    return res.status(403).json({ Error: "Enter email" });
  }
  if (!emailRegex.test(email)) {
    return res.status(403).json({ Error: "Email is invalid" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      Error:
        "Password should b 6 to 20 letters long with a numeric, 1 Lowercase and 1 Uppercase letters",
    });
  }

  bcrypt.hash(password, 10, async (err, hashPassword) => {
    let username = await generateUserName(email);
    let user = new User({
      personal_info: { fullname, email, password: hashPassword, username },
    });
    user
      .save()
      .then((u) => {
        return res.status(200).json(formatDataToSend(u));
      })
      .catch((err) => {
        if (err.code == 11000) {
          return res.status(500).json({ Error: "Email Already Exists" });
        }
        return res.status(500).json({ Error: err.message });
      });
  });
});

server.post("/signin", (req, res) => {
  let { email, password } = req.body;
  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.status(403).json({ error: "Email not found" });
      }
      if (!user.google_auth) {
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            return res
              .status(403)
              .json({ error: "Error occur while login please try again" });
          }

          if (!result) {
            return res.status(403).json({ error: "Incorrect   Password" });
          } else {
            return res.status(200).json(formatDataToSend(user));
          }
        });
      } else {
        return res.status(403).json({
          error:
            "Account was created using google. try logging in with google ",
        });
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/google-auth", async (req, res) => {
  let { access_token } = req.body; // Ensure you're extracting the token correctly

  if (!access_token) {
    return res.status(400).json({ error: "No token provided" });
  }

  console.log("Received access_token:", access_token); // Debugging step

  getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;
      console.log(picture);

      picture = picture.replace("s96-c", "s384-c");
      let user = await User.findOne({ "personal_info.email": email })
        .select(
          "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
        )
        .catch((err) => {
          return res.status(500).json({ Error: err.message });
        });

      if (user) {
        if (!user.google_auth) {
          return res.status(403).json({
            error:
              "This email was signed up with a password. Please log in with a password to access the account.",
          });
        }
      } else {
        let username = await generateUserName(email);

        user = new User({
          personal_info: {
            fullname: name,
            email,
            profile_img: picture,
            username,
          },
          google_auth: true,
        });

        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            return res.status(500).json({ error: err.message });
          });
      }

      return res.status(200).json(formatDataToSend(user));
    })
    .catch((err) => {
      console.error("Firebase verification error:", err.message); // Debugging step
      return res.status(500).json({
        error: "Failed to authenticate with Google. Try another account.",
      });
    });
});

// creating  a s3 bucket

const s3 = new aws.S3({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateUploadURL = async () => {
  const date = new Date();
  const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

  return await s3.getSignedUrlPromise("putObject", {
    Bucket: "blogging-website-priyansh",
    Key: imageName,
    Expires: 1000,
    ContentType: "image/jpeg",
  });
};
// upload image url route

server.get("/get-upload-url", (req, res) => {
  generateUploadURL()
    .then((url) => res.status(200).json({ uploadURL: url }))
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ error: "No Access Token" });
  }
  jwt.verify(token, process.env.AWS_SECRET_ACCESS_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Acess token is invalid" });
    }
    req.user = user.id;
    next();
  });
};

server.get("/latest-blogs", (req, res) => {
  let maxLimit = 5;
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname  -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

// port change
server.post("/create-blog", verifyJWT, (req, res) => {
  let authorId = req.user;
  let { title, des, banner, tags, content, draft } = req.body;

  if (!title.length) {
    return res
      .status(403)
      .json({ error: "You must provide a title to publish the blog" });
  }

  if (!draft) {
    if (!des.length || des.length > 200) {
      return res.status(403).json({
        error: "You must provide blog description under 200 character ",
      });
    }

    if (!banner.length) {
      return res
        .status(403)
        .json({ error: "You must provide blog banner to publish it" });
    }

    if (!content.blocks.length) {
      return res
        .status(403)
        .json({ error: "There must be some blog content to publish it" });
    }

    if (!tags.length || tags.length > 10) {
      return res.status(403).json({
        error: "Provide tags in order to publish the blog ,Maximum 10 ",
      });
    }
  }

  tags = tags.map((tag) => tag.toLowerCase());

  let blog_id =
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();

  let blog = new Blog({
    title,
    des,
    banner,
    content,
    tags,
    author: authorId,
    blog_id,
    draft: Boolean(draft),
  });

  blog
    .save()
    .then((blog) => {
      let incrementVal = draft ? 0 : 1;

      User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "account_info.total_posts": incrementVal },
          $push: { blogs: blog._id },
        }
      )
        .then((user) => {
          return res.status(200).json({ id: blog.blog_id });
        })
        .catch((err) => {
          return res
            .status(500)
            .json({ error: "Failed to update total posts number " });
        });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});
