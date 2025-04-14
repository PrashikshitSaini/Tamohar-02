const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const admin = require("firebase-admin");
const cron = require("node-cron");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Import route handlers
const notificationRoutes = require("./routes/notifications");
const shlokRoutes = require("./routes/shloks");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  // Try to load from JSON file first
  serviceAccount = require("../credsTamohar.json");
  console.log("Firebase credentials loaded from credsTamohar.json");
} catch (error) {
  console.warn("Could not load credsTamohar.json:", error.message);

  // Fall back to environment variables
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  };
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.projectId}.appspot.com`,
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      `https://${serviceAccount.projectId}.firebaseio.com`,
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  process.exit(1);
}

// CORS configuration - allow requests from the frontend
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "https://tamohar.onrender.com"]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Configure CSP for different environments
const cspOptions = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "https://www.gstatic.com",
      "https://apis.google.com",
      "https://www.googleapis.com",
      process.env.NODE_ENV === "development" ? "'unsafe-eval'" : null, // Allow eval in development only
    ].filter(Boolean),
    styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: [
      "'self'",
      "https://firebasestorage.googleapis.com",
      "https://i.imgur.com",
      "https://static.vecteezy.com",
      "https://th.bing.com",
      "data:",
      "blob:",
    ],
    connectSrc: [
      "'self'",
      "https://*.firebaseio.com",
      "wss://*.firebaseio.com",
      "https://firestore.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://fcm.googleapis.com",
      "https://*.googleapis.com",
    ],
    frameSrc: ["'self'", "https://accounts.google.com"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'", "https://identitytoolkit.googleapis.com"],
    workerSrc: ["'self'", "blob:"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
  },
  reportOnly: process.env.NODE_ENV === "development", // In development, only report violations
  reportUri: "/csp-violation-report",
};

// Middleware
// Apply Helmet with CSP configuration
app.use(
  helmet({
    contentSecurityPolicy: cspOptions,
  })
);
app.use(cors(corsOptions)); // Enable CORS with configuration
app.use(
  express.json({
    verify: (req, res, buf) => {
      // Store raw body for signature verification if needed
      req.rawBody = buf.toString();
    },
  })
); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan("dev")); // HTTP request logging

// Endpoint to collect CSP violation reports
app.post("/csp-violation-report", (req, res) => {
  console.warn("CSP Violation:", req.body);
  res.status(204).end();
});

// XSS Protection middleware
app.use((req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    });
  }

  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  next();
});

// Helper function to sanitize user input
function sanitizeInput(input) {
  if (typeof input !== "string") {
    return input;
  }

  // Encode HTML special chars to prevent XSS
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Recursively sanitize objects
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return;
  }

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  });
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});
app.use("/api", apiLimiter);

// Routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/shloks", shlokRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Tamohar Backend is operational",
    version: "1.0.0",
    timestamp: new Date(),
  });
});

// Serve static frontend if in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, "../build")));

  // For any request not handled by the API, send the React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
}

// Schedule daily notification checks
// Check every minute instead of every hour to ensure notifications are sent at the exact time
cron.schedule("* * * * *", async () => {
  try {
    const {
      checkAndSendNotifications,
    } = require("./controllers/notificationController");
    console.log(`Running notification check at ${new Date().toISOString()}`);
    await checkAndSendNotifications();
  } catch (error) {
    console.error("Error in scheduled notification check:", error);
  }
});

// Handle errors
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Tamohar backend server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
