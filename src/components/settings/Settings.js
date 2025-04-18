import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  db,
  auth,
  requestNotificationPermission,
  onMessageListener,
} from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import { sanitizeString, isValidTime } from "../../utils/sanitize";

const Settings = () => {
  const [user] = useAuthState(auth);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [validationError, setValidationError] = useState("");

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload) => {
        console.log("Received foreground message:", payload);
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/logo192.png",
        });
      })
      .catch((err) => console.error("Foreground notification error:", err));

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNotificationsEnabled(
            userData.preferences?.notificationsEnabled ?? true
          );
          setNotificationTime(
            userData.preferences?.notificationTime ?? "08:00"
          );
        }

        // Check notification permission status
        if (Notification.permission === "granted") {
          setNotificationStatus("Notification permission granted");
        } else if (Notification.permission === "denied") {
          setNotificationStatus("Notification permission denied by browser");
        } else {
          setNotificationStatus("Notification permission not requested yet");
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  const handleTimeChange = (e) => {
    const time = e.target.value;

    // Clear any previous validation errors
    setValidationError("");

    // Validate time format before setting state
    if (!isValidTime(time)) {
      setValidationError("Please enter a valid time in HH:MM format.");
      return;
    }

    // Sanitize and set the time
    setNotificationTime(sanitizeString(time));
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    // Validate inputs before saving
    if (!isValidTime(notificationTime)) {
      setValidationError("Please enter a valid time in HH:MM format.");
      setSaveMessage("Cannot save: Invalid notification time format.");
      return;
    }

    // Clear any previous validation messages
    setValidationError("");

    try {
      // Request notification permission if enabling notifications
      if (notificationsEnabled) {
        console.log("Requesting notification permission...");
        const token = await requestNotificationPermission();
        console.log("FCM token received:", token ? "Success" : "Failed");

        if (!token) {
          setSaveMessage(
            "Notification permission denied or FCM token could not be generated. Please enable notifications in your browser settings."
          );
          return;
        }

        console.log("Saving FCM token to Firestore...");

        // Sanitize data before saving to Firestore
        const sanitizedTime = sanitizeString(notificationTime);

        // Save token to user document for server-side use
        await updateDoc(doc(db, "users", user.uid), {
          "preferences.notificationsEnabled": notificationsEnabled,
          "preferences.notificationTime": sanitizedTime,
          "preferences.fcmToken": token,
          "preferences.lastUpdated": new Date().toISOString(),
        });

        // Verify token was saved by reading it back
        const updatedUser = await getDoc(doc(db, "users", user.uid));
        const userData = updatedUser.data();
        if (userData?.preferences?.fcmToken === token) {
          console.log("FCM token successfully saved to Firestore");
        } else {
          console.error(
            "FCM token verification failed, token might not be saved correctly"
          );
        }

        setNotificationStatus(
          `Notifications enabled for ${sanitizedTime} UTC!`
        );
      } else {
        await updateDoc(doc(db, "users", user.uid), {
          "preferences.notificationsEnabled": notificationsEnabled,
          "preferences.notificationTime": sanitizeString(notificationTime),
          "preferences.lastUpdated": new Date().toISOString(),
        });
      }

      setSaveMessage(
        "Settings saved successfully! You will receive notifications at your selected time (UTC)."
      );
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage("Error saving settings. Please try again.");
    }
  };

  // Test notification function
  const sendTestNotification = async () => {
    try {
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setSaveMessage("Notification permission required");
          return;
        }
      }

      // Create a test notification
      new Notification("Tamohar Test Notification", {
        body: "This is a test notification from Tamohar. If you can see this, browser notifications are working on your device. Note: Scheduled notifications use FCM which is different from this test notification.",
        icon: "/logo192.png",
      });

      setSaveMessage(
        "Test notification sent! If you didn't see it, check your browser settings."
      );
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (error) {
      console.error("Error sending test notification:", error);
      setSaveMessage("Failed to send test notification: " + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {saveMessage && (
        <div
          className={`message ${
            saveMessage.includes("Error") || saveMessage.includes("Cannot save")
              ? "error"
              : "success"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="settings-card">
        <div className="settings-section">
          <h3>Notifications</h3>

          {notificationStatus && (
            <div className="notification-status">
              Status: {notificationStatus}
            </div>
          )}

          <div className="setting-item">
            <label htmlFor="notifications-toggle" className="toggle-label">
              Daily Notifications
              <div className="toggle-description">
                Receive a new Gita shlok every day
              </div>
            </label>

            <div className="toggle-switch">
              <input
                type="checkbox"
                id="notifications-toggle"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <label
                htmlFor="notifications-toggle"
                className="switch-label"
              ></label>
            </div>
          </div>

          {notificationsEnabled && (
            <div className="setting-item">
              <label htmlFor="notification-time" className="input-label">
                Notification Time
                <div className="input-description">
                  Choose when to receive your daily shlok (in UTC time)
                </div>
              </label>
              <input
                type="time"
                id="notification-time"
                value={notificationTime}
                onChange={handleTimeChange}
                aria-invalid={!!validationError}
              />
              {validationError && (
                <div className="validation-error">{validationError}</div>
              )}
              <div className="notification-note">
                Note: Make sure to convert your local time to UTC when setting
                notification time
              </div>
            </div>
          )}

          <button onClick={sendTestNotification} className="btn-secondary">
            Send Test Notification
          </button>
        </div>

        <button onClick={handleSaveSettings} className="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
