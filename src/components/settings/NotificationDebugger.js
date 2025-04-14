import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth, messaging } from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const NotificationDebugger = () => {
  const [user] = useAuthState(auth);
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swStatus, setSwStatus] = useState("Checking...");

  useEffect(() => {
    const checkServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        setSwStatus("Service Workers not supported in this browser");
        return;
      }

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
          setSwStatus("❌ No service workers registered");
          return;
        }

        const fcmServiceWorker = registrations.find(
          (reg) =>
            reg.scope === window.location.origin + "/" ||
            reg.active?.scriptURL.includes("firebase-messaging-sw.js")
        );

        if (fcmServiceWorker) {
          setSwStatus(
            `✅ Firebase Messaging SW registered (${
              fcmServiceWorker.active ? "active" : "pending"
            })`
          );
        } else {
          setSwStatus("❌ Firebase Messaging SW not found");
        }
      } catch (error) {
        console.error("Error checking service worker:", error);
        setSwStatus(`❌ Error: ${error.message}`);
      }
    };

    const fetchDebugInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get user document
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setDebugInfo({ error: "User document not found" });
          return;
        }

        const userData = userDoc.data();
        const userPrefs = userData.preferences || {};

        // Permissions status
        const permissionStatus = Notification.permission;

        // Service worker status
        await checkServiceWorker();

        // Check if Firebase messaging is available
        const messagingSupported =
          "Notification" in window &&
          "serviceWorker" in navigator &&
          messaging !== null;

        setDebugInfo({
          userId: user.uid,
          notificationsEnabled: userPrefs.notificationsEnabled || false,
          notificationTime: userPrefs.notificationTime || "Not set",
          hasFcmToken: Boolean(userPrefs.fcmToken),
          tokenLength: userPrefs.fcmToken ? userPrefs.fcmToken.length : 0,
          lastUpdated: userPrefs.lastUpdated || "Never",
          browserPermission: permissionStatus,
          messagingSupported,
          currentLocalTime: new Date().toLocaleTimeString(),
          currentUTCTime: `${new Date()
            .getUTCHours()
            .toString()
            .padStart(2, "0")}:${new Date()
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")}`,
          browserInfo: navigator.userAgent,
        });
      } catch (error) {
        console.error("Error fetching debug info:", error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading notification debug info...</div>;
  }

  if (!user) {
    return (
      <div className="notification-debugger-message">
        Please log in to view notification debug info
      </div>
    );
  }

  return (
    <div className="notification-debugger">
      <h3>Notification Debugger</h3>

      <div className="debug-status">
        <h4>Service Worker Status:</h4>
        <div className={swStatus.includes("✅") ? "status-ok" : "status-error"}>
          {swStatus}
        </div>
      </div>

      {debugInfo && (
        <div className="debug-info">
          <h4>Notification Configuration:</h4>
          <ul>
            <li>
              <strong>Browser Notification Permission:</strong>{" "}
              <span
                className={`status-${
                  debugInfo.browserPermission === "granted" ? "ok" : "error"
                }`}
              >
                {debugInfo.browserPermission}
              </span>
            </li>
            <li>
              <strong>Firebase Messaging Supported:</strong>{" "}
              <span
                className={`status-${
                  debugInfo.messagingSupported ? "ok" : "error"
                }`}
              >
                {debugInfo.messagingSupported ? "Yes" : "No"}
              </span>
            </li>
            <li>
              <strong>FCM Token in Firestore:</strong>{" "}
              <span
                className={`status-${debugInfo.hasFcmToken ? "ok" : "error"}`}
              >
                {debugInfo.hasFcmToken ? "Yes" : "No"}
              </span>
              {debugInfo.hasFcmToken && (
                <span> (Length: {debugInfo.tokenLength} chars)</span>
              )}
            </li>
            <li>
              <strong>Notifications Enabled:</strong>{" "}
              <span
                className={`status-${
                  debugInfo.notificationsEnabled ? "ok" : "warning"
                }`}
              >
                {debugInfo.notificationsEnabled ? "Yes" : "No"}
              </span>
            </li>
            <li>
              <strong>Scheduled Time (UTC):</strong>{" "}
              {debugInfo.notificationTime}
            </li>
            <li>
              <strong>Current Time (UTC):</strong> {debugInfo.currentUTCTime}
            </li>
            <li>
              <strong>Last Settings Update:</strong> {debugInfo.lastUpdated}
            </li>
          </ul>
        </div>
      )}

      <div className="debug-actions">
        <button
          className="btn-secondary"
          onClick={() => window.location.reload()}
        >
          Refresh Status
        </button>
      </div>

      <div className="notification-tip">
        <strong>Tip:</strong> If you're not receiving notifications, try these
        steps:
        <ol>
          <li>Make sure notifications are allowed in your browser settings</li>
          <li>Verify that the service worker is properly registered</li>
          <li>Check that your FCM token is correctly saved to Firestore</li>
          <li>
            Ensure your server is continuously running at your specified
            notification time
          </li>
          <li>
            Try setting the notification time to 2-3 minutes in the future
          </li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationDebugger;
