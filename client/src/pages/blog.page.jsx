import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import { createContext } from "react";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer, {
  fetchComments,
} from "../components/comments.component";

export const BlogStructure = {
  title: "",
  des: "",
  content: [],
  author: { personal_info: {} },
  banner: "",
  publishedAt: "",
};

export const BlogContext = createContext({});

const BlogPage = () => {
  let { blog_id } = useParams();

  const [blog, setBlogs] = useState(BlogStructure);
  const [similarBlogs, setSimilarBlogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLikeByUser, setLikedByUser] = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(true);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);

  let {
    title,
    content,
    banner,
    author: {
      personal_info: { fullname, username: author_username, profile_img },
    },
    publishedAt,
    tags,
  } = blog;

  const fetchBlogs = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blogs", { blog_id })
      .then(async ({ data: { blog } }) => {
        blog.comments = await fetchComments({
          blog_id: blog._id,
          setParentCommentCountFun: setTotalParentCommentsLoaded,
        });

        setBlogs(blog);
        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
            tag: blog.tags[0],
            limit: 6,
            eliminate_blogs: blog_id,
          })
          .then(({ data }) => {
            setSimilarBlogs(data.blogs);
          });

        setBlogs(blog);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    resetStates();
    fetchBlogs();
  }, [blog_id]);

  const resetStates = () => {
    setBlogs(BlogStructure);
    setSimilarBlogs(null);
    setLoading(true);
    setLikedByUser(false);
    setCommentsWrapper(false);
    setTotalParentCommentsLoaded(0);
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <BlogContext.Provider
          value={{
            blog,
            setBlogs,
            isLikeByUser,
            setLikedByUser,
            commentsWrapper,
            setCommentsWrapper,
            totalParentCommentsLoaded,
            setTotalParentCommentsLoaded,
          }}
        >
          <CommentsContainer />
          <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <img src={banner} className="aspect-video" alt="" />
            <div className="mt-12">
              <h2>{title}</h2>
              <div className=" flex max-sm:flex-col justify-between my-8">
                <div className="flex gap-5 items-start">
                  <img
                    src={profile_img}
                    className="w-12 h-12 rounded-full"
                    alt=""
                  />
                  <p>
                    {fullname}
                    <br />@
                    <Link to={`/user/${author_username}`} className="underline">
                      {author_username}
                    </Link>
                  </p>
                </div>
                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                  Published on {getDay(publishedAt)}
                </p>
              </div>
            </div>

            <BlogInteraction />
            <div className="my-12 font-gelasio blog-page-content">
              {content[0].blocks.map((block, i) => {
                return (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                );
              })}
            </div>
            <BlogInteraction />
            {similarBlogs != null && similarBlogs.length ? (
              <>
                <h1 className="text-2xl mt-14 mb-10 font-medium">
                  Similar Blogs
                </h1>
                {similarBlogs.map((blog, i) => {
                  let {
                    author: { personal_info },
                  } = blog;

                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.08 }}
                    >
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              ""
            )}
          </div>
        </BlogContext.Provider>
      )}
    </AnimationWrapper>
  );
};

export default BlogPage;
