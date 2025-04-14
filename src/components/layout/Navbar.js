import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import {
  FaBookmark,
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Check if the current route matches the link
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/daily" className="navbar-logo">
          <span className="logo-text">तमोहर</span>
        </Link>

        {/* Mobile menu toggle button */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation menu - changes class based on mobile menu state */}
        <div className={`nav-menu ${mobileMenuOpen ? "active" : ""}`}>
          <Link
            to="/daily"
            className={`nav-link ${isActive("/daily") ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <FaHome /> <span>Daily Shlok</span>
          </Link>

          <Link
            to="/bookmarks"
            className={`nav-link ${isActive("/bookmarks") ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <FaBookmark /> <span>Bookmarks</span>
          </Link>

          <Link
            to="/settings"
            className={`nav-link ${isActive("/settings") ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <FaCog /> <span>Settings</span>
          </Link>

          <button onClick={handleLogout} className="nav-link logout-btn">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
