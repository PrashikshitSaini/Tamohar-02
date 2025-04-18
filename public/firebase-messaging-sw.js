// Firebase Service Worker for background notifications
// Service workers don't support ES modules, so we use the older importScripts approach

importScripts(
  "https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "undefined",
  authDomain: "undefined",
  projectId: "undefined",
  storageBucket: "undefined",
  messagingSenderId: "undefined",
  appId: "undefined",
  measurementId: "undefined",
};

// Initialize Firebase with strict CSP-compliant approach
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage(function (payload) {
    console.log(
      "[firebase-messaging-sw.js] Received background message ",
      payload
    );

    // Sanitize notification data
    const notificationTitle = payload.notification?.title || "Tamohar";
    const notificationBody =
      payload.notification?.body || "New message from Tamohar";

    const notificationOptions = {
      body: notificationBody,
      icon: "/logo192.png",
      data: payload.data || {},
      tag: "tamohar-notification", // Group similar notifications
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Handle notification clicks
  self.addEventListener("notificationclick", function (event) {
    console.log("[firebase-messaging-sw.js] Notification click: ", event);
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
        })
        .then(function (clientList) {
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url === "/" && "focus" in client) return client.focus();
          }
          if (clients.openWindow) return clients.openWindow("/");
        })
    );
  });
} catch (error) {
  console.error(
    "[firebase-messaging-sw.js] Firebase initialization error:",
    error
  );
}
