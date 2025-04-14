import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { auth, db } from "./firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

// Components
import SignUp from "./components/auth/SignUp";
import Login from "./components/auth/Login";
import DailyShlok from "./components/shlok/DailyShlok";
import BookmarksList from "./components/bookmarks/BookmarksList";
import Navbar from "./components/layout/Navbar";
import Settings from "./components/settings/Settings";
import Onboarding from "./components/onboarding/Onboarding";
import "./App.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [isLowPowered, setIsLowPowered] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(true);

  // Check if user needs to see the onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        setUserDataLoading(true);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Show onboarding if this flag doesn't exist or is false
            setShowOnboarding(
              userData.preferences?.onboardingCompleted !== true
            );
          } else {
            // New user, show onboarding
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          // Default to showing onboarding if there's an error
          setShowOnboarding(true);
        } finally {
          setUserDataLoading(false);
        }
      } else {
        setUserDataLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  // Detect if we need to use low-power mode (battery, older devices, etc)
  useEffect(() => {
    // Check if this is a mobile device that might need reduced animations
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Check if running on Chrome mobile which has more performance constraints
    const isChromeMobile =
      isMobile &&
      /Chrome/i.test(navigator.userAgent) &&
      !/SamsungBrowser/i.test(navigator.userAgent);

    // Use reduced animations for Chrome mobile
    setIsLowPowered(isChromeMobile);

    // Add a class to the body for CSS targeting
    document.body.classList.toggle("low-power-mode", isChromeMobile);
  }, []);

  // Generate particles for animation - reduce count for low-powered devices
  const renderParticles = () => {
    const particles = [];
    const particleCount = isLowPowered ? 6 : 12;

    for (let i = 0; i < particleCount; i++) {
      particles.push(<div key={`particle-${i}`} className="particle"></div>);
    }
    return particles;
  };

  // Generate dust particles - reduce count for low-powered devices
  const renderDustParticles = () => {
    const particles = [];
    const particleCount = isLowPowered ? 5 : 15;

    for (let i = 0; i < particleCount; i++) {
      particles.push(<div key={`dust-${i}`} className="dust-particle"></div>);
    }
    return particles;
  };

  // Generate floating orbs
  const renderOrbs = () => {
    return (
      <>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </>
    );
  };

  if (loading || userDataLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        {/* Enhanced background animations - conditional rendering based on device capability */}
        <div className="cosmic-background">
          <div className="nebula nebula-1"></div>
          {!isLowPowered && <div className="nebula nebula-2"></div>}
          {!isLowPowered && <div className="nebula nebula-3"></div>}
          <div className="stars"></div>
        </div>

        {/* Conditionally render animations based on device capability */}
        <div className="wave-container">
          <div className="wave"></div>
          {!isLowPowered && <div className="wave"></div>}
          {!isLowPowered && <div className="wave"></div>}
        </div>

        <div className="aurora-container">
          <div className="aurora"></div>
          {!isLowPowered && <div className="aurora"></div>}
        </div>

        {!isLowPowered && <div className="breath-circle"></div>}

        <div className="lotus-animation"></div>
        <div className="cosmic-particles">{renderParticles()}</div>
        <div className="cosmic-dust">{renderDustParticles()}</div>
        {!isLowPowered && renderOrbs()}

        {/* Sacred geometry is particularly heavy, conditionally render it */}
        {!isLowPowered && (
          <div className="sacred-geometry">
            <div className="inner-circle"></div>
            <div className="flower-of-life"></div>
          </div>
        )}

        {/* Show onboarding or main app based on state */}
        {user && showOnboarding ? (
          <Onboarding />
        ) : (
          <>
            <Navbar />
            <main className="container spiritual-pattern">
              <Routes>
                <Route path="/" element={<DailyShlok />} />
                <Route
                  path="/login"
                  element={!user ? <Login /> : <Navigate to="/" />}
                />
                <Route
                  path="/signup"
                  element={!user ? <SignUp /> : <Navigate to="/" />}
                />
                <Route
                  path="/bookmarks"
                  element={user ? <BookmarksList /> : <Navigate to="/login" />}
                />
                <Route
                  path="/settings"
                  element={user ? <Settings /> : <Navigate to="/login" />}
                />
                <Route path="/daily" element={<DailyShlok />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
