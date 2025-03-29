import { Link } from "react-router-dom";
import { getFullDay } from "../common/date";

const AboutUser = ({ className, bio, social_links, joinedAt }) => {
  return (
    <div className={"md:w-[90%] md:mt-7 " + className}>
      <p className="text-xl leading-7">
        {bio.length ? bio : "Nothing to read here"}
      </p>

      <div className="flex gap-x-7 flex-wrap my-7 items-center text-dark-grey">
        {Object.keys(social_links).map((key) => {
          let link = social_links[key];

          if (!link) return null; // Skip empty links

          // Ensure all external links have "https://" prefix
          if (!link.startsWith("http")) {
            link = "https://" + link;
          }

          return link.startsWith("http") ? (
            <a href={link} key={key} target="_blank" rel="noopener noreferrer">
              <i
                className={
                  "fi " +
                  (key !== "website" ? "fi-brands-" + key : "fi-sr-globe") +
                  " text-2xl hover:text-black"
                }
              ></i>
            </a>
          ) : (
            <Link to={link} key={key}>
              <i
                className={
                  "fi " +
                  (key !== "website" ? "fi-brands-" + key : "fi-sr-globe")
                }
              ></i>
            </Link>
          );
        })}
      </div>
      <p className="text-xl leading-7 text-dark-grey">
        Joined on {getFullDay(joinedAt)}
      </p>
    </div>
  );
};

export default AboutUser;
