import React, { useState } from "react";
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
} from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [animationDirection, setAnimationDirection] = useState("forward");
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // Define the slides content
  const slides = [
    {
      title: "Welcome to तमोहर",
      subtitle: "Daily Wisdom from the Bhagavad Gita",
      description:
        "Tamohar is designed for busy professionals and students who want to access the timeless wisdom of the Bhagavad Gita in just 5 minutes a day.",
      image:
        "https://static.vecteezy.com/system/resources/previews/022/692/148/large_2x/beautiful-image-of-lord-krishna-on-black-background-generative-ai-photo.jpeg", // Replace with actual Krishna image
      icon: <FaBookOpen className="slide-icon" />,
    },
    {
      title: "Your Daily Spiritual Practice",
      subtitle: "One Shlok at a Time",
      description:
        "Each day, receive a new verse (shlok) with its meaning and practical application. Save your favorites and build a personal collection of wisdom that resonates with you.",
      image:
        "https://th.bing.com/th/id/OIP.yDnf-zZNGGeEdIkTAMC5sAHaLH?rs=1&pid=ImgDetMain", // Replace with actual Bhagavad Gita image
      icon: <FaClock className="slide-icon" />,
    },
    {
      title: "Start Your Journey",
      subtitle: "Begin Your Experience",
      description: user
        ? "Choose when you want to receive your daily shlok. Taking even a few minutes each day for spiritual reflection can transform your life."
        : "Create an account to save your favorite shloks and get daily notifications. Or continue as a guest to explore today's wisdom.",
      image:
        "https://th.bing.com/th/id/OIP.TwOguRZHyrQjJm6nWtipJAHaEK?rs=1&pid=ImgDetMain", // Replace with actual meditation image
      icon: <FaBell className="slide-icon" />,
    },
  ];

  // Handle next slide button
  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setAnimationDirection("forward");
      setCurrentSlide((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  // Handle previous slide button
  const prevSlide = () => {
    if (currentSlide > 0) {
      setAnimationDirection("backward");
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // Skip onboarding
  const skipOnboarding = () => {
    completeOnboarding();
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    if (user) {
      try {
        // Request notification permission for final slide
        if (currentSlide === 2) {
          const token = await requestNotificationPermission();

          // Save user preferences
          await updateDoc(doc(db, "users", user.uid), {
            "preferences.onboardingCompleted": true,
            "preferences.notificationTime": notificationTime,
            "preferences.notificationsEnabled": Boolean(token),
            "preferences.fcmToken": token || null,
            "preferences.lastUpdated": new Date().toISOString(),
          });
        } else {
          // Just mark onboarding as completed if skipping
          await updateDoc(doc(db, "users", user.uid), {
            "preferences.onboardingCompleted": true,
          });
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    } else {
      // For non-authenticated users, simply continue to the app
      // localStorage flag is already set in App.js
    }

    // Navigate to the main app
    navigate("/");
  };

  // Handle sign up button for non-authenticated users
  const goToSignUp = () => {
    navigate("/signup");
  };

  // Handle continue as guest
  const continueAsGuest = () => {
    navigate("/");
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => {
              setAnimationDirection(
                index > currentSlide ? "forward" : "backward"
              );
              setCurrentSlide(index);
            }}
          />
        ))}
      </div>

      <div className="slide-container">
        <div
          className={`slide ${animationDirection}`}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="slide-content">
              <div
                className="slide-image"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="slide-image-overlay"></div>
                {slide.icon}
              </div>

              <div className="slide-text">
                <h2>{slide.title}</h2>
                <h3>{slide.subtitle}</h3>
                <p>{slide.description}</p>

                {index === 2 && user && (
                  <div className="notification-setup">
                    <label htmlFor="notification-time">
                      Select your preferred notification time:
                    </label>
                    <input
                      type="time"
                      id="notification-time"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                    />
                    <p className="time-note">
                      You can always change this later in settings
                    </p>
                  </div>
                )}

                {index === 2 && !user && (
                  <div className="auth-buttons">
                    <button onClick={goToSignUp} className="btn-primary">
                      Sign Up
                    </button>
                    <button onClick={continueAsGuest} className="btn-outline">
                      Continue as Guest
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding-actions">
        {currentSlide > 0 && (
          <button className="btn-prev" onClick={prevSlide}>
            <FaArrowLeft /> Back
          </button>
        )}

        {(!user || currentSlide < slides.length - 1) && (
          <button className="btn-next" onClick={nextSlide}>
            {currentSlide < slides.length - 1 ? "Next" : "Get Started"}{" "}
            <FaArrowRight />
          </button>
        )}
      </div>

      {currentSlide < slides.length - 1 && (
        <button className="btn-skip" onClick={skipOnboarding}>
          Skip
        </button>
      )}
    </div>
  );
};

export default Onboarding;
