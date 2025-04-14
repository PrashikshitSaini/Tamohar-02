const admin = require("firebase-admin");
const { getDailyShlok } = require("./shlokController");

/**
 * Check all users for notification times and send notifications as needed
 * @returns {Promise<Object>} Result of the notification process
 */
const checkAndSendNotifications = async () => {
  console.log("Checking for notifications to send...");

  try {
    // Get current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, "0");
    const currentMinute = now.getUTCMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    console.log(`Current time (UTC): ${currentTime}`);

    // Find users with notifications enabled
    const usersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("preferences.notificationsEnabled", "==", true)
      .get();

    let usersToNotify = [];
    let totalNotificationsSent = 0;
    let errors = [];

    // Identify users who should receive notifications now
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userTime = userData.preferences?.notificationTime;

      if (userTime) {
        // Extract just hours and minutes for comparison
        const [userHour, userMinute] = userTime.split(":");
        const formattedUserTime = `${userHour.padStart(
          2,
          "0"
        )}:${userMinute.padStart(2, "0")}`;

        // Log for debugging
        console.log(
          `User ${doc.id} notification time: ${formattedUserTime}, current time: ${currentTime}`
        );

        if (formattedUserTime === currentTime) {
          console.log(
            `✅ Time match for user ${doc.id} - adding to notification list`
          );
          usersToNotify.push({ id: doc.id, ...userData });
        }
      }
    });

    console.log(`Found ${usersToNotify.length} users to notify`);

    if (usersToNotify.length === 0) {
      return {
        success: true,
        message: "No users scheduled for notifications at this time",
        totalProcessed: 0,
      };
    }

    // Get today's shlok - using getDailyShlok instead of getRandomShlok for consistency
    const todayShlok = await getDailyShlok();
    if (!todayShlok) {
      throw new Error("No shlok available to send");
    }

    // Prepare notification content
    const notificationTitle = "Your Daily Bhagavad Gita Shlok";
    const notificationBody = todayShlok.sanskrit
      ? `${todayShlok.chapter}:${
          todayShlok.verse
        } - ${todayShlok.sanskrit.substring(0, 50)}...`
      : "Time for your daily wisdom from the Bhagavad Gita";

    // Send notifications to each user
    for (const user of usersToNotify) {
      try {
        if (user.preferences?.fcmToken) {
          const message = {
            notification: {
              title: notificationTitle,
              body: notificationBody,
            },
            data: {
              chapter: todayShlok.chapter?.toString() || "1",
              verse: todayShlok.verse?.toString() || "1",
              click_action: "OPEN_DAILY_SHLOK",
            },
            token: user.preferences.fcmToken,
          };

          await admin.messaging().send(message);
          totalNotificationsSent++;
          console.log(`✅ Successfully sent notification to user ${user.id}`);
        } else {
          console.warn(
            `⚠️ User ${user.id} has notifications enabled but no FCM token`
          );
          errors.push(`User ${user.id} has no FCM token`);
        }
      } catch (error) {
        console.error(
          `❌ Error sending notification to user ${user.id}:`,
          error
        );
        errors.push(`Failed to send to ${user.id}: ${error.message}`);
      }
    }

    return {
      success: true,
      totalProcessed: usersToNotify.length,
      totalSent: totalNotificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error in checkAndSendNotifications function:", error);
    throw error;
  }
};

/**
 * Send a notification to a specific user
 * @param {string} userId The user ID to send notification to
 * @returns {Promise<Object>} Result of the notification sending attempt
 */
const sendNotificationToUser = async (userId) => {
  try {
    // Get the user from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const fcmToken = userData.preferences?.fcmToken;

    if (!fcmToken) {
      throw new Error("User has no FCM token saved");
    }

    // Get today's shlok - using getDailyShlok instead of getRandomShlok
    const shlok = await getDailyShlok();
    if (!shlok) {
      throw new Error("Could not get a shlok to send");
    }

    // Send the notification
    await admin.messaging().send({
      notification: {
        title: "Bhagavad Gita Daily Shlok",
        body: `Chapter ${shlok.chapter}, Verse ${shlok.verse}`,
      },
      data: {
        chapter: shlok.chapter.toString(),
        verse: shlok.verse.toString(),
        click_action: "OPEN_DAILY_SHLOK",
      },
      token: fcmToken,
    });

    return {
      message: `Successfully sent notification to user ${userId}`,
      shlok: {
        chapter: shlok.chapter,
        verse: shlok.verse,
      },
    };
  } catch (error) {
    console.error("Error sending notification to user:", error);
    throw error;
  }
};

module.exports = {
  checkAndSendNotifications,
  sendNotificationToUser,
};
