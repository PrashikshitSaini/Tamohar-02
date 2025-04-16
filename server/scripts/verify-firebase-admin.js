/**
 * This script verifies that the Firebase Admin SDK is working correctly after update
 */
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Initialize Firebase Admin
try {
  console.log("🔍 Checking Firebase credentials...");

  // Try to load from JSON file first
  let serviceAccount;
  try {
    const credPath = path.resolve(__dirname, "../credsTamohar.json");
    if (fs.existsSync(credPath)) {
      serviceAccount = require(credPath);
      console.log("✅ Successfully loaded credentials from credsTamohar.json");
    } else {
      throw new Error("Credentials file does not exist");
    }
  } catch (error) {
    console.log(
      "⚠️ Could not load credsTamohar.json, falling back to environment variables"
    );

    // Verify environment variables are present
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error("❌ Missing FIREBASE_PROJECT_ID environment variable");
      process.exit(1);
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.error("❌ Missing FIREBASE_CLIENT_EMAIL environment variable");
      process.exit(1);
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.error("❌ Missing FIREBASE_PRIVATE_KEY environment variable");
      process.exit(1);
    }

    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };

    console.log("✅ Environment variables loaded successfully");
    console.log(`   Project ID: ${serviceAccount.projectId}`);
    console.log(
      `   Client Email: ${serviceAccount.clientEmail.substring(0, 5)}...`
    );
  }

  // Initialize with the credentials
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  process.exit(1);
}

// Test Firestore connection
async function testFirestore() {
  try {
    const snapshot = await admin.firestore().collection("test").limit(1).get();
    console.log("✅ Successfully connected to Firestore");
    return true;
  } catch (error) {
    console.error("❌ Firestore connection error:", error);
    return false;
  }
}

// Run tests
async function run() {
  console.log("🔍 Verifying Firebase Admin SDK v13 compatibility...");

  const firestoreWorks = await testFirestore();

  if (firestoreWorks) {
    console.log(
      "✅ All tests passed! Firebase Admin SDK v13 is working correctly."
    );
  } else {
    console.log("❌ Some tests failed. Please check the errors above.");
  }

  process.exit(0);
}

run();
