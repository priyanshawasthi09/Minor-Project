import { useContext, useRef } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import { Link, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({ type }) => {
  const authForm = useRef();

  let {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const userAuthThroughServer = (serverRoute, formData) => {
    const url = import.meta.env.VITE_SERVER_DOMAIN + serverRoute;
    console.log("API URL:", url);
    if (!import.meta.env.VITE_SERVER_DOMAIN) {
      console.error("VITE_SERVER_DOMAIN is undefined!");
      return toast.error("Server URL is not defined.");
    }

    axios
      .post(url, formData)
      .then(({ data }) => {
        storeInSession("user", JSON.stringify(data));
        setUserAuth(data);
      })
      .catch((error) => {
        console.error("API Error:", error);
        toast.error(
          error?.response?.data?.error || "An unexpected error occurred"
        );
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!authForm.current) return;
    let serverRoute = type === "sign-in" ? "/signin" : "/signup";

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const formData = Object.fromEntries(new FormData(authForm.current));
    const { fullname = "", email = "", password = "" } = formData; // Ensure default empty values to avoid undefined errors

    // Form validation
    if (type !== "sign-in" && fullname.trim().length < 3) {
      return toast.error("Full Name must be at least 3 characters long.");
    }
    if (!email.trim()) {
      return toast.error("Email is required.");
    }
    if (!emailRegex.test(email.trim())) {
      return toast.error("Invalid email format.");
    }
    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must be 6-20 characters long, with at least 1 uppercase, 1 lowercase, and 1 number."
      );
    }

    userAuthThroughServer(serverRoute, formData);
  };

  const handleGoogleAuth = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await authWithGoogle();
      const idToken = await userCredential.user.getIdToken(); // Get Firebase ID token

      let serverRoute = "/google-auth";
      let formData = {
        access_token: idToken, // Send the ID token instead of access_token
      };

      userAuthThroughServer(serverRoute, formData);
    } catch (err) {
      toast.error("Trouble logging in through Google");
      console.error(err);
    }
  };

  return access_token ? (
    <Navigate to="/" />
  ) : (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <form
          ref={authForm}
          className="w-[80%] max-w-[400px]"
          onSubmit={handleSubmit}
        >
          <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
            {type === "sign-in" ? "Welcome back" : "Join us Today"}
          </h1>

          {type !== "sign-in" && (
            <InputBox
              name="fullname"
              type="text"
              placeholder="Full Name"
              icon="fi-rr-user"
            />
          )}
          <InputBox
            name="email"
            type="email"
            placeholder="Email"
            icon="fi-rr-at"
          />
          <InputBox
            name="password"
            type="password"
            placeholder="Password"
            icon="fi-rr-key"
          />

          <button className="btn-dark center mt-14" type="submit">
            {type.replace("-", "")}
          </button>

          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black" />
          </div>

          <button
            className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
            onClick={handleGoogleAuth}
          >
            <img src={googleIcon} className="w-5" alt="Google Icon" />
            Continue with Google
          </button>

          <p className="mt-6 text-dark-grey text-xl text-center">
            {type === "sign-in" ? (
              <>
                Don't have an account?
                <Link
                  to="/signup"
                  className="underline text-black text-xl ml-1"
                >
                  Join us today
                </Link>
              </>
            ) : (
              <>
                Already a member?
                <Link
                  to="/signin"
                  className="underline text-black text-xl ml-1"
                >
                  Sign in here!
                </Link>
              </>
            )}
          </p>
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;
