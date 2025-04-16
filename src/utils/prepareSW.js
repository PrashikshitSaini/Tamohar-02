/**
 * This script prepares the service worker by injecting environment variables.
 * It reads the template service worker file and replaces placeholders with actual values.
 */
const fs = require("fs");
const path = require("path");

// Path to the service worker template and output
const swTemplatePath = path.join(
  __dirname,
  "../../public/firebase-messaging-sw.js"
);
const swOutputPath = path.join(
  __dirname,
  "../../public/firebase-messaging-sw.js"
);

// Read environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "undefined",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "undefined",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "undefined",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "undefined",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "undefined",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "undefined",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "undefined",
  vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || "undefined", // <— add this
};

// Security check for environment variables
let missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => value === "undefined")
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(
    `⚠️ Warning: Missing environment variables for service worker: ${missingVars.join(
      ", "
    )}`
  );

  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ Error: Missing required environment variables in production mode."
    );
    // Don't exit in production, as the build process must continue with placeholder values
  }
}

// Read the service worker template
fs.readFile(swTemplatePath, "utf8", (err, data) => {
  if (err) {
    console.error("❌ Error reading service worker template:", err);
    return;
  }

  // Replace placeholders with actual values
  let swContent = data
    .replace("__FIREBASE_API_KEY__", firebaseConfig.apiKey)
    .replace("__FIREBASE_AUTH_DOMAIN__", firebaseConfig.authDomain)
    .replace("__FIREBASE_PROJECT_ID__", firebaseConfig.projectId)
    .replace("__FIREBASE_STORAGE_BUCKET__", firebaseConfig.storageBucket)
    .replace(
      "__FIREBASE_MESSAGING_SENDER_ID__",
      firebaseConfig.messagingSenderId
    )
    .replace("__FIREBASE_APP_ID__", firebaseConfig.appId)
    .replace("__FIREBASE_MEASUREMENT_ID__", firebaseConfig.measurementId)
    .replace("__FIREBASE_VAPID_KEY__", firebaseConfig.vapidKey); // <— add this

  // Write the processed service worker file
  fs.writeFile(swOutputPath, swContent, "utf8", (err) => {
    if (err) {
      console.error("❌ Error writing service worker file:", err);
      return;
    }
    console.log("✅ Service worker prepared successfully!");
  });
});
