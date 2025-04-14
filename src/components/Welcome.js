import React from "react";
import { Link } from "react-router-dom";

const Welcome = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="logo-container">
          <h1>Tamohar</h1>
          <p className="tagline">Daily wisdom from the Bhagavad Gita</p>
        </div>

        <div className="welcome-features">
          <h2>Begin Your Spiritual Journey</h2>
          <ul>
            <li>
              <span className="icon">🔔</span>
              <span>Receive daily Gita shloks with meaning</span>
            </li>
            <li>
              <span className="icon">💡</span>
              <span>Learn practical applications in daily life</span>
            </li>
            <li>
              <span className="icon">🔖</span>
              <span>Bookmark and take notes on your favorite teachings</span>
            </li>
            <li>
              <span className="icon">📱</span>
              <span>Get daily notifications to stay consistent</span>
            </li>
          </ul>
        </div>

        <div className="welcome-actions">
          <Link to="/signup" className="btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn-outline">
            Already have an account? Log In
          </Link>
        </div>

        <div className="sample-shlok">
          <h3>Sample Wisdom:</h3>
          <div className="sample-content">
            <p className="sanskrit">कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।</p>
            <p className="translation">
              "You have a right to perform your prescribed duties, but you are
              not entitled to the fruits of your actions."
            </p>
            <p className="chapter-verse">
              - Bhagavad Gita, Chapter 2, Verse 47
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
