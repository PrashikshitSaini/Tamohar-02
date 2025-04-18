import React, { useState, useEffect } from "react";
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

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [notificationTime, setNotificationTime] = useState("08:00");
  // eslint-disable-next-line
  const [animationDirection, setAnimationDirection] = useState("forward");
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Using images from public folder
  const images = [
    `${process.env.PUBLIC_URL}/logo192.png`,
    `${process.env.PUBLIC_URL}/logo192.png`,
    `${process.env.PUBLIC_URL}/logo192.png`,
  ];

  // Define the slides content
  const slides = [
    {
      title: "Welcome to तमोहर",
      subtitle: "Daily Wisdom from the Bhagavad Gita",
      description:
        "Tamohar is designed for busy professionals and students who want to access the timeless wisdom of the Bhagavad Gita in just 5 minutes a day.",
      image: images[0],
      icon: <FaBookOpen className="slide-icon" />,
    },
    {
      title: "Your Daily Spiritual Practice",
      subtitle: "One Shlok at a Time",
      description:
        "Each day, receive a new verse (shlok) with its meaning and practical application. Save your favorites and build a personal collection of wisdom that resonates with you.",
      image: images[1],
      icon: <FaClock className="slide-icon" />,
    },
    {
      title: "Start Your Journey",
      subtitle: "Begin Your Experience",
      description: user
        ? "Choose when you want to receive your daily shlok. Taking even a few minutes each day for spiritual reflection can transform your life."
        : "Create an account to save your favorite shloks and get daily notifications. Or continue as a guest to explore today's wisdom.",
      image: images[2],
      icon: <FaBell className="slide-icon" />,
    },
  ];

  // Add transition control
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Match this to your CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Handle next slide button
  const nextSlide = () => {
    // Prevent multiple clicks during transition
    if (isTransitioning) return;

    if (currentSlide < slides.length - 1) {
      setIsTransitioning(true);
      setAnimationDirection("forward");
      setCurrentSlide((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  // Handle previous slide button
  const prevSlide = () => {
    // Prevent multiple clicks during transition
    if (isTransitioning) return;

    if (currentSlide > 0) {
      setIsTransitioning(true);
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
    // Always set the localStorage flag first to ensure it gets set even if there's an error
    localStorage.setItem("tamohar_hasVisited", "true");

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
        // Continue to navigate even if there's an error
      }
    }

    // Navigate to the main app
    navigate("/");
  };

  // Handle sign up button for non-authenticated users
  const goToSignUp = () => {
    localStorage.setItem("tamohar_hasVisited", "true");
    navigate("/signup");
  };

  // Handle continue as guest
  const continueAsGuest = () => {
    localStorage.setItem("tamohar_hasVisited", "true");
    navigate("/");
  };

  // Go directly to a specific slide
  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;

    setIsTransitioning(true);
    setAnimationDirection(index > currentSlide ? "forward" : "backward");
    setCurrentSlide(index);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            role="button"
            tabIndex={0}
          />
        ))}
      </div>

      <div className="slide-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide-content ${
              index === currentSlide
                ? "active"
                : index < currentSlide
                ? "prev"
                : "next"
            }`}
          >
            <div className="slide-image-container">
              {/* Use regular img tag instead of background-image for better loading */}
              <img
                src={slide.image}
                alt={slide.title}
                className="slide-image"
                onError={(e) => {
                  // Fallback to default image if loading fails
                  e.target.src = `${process.env.PUBLIC_URL}/logo192.png`;
                }}
              />
              <div className="slide-image-overlay"></div>
              <div className="slide-icon-wrapper">{slide.icon}</div>
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
                    <FaUserPlus /> Sign Up
                  </button>
                  <button onClick={continueAsGuest} className="btn-outline">
                    <FaSignInAlt /> Continue as Guest
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="onboarding-actions">
        {currentSlide > 0 && (
          <button
            className="btn-prev"
            onClick={prevSlide}
            disabled={isTransitioning}
          >
            <FaArrowLeft /> Back
          </button>
        )}

        {currentSlide < slides.length - 1 ? (
          <button
            className="btn-next"
            onClick={nextSlide}
            disabled={isTransitioning}
          >
            Next <FaArrowRight />
          </button>
        ) : (
          <button className="btn-start" onClick={completeOnboarding}>
            Get Started <FaArrowRight />
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
