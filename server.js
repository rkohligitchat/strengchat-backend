
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const cron = require("node-cron");
const webPush = require("web-push");
const db = require("./db");

const app = express();
const notificationRoutes = require("./routes/notifications");

// ===============================
// ✅ CONFIGURE VAPID KEYS (ONLY ONCE)
// ===============================
webPush.setVapidDetails(
  "mailto:indianstrangerschat@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ---------------- BASIC MIDDLEWARE ----------------
app.use(express.json());

// ---------------- CORS CONFIG ----------------
const allowedOrigins = [
  "https://strange-frontend-updated2.vercel.app",
  "https://strangerschat.fun",
  "https://www.strangerschat.fun",
  "https://strangchat.in",
  "https://www.strangchat.in",
  "http://localhost:3000"
];



async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS night_club_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Table ready");
}

initDB();
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        return callback(new Error("CORS not allowed for this origin"));
      }

      return callback(null, true);
    },
    credentials: true
  })
);

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.status(200).send("🚀 StrangerChat Socket Server Running");
});

// ---------------- ATTACH NOTIFICATION ROUTES ----------------
app.use("/api", notificationRoutes);

// ---------------- CREATE HTTP SERVER ----------------
const server = http.createServer(app);

// ===============================
// ✅ CREATE ONLY ONE SOCKET.IO INSTANCE
// ===============================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// ===============================
// ✅ ATTACH SOCKET MODULES
// ===============================
require("./socket/chat")(io);
require("./socket/nightclub")(io);

// ===============================
// ⏰ DAILY 10PM NIGHT CLUB PUSH (IST)
// ===============================
cron.schedule(
  "0 22 * * *",
  async () => {
    console.log("⏰ 10PM Cron Triggered");

    try {
      const [rows] = await db.query(
        "SELECT endpoint, p256dh, auth FROM night_club_notifications"
      );

      if (!rows.length) {
        console.log("No subscriptions found.");
        return;
      }

      const payload = JSON.stringify({
        title: "🎉 Night Club is Open!",
        body: "Join now and meet new people!"
      });

      for (const sub of rows) {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload
          );
        } catch (err) {
          console.error("❌ Push failed full error:", {
            statusCode: err.statusCode,
            message: err.message,
            body: err.body
          });
          // Remove expired subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.query(
              "DELETE FROM night_club_notifications WHERE endpoint = ?",
              [sub.endpoint]
            );
          }
        }
      }

      console.log("✅ 10PM Notifications Sent");
    } catch (err) {
      console.error("❌ Cron crashed:", err);
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
});