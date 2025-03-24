import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";

const HomePage = () => {
  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        <div className="w-full">
          <InPageNavigation
            routes={["home", "trending blogs"]}
            defaultHidden={["trending blogs"]}
          >
            <h1>Latest Blogs here</h1>
            <h1>Trending Blogs here</h1>
          </InPageNavigation>
        </div>
        <div></div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
