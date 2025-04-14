import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { sanitizeString, isValidEmail } from "../../utils/sanitize";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    // Validate password strength
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain at least one number";
    }

    // Validate password match
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
    setPassword(e.target.value); // Don't sanitize passwords - they can contain special chars
    if (validationErrors.password) {
      setValidationErrors((prev) => ({ ...prev, password: null }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (validationErrors.confirmPassword) {
      setValidationErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate all inputs before proceeding
    if (!validateInputs()) {
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(), // Trim to remove any whitespace
        password
      );
      const user = userCredential.user;

      // Create user document in Firestore with sanitized email
      await setDoc(doc(db, "users", user.uid), {
        email: sanitizeString(user.email),
        createdAt: new Date(),
        bookmarks: [],
        preferences: { notificationsEnabled: true },
      });

      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError(
          "Email already in use. Please use a different email or log in."
        );
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError(error.message);
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create or update user document with sanitized data
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: sanitizeString(user.email),
          createdAt: new Date(),
          bookmarks: [],
          preferences: { notificationsEnabled: true },
        },
        { merge: true }
      );

      navigate("/");
    } catch (error) {
      setError("Error signing up with Google. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up</h2>
        <p>Join Tamohar to receive daily wisdom from the Bhagavad Gita</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailSignUp}>
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
              minLength="8"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              aria-invalid={!!validationErrors.confirmPassword}
              aria-describedby={
                validationErrors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
            />
            {validationErrors.confirmPassword && (
              <div id="confirm-password-error" className="validation-error">
                {validationErrors.confirmPassword}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating Account..." : "Sign Up with Email"}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="btn-google"
        >
          Sign Up with Google
        </button>

        <p className="auth-redirect">
          Already have an account? <a href="/login">Log In</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
