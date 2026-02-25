const express = require("express");
const router = express.Router();
const webPush = require("web-push");
const db = require("../db");



// ===============================
// ✅ SAVE PUSH SUBSCRIPTION
// ===============================
router.post("/save-subscription", async (req, res) => {
  try {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }

    const { endpoint, keys } = subscription;

    // Save or ignore duplicate endpoint
    await db.query(
      `INSERT INTO night_club_notifications (endpoint, p256dh, auth)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       p256dh = VALUES(p256dh),
       auth = VALUES(auth)`,
      [endpoint, keys.p256dh, keys.auth]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Save subscription error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ===============================
// ✅ MANUAL TEST PUSH (Optional)
// ===============================
router.get("/send-test", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT endpoint, p256dh, auth FROM night_club_notifications"
    );

    if (!rows.length) {
      return res.status(400).json({ error: "No subscriptions found" });
    }

    const payload = JSON.stringify({
  title: "🎉 Night Club is Open!",
  body: "Join now and meet new people!",
  url: "https://strangerschat.fun/nightclub"
});

    for (const sub of rows) {
      try {
        await webPush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload);
      } catch (err) {
        console.error("Push failed for one user:", err.statusCode);

        // If subscription expired, delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.query(
            "DELETE FROM night_club_notifications WHERE endpoint = ?",
            [sub.endpoint]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Push route crashed:", err);
    res.status(500).json({ error: "Push failed" });
  }
});

module.exports = router;