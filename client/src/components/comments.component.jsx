import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import axios from "axios";
import NoDataMessage from "./nodata.component";
import AnimationWrapper from "../common/page-animation";
import CommentCard from "./comment-card.component";

export const fetchComments = async ({
  skip = 0,
  blog_id,
  setParentCommentCountFun,
  Comment_Array = null,
}) => {
  let res;

  await axios
    .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog-comments", {
      blog_id,
      skip,
    })
    .then(({ data }) => {
      data.map((comment) => {
        comment.childrenLevel = 0;
      });

      setParentCommentCountFun((preVal) => preVal + data.length);

      if (Comment_Array == null) {
        res = { results: data };
      } else {
        res = { results: [...Comment_Array, ...data] };
      }
    });
  return res;
};

const CommentsContainer = () => {
  let {
    blog,
    blog: {
      _id,
      title,
      comments: { results: Comments_array },
      activity: { total_parent_comments },
    },
    setBlogs,
    commentsWrapper,
    setCommentsWrapper,
    totalParentCommentsLoaded,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  const loadMoreComments = async () => {
    let newCommentsArr = await fetchComments({
      skip: totalParentCommentsLoaded,
      blog_id: _id,
      setParentCommentCountFun: setTotalParentCommentsLoaded,
      Comments_Array: Comments_array,
    });

    // ✅ Fix: Ensure newCommentsArr.results is an array before updating state
    if (newCommentsArr && Array.isArray(newCommentsArr.results)) {
      setBlogs({ ...blog, comments: { results: newCommentsArr.results } });
    } else {
      console.error(
        "Invalid data structure received from fetchComments:",
        newCommentsArr
      );
    }
  };

  console.log("First parameter -> ", total_parent_comments);
  console.log("Second Parameter ->", totalParentCommentsLoaded);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setCommentsWrapper(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setCommentsWrapper]);

  console.log(Comments_array);
  return (
    <div
      className={`max-sm:w-full fixed duration-700 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto overflow-x-hidden 
        ${
          commentsWrapper
            ? "top-0 sm:right-0 max-sm:right-0 max-sm:top-0"
            : "top-[100%] sm:right-[-100%] max-sm:top-[100%]"
        }`}
    >
      <div className="relative">
        <h1 className="text-xl font-medium ">Comments</h1>
        <p className="text-lg mt-2 w-[70%] text-dark-grey line-clamp-1">
          {title}
        </p>

        <button
          onClick={() => setCommentsWrapper((prev) => !prev)}
          className="absolute top-0 right-0 flex justify-center items-center w-12 h-12 rounded-full bg-grey"
        >
          <i className="fi fi-br-cross text-2xl mt-1"></i>
        </button>
      </div>
      <hr className="border-grey my-8 w-[120%] -ml-10" />
      <CommentField action="comment" />
      {Comments_array && Comments_array.length ? (
        Comments_array.map((comment, i) => {
          return (
            <AnimationWrapper key={i}>
              <CommentCard
                index={i}
                leftVal={comment.childrenLevel * 4}
                commentData={comment}
              />
            </AnimationWrapper>
          );
        })
      ) : (
        <NoDataMessage message="No Comments" />
      )}
      {total_parent_comments > totalParentCommentsLoaded ? (
        <button
          onClick={loadMoreComments}
          className="text-dark-grey p-2 px-3 hover:bg-grey/30  rounded-md flex items-center gap-2"
        >
          Load More
        </button>
      ) : (
        " "
      )}
    </div>
  );
};

export default CommentsContainer;
