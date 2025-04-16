import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Register service worker for Firebase Cloud Messaging
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      // Configure the service worker with hardcoded backend URL
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        }
      );

      // You could potentially add hardcoded URLs to the registration context
      if (registration.active) {
        registration.active.postMessage({
          type: "CONFIGURE",
          backendUrl: "https://tamohar-02.onrender.com",
        });
      }

      console.log(
        "Firebase Service Worker registered with scope:",
        registration.scope
      );

      // Force update the service worker
      registration.update();
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  } else {
    console.warn(
      "Service workers are not supported in this browser. Push notifications may not work."
    );
  }
};

// Register service worker when the app loads
registerServiceWorker();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
