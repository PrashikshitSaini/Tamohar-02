import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import {
  db,
  auth,
  requestNotificationPermission,
} from "../../firebase/firebase";
import {
  FaArrowRight,
  FaArrowLeft,
  FaBell,
  FaBookOpen,
  FaClock,
  FaUserPlus,
  FaSignInAlt,
} from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import "./Onboarding.css";

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // Define the slides content
  const slides = [
    {
      title: "Welcome to तमोहर",
      subtitle: "Daily Wisdom from the Bhagavad Gita",
      description:
        "Tamohar is designed for busy professionals and students who want to access the timeless wisdom of the Bhagavad Gita in just 5 minutes a day.",
      icon: <FaBookOpen className="slide-icon" />,
    },
    {
      title: "Your Daily Spiritual Practice",
      subtitle: "One Shlok at a Time",
      description:
        "Each day, receive a new verse (shlok) with its meaning and practical application. Save your favorites and build a personal collection of wisdom that resonates with you.",
      icon: <FaClock className="slide-icon" />,
    },
    {
      title: "Start Your Journey",
      subtitle: "Begin Your Experience",
      description: user
        ? "Choose when you want to receive your daily shlok. Taking even a few minutes each day for spiritual reflection can transform your life."
        : "Create an account to save your favorite shloks and get daily notifications. Or continue as a guest to explore today's wisdom.",
      icon: <FaBell className="slide-icon" />,
    },
  ];

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
    // eslint-disable-next-line
  }, [currentSlide, slides.length]);

  // Navigate to previous slide
  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide]);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    console.log("Skip onboarding clicked");
    // Set localStorage flag
    localStorage.setItem("tamohar_hasVisited", "true");
    navigate("/");
  }, [navigate]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    console.log("Complete onboarding clicked");
    // Always set localStorage flag
    localStorage.setItem("tamohar_hasVisited", "true");

    if (user) {
      try {
        // Request notification permission if on last slide
        if (currentSlide === slides.length - 1) {
          const token = await requestNotificationPermission();

          // Update user preferences
          await updateDoc(doc(db, "users", user.uid), {
            "preferences.onboardingCompleted": true,
            "preferences.notificationTime": notificationTime,
            "preferences.notificationsEnabled": Boolean(token),
            "preferences.fcmToken": token || null,
            "preferences.lastUpdated": new Date().toISOString(),
          });
        } else {
          // Just mark as completed if skipping
          await updateDoc(doc(db, "users", user.uid), {
            "preferences.onboardingCompleted": true,
          });
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    }

    // Force navigate to home page
    window.location.href = "/";
    // eslint-disable-next-line
  }, [currentSlide, navigate, notificationTime, user, slides]);

  // Go to sign up
  const goToSignUp = useCallback(() => {
    console.log("Sign up clicked");
    localStorage.setItem("tamohar_hasVisited", "true");
    window.location.href = "/signup";
  }, []);

  // Continue as guest
  const continueAsGuest = useCallback(() => {
    console.log("Continue as guest clicked");
    localStorage.setItem("tamohar_hasVisited", "true");
    window.location.href = "/";
  }, []);

  return (
    <div className="onboarding">
      {/* Progress indicators */}
      <div className="progress-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${currentSlide === index ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="slide-content">
        <div className="slide-icon">{slides[currentSlide].icon}</div>
        <h1>{slides[currentSlide].title}</h1>
        <h2>{slides[currentSlide].subtitle}</h2>
        <p>{slides[currentSlide].description}</p>

        {/* Show time picker for authenticated users on last slide */}
        {currentSlide === 2 && user && (
          <div className="time-picker">
            <label htmlFor="time">
              When would you like to receive notifications?
            </label>
            <input
              type="time"
              id="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
            />
            <p className="note">You can change this later in Settings</p>
          </div>
        )}

        {/* Show auth buttons for non-authenticated users on last slide */}
        {currentSlide === 2 && !user && (
          <div className="auth-buttons">
            <button className="btn-primary" onClick={goToSignUp} type="button">
              <FaUserPlus /> Sign Up
            </button>
            <button
              className="btn-secondary"
              onClick={continueAsGuest}
              type="button"
            >
              <FaSignInAlt /> Continue as Guest
            </button>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="navigation">
        {currentSlide > 0 && (
          <button className="btn-back" onClick={prevSlide} type="button">
            <FaArrowLeft /> Back
          </button>
        )}

        {currentSlide < slides.length - 1 ? (
          <button className="btn-next" onClick={nextSlide} type="button">
            Next <FaArrowRight />
          </button>
        ) : (
          <button
            className="btn-start"
            onClick={completeOnboarding}
            type="button"
          >
            Get Started <FaArrowRight />
          </button>
        )}
      </div>

      {/* Skip button */}
      {currentSlide < slides.length - 1 && (
        <button className="btn-skip" onClick={skipOnboarding} type="button">
          Skip
        </button>
      )}
    </div>
  );
};

export default Onboarding;
