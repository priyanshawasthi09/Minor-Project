import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../imgs/logo.png";
import { UserContext } from "../App";
import UserNavigationPanel from "./user-navigation.component";

const Navbar = () => {
  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);
  const navigate = useNavigate();
  const {
    userAuth,
    userAuth: { access_token, profile_img },
  } = useContext(UserContext);

  const handleUserNavPanel = () => {
    setUserNavPanel((currentVal) => !currentVal);
  };

  const handleSearch = (e) => {
    let query = e.target.value;

    if (e.keyCode == 13 && query.length) {
      navigate(`/search/${query}`);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setUserNavPanel(false);
    }, 200);
  };

  return (
    <nav className="navbar flex items-center justify-between px-4 py-2 bg-white">
      {/* Logo */}
      <Link to="/" className="flex-none w-10">
        <img src={logo} className="w-10" alt="Logo" />
      </Link>

      {/* Search Bar */}
      <div
        className={`relative w-full max-w-md transition-all duration-300 ${
          searchBoxVisibility ? "block" : "hidden md:block"
        }`}
      >
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-grey p-4 pl-12 pr-4 rounded-full placeholder:text-dark-grey focus:outline-none"
          onKeyDown={handleSearch}
        />
        {/* Search Icon inside Input */}
        <i className="fi fi-rr-search absolute left-4 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3 md:gap-6 ml-auto">
        {/* Mobile Search Button */}
        <button
          className="md:hidden bg-grey w-12 h-12 rounded-full"
          onClick={() => setSearchBoxVisibility((prev) => !prev)}
        >
          <i className="fi fi-rr-search text-xl"></i>
        </button>

        {/* Write Button */}
        <Link to="/editor" className="hidden md:flex gap-2 link">
          <i className="fi fi-rr-file-edit"></i>
          <p>Write</p>
        </Link>

        {access_token ? (
          <>
            {/* Notification Button */}
            <Link to="/dashboard/notification">
              <button className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10">
                <i className="fi fi-rr-bell text-2xl block mt-1"></i>
              </button>
            </Link>

            {/* User Profile */}
            <div
              className="relative"
              onClick={handleUserNavPanel}
              onBlur={handleBlur}
            >
              <button className="w-12 h-12 mt-1">
                <img
                  src={profile_img}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              </button>
              {userNavPanel && <UserNavigationPanel />}
            </div>
          </>
        ) : (
          <>
            <Link className="btn-dark py-2" to="/signin">
              Sign In
            </Link>
            <Link className="btn-light py-2 hidden md:block" to="/signup">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
