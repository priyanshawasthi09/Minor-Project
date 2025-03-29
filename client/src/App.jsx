import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
export const UserContext = createContext({});

// Layout Wrapper for pages that should have Navbar
const LayoutWithNavbar = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

const App = () => {
  const [userAuth, setUserAuth] = useState({});

  useEffect(() => {
    let userInSession = lookInSession("user");

    userInSession
      ? setUserAuth(JSON.parse(userInSession))
      : setUserAuth({ access_token: null });
  }, []);

  return (
    <UserContext.Provider value={{ userAuth, setUserAuth }}>
      <Routes>
        {/* Home, Sign-in, and Sign-up will have Navbar */}
        <Route
          index
          element={
            <LayoutWithNavbar>
              <HomePage />
            </LayoutWithNavbar>
          }
        ></Route>
        <Route
          path="/signin"
          element={
            <LayoutWithNavbar>
              <UserAuthForm type="sign-in" />
            </LayoutWithNavbar>
          }
        />
        <Route
          path="/signup"
          element={
            <LayoutWithNavbar>
              <UserAuthForm type="sign-up" />
            </LayoutWithNavbar>
          }
        />
        <Route
          path="/search/:query"
          element={
            <LayoutWithNavbar>
              <SearchPage />
            </LayoutWithNavbar>
          }
        />
        <Route
          path="/blog/:blog_id"
          element={
            <LayoutWithNavbar>
              <BlogPage />
            </LayoutWithNavbar>
          }
        />
        <Route
          path="user/:id"
          element={
            <LayoutWithNavbar>
              <ProfilePage />
            </LayoutWithNavbar>
          }
        />
        <Route
          path="*"
          element={
            <LayoutWithNavbar>
              <PageNotFound />
            </LayoutWithNavbar>
          }
        />

        {/* Editor page will NOT have Navbar */}
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </UserContext.Provider>
  );
};

export default App;
