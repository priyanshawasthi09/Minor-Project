import { useContext, useState } from "react";
import { getDay } from "../common/date";
import toast, { Toaster } from "react-hot-toast";
import { UserContext } from "../App";
import CommentField from "./comment-field.component";
import { BlogContext } from "../pages/blog.page";
import axios from "axios";

const CommentCard = ({ index, leftVal, commentData }) => {
  let {
    commented_by: {
      personal_info: { profile_img, fullname, username: commented_by_username },
    },
    commentedAt,
    comment,
    _id,
    children,
  } = commentData;

  let {
    blog,
    blog: {
      comments,
      activity,
      activity: { total_parent_comments },
      comments: { results: Comments_Array },
      author: {
        personal_info: { username: blog_author },
      },
    },
    setBlogs,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  let {
    userAuth: { access_token, username },
  } = useContext(UserContext);

  const [isReplying, setReplying] = useState(false);

  const getParentIndex = () => {
    let startingPoint = index - 1;

    try {
      while (
        Comments_Array[startingPoint].childrenLevel >= commentData.childrenLevel
      ) {
        startingPoint--;
      }
    } catch {
      startingPoint = undefined;
    }
    return startingPoint;
  };

  const removeCommentsCards = (starting_index, isDelete = false) => {
    let updatedCommentsArray = [...Comments_Array]; // Create a new array copy

    if (updatedCommentsArray[starting_index]) {
      while (
        updatedCommentsArray[starting_index].childrenLevel >
        commentData.childrenLevel
      ) {
        updatedCommentsArray.splice(starting_index, 1);
        if (!updatedCommentsArray[starting_index]) {
          break;
        }
      }
    }

    if (isDelete) {
      let parentIndex = getParentIndex();

      if (parentIndex !== undefined) {
        updatedCommentsArray[parentIndex].children = updatedCommentsArray[
          parentIndex
        ].children.filter((child) => child != _id);

        if (!updatedCommentsArray[parentIndex].children.length) {
          updatedCommentsArray[parentIndex].isReplyLoaded = false;
        }
      }
      // Remove the parent comment itself
      updatedCommentsArray = updatedCommentsArray.filter(
        (comment) => comment._id !== _id
      );
    }

    // ✅ Immediately update the total comment counter
    const newTotalParentComments =
      isDelete && commentData.childrenLevel === 0
        ? total_parent_comments - 1
        : total_parent_comments;

    setTotalParentCommentsLoaded(
      (prev) => prev - (commentData.childrenLevel === 0 && isDelete ? 1 : 0)
    );

    setBlogs((prev) => ({
      ...prev,
      comments: { results: updatedCommentsArray }, // ✅ Ensure a new array reference
      activity: {
        ...prev.activity,
        total_parent_comments: newTotalParentComments, // ✅ Counter updates immediately
      },
    }));
  };

  const loadReplies = async ({ skip = 0 }) => {
    hideReplies(); // Clear previous replies before loading new ones

    try {
      const { data } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/get-replies",
        { _id, skip }
      );

      if (data.replies.length === 0) return;

      // Ensure replies are at the correct nesting level
      const updatedReplies = data.replies.map((reply) => ({
        ...reply,
        childrenLevel: commentData.childrenLevel + 1,
      }));

      // Insert replies at the correct position
      let updatedCommentsArray = [...Comments_Array];
      updatedCommentsArray.splice(index + 1, 0, ...updatedReplies);

      commentData.isReplyLoaded = true; // Mark as loaded

      setBlogs((prev) => ({
        ...prev,
        comments: {
          ...prev.comments,
          results: updatedCommentsArray,
        },
      }));
    } catch (error) {
      console.error("Error loading replies:", error);
      toast.error("Failed to load replies. Try again!");
    }
  };

  const deleteComment = async (e) => {
    e.target.setAttribute("disabled", true);

    try {
      await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/delete-comment",
        { _id },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      // Remove from UI immediately
      removeCommentsCards(index, true);
      toast.success("Comment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment. Try again!");
    } finally {
      e.target.removeAttribute("disabled");
    }
  };

  const hideReplies = () => {
    commentData.isReplyLoaded = false;

    // Remove all replies related to this comment
    const filteredComments = Comments_Array.filter(
      (comment) => comment.childrenLevel <= commentData.childrenLevel
    );

    setBlogs((prev) => ({
      ...prev,
      comments: {
        ...prev.comments,
        results: filteredComments,
      },
    }));
  };

  const handleReplyClick = () => {
    if (!access_token) {
      return toast.error("login first to leave a reply");
    }

    setReplying((preVal) => !preVal);
  };
  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rounded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          <img src={profile_img} className="w-6 h-6 rounded-full" />
          <p className="line-clamp-1">
            {fullname} @{commented_by_username}
          </p>
          <p className="min-w-fit">{getDay(commentedAt)}</p>
        </div>
        <p className="font-gelasio text-xl ml-3">{comment}</p>
        <div className="flex gap-5 text-xl mt-5">
          {commentData.isReplyLoaded ? (
            <button
              onClick={hideReplies}
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md items-center gap-2"
            >
              <i className="fi fi-rs-comment-dots"></i> Hide reply
            </button>
          ) : (
            children.length > 0 && (
              <button
                onClick={() => loadReplies({ skip: 0 })}
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md items-center gap-2"
              >
                <i className="fi fi-rs-comment-dots"></i> {children.length}{" "}
                Reply
              </button>
            )
          )}
          <button onClick={handleReplyClick} className="underline">
            Reply
          </button>
          {(username === commented_by_username || username === blog_author) && (
            <button
              className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
              onClick={deleteComment}
            >
              <i className="fi fi-rr-trash pointer-events-none"></i>
            </button>
          )}
        </div>

        {isReplying ? (
          <div className="mt-8">
            <CommentField
              action="reply"
              index={index}
              replyingTo={_id}
              setReplying={setReplying}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default CommentCard;
