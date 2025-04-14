const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const {
  checkAndSendNotifications,
  sendNotificationToUser,
} = require("../controllers/notificationController");

/**
 * @route   GET /api/notifications/check
 * @desc    Manually trigger notification checks
 * @access  Public (should be protected in production)
 */
router.get("/check", async (req, res) => {
  try {
    await checkAndSendNotifications();
    res.json({
      success: true,
      message: "Notification check triggered successfully",
    });
  } catch (error) {
    console.error("Error in notification check:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/notifications/user/:userId
 * @desc    Send notification to a specific user
 * @access  Public (should be protected in production)
 */
router.post("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await sendNotificationToUser(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error sending notification to user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/notifications/debug
 * @desc    Debug endpoint to check notification configuration for a user
 * @access  Public (should be protected in production)
 */
router.get("/debug/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Debugging notifications for user: ${userId}`);

    // Get user document
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: `User ${userId} not found`,
      });
    }

    const userData = userDoc.data();
    const userPrefs = userData.preferences || {};

    // Check notification settings
    const debugInfo = {
      userId: userId,
      notificationsEnabled: userPrefs.notificationsEnabled || false,
      notificationTime: userPrefs.notificationTime || "Not set",
      hasFcmToken: Boolean(userPrefs.fcmToken),
      tokenLength: userPrefs.fcmToken ? userPrefs.fcmToken.length : 0,
      lastUpdated: userPrefs.lastUpdated || "Never",
      currentServerTime: new Date().toISOString(),
      currentUTCTime: `${new Date()
        .getUTCHours()
        .toString()
        .padStart(2, "0")}:${new Date()
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}`,
      // Don't include the full token in the response for security
      tokenFirstChars: userPrefs.fcmToken
        ? `${userPrefs.fcmToken.substring(0, 10)}...`
        : "None",
    };

    res.json({ success: true, debug: debugInfo });
  } catch (error) {
    console.error("Error in notification debug:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
