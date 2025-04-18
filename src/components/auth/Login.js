import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { sanitizeString, isValidEmail } from "../../utils/sanitize";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const validateInputs = () => {
    const errors = {};

    // Validate email format
    if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Basic validation for password (must not be empty)
    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (e) => {
    setEmail(sanitizeString(e.target.value));
    // Clear error when typing
    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: null }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value); // Don't sanitize passwords
    if (validationErrors.password) {
      setValidationErrors((prev) => ({ ...prev, password: null }));
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate inputs first
    if (!validateInputs()) {
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      // Provide user-friendly error messages
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        setError(
          "Too many unsuccessful login attempts. Please try again later or reset your password."
        );
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create a new user document if it doesn't exist
        await setDoc(userDocRef, {
          email: sanitizeString(user.email),
          createdAt: new Date(),
          bookmarks: [],
          preferences: {
            notificationsEnabled: true,
            // Don't set onboardingCompleted flag to ensure new users see the onboarding
          },
        });
      }

      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log In</h2>
        <p>Sign in to access your daily Bhagavad Gita wisdom</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              required
              aria-invalid={!!validationErrors.email}
              aria-describedby={
                validationErrors.email ? "email-error" : undefined
              }
            />
            {validationErrors.email && (
              <div id="email-error" className="validation-error">
                {validationErrors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              aria-invalid={!!validationErrors.password}
              aria-describedby={
                validationErrors.password ? "password-error" : undefined
              }
            />
            {validationErrors.password && (
              <div id="password-error" className="validation-error">
                {validationErrors.password}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Logging In..." : "Log In with Email"}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-google"
        >
          Log In with Google
        </button>

        <p className="auth-redirect">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>

        <p className="auth-redirect">
          <a href="#password-reset">Forgot Password?</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
