require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const cron = require("node-cron");
const webPush = require("web-push");
const db = require("./db");
const notificationRoutes = require("./routes/notifications");

const app = express();
app.use(express.json());

/* ===============================
   ✅ CONFIGURE VAPID
=============================== */
webPush.setVapidDetails(
  "mailto:indianstrangerschat@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/* ===============================
   ✅ SMART CORS CONFIG (FIXED)
=============================== */

const allowedDomains = [
  "strangerschat.fun",
    "strangerschat.fun/",

  "www.strangerschat.fun",
  "https://strangerschat.fun/",
  "strangchat.in",
  "www.strangchat.in",
  "strange-frontend-updated2.vercel.app",
  "localhost"
];

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin);
    return allowedDomains.includes(url.hostname);
  } catch (err) {
    return false;
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/* ===============================
   ✅ INIT DB
=============================== */
async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS night_club_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      endpoint VARCHAR(255) NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Table ready");
}
initDB();

/* ===============================
   ✅ HEALTH CHECK
=============================== */
app.get("/", (req, res) => {
  res.status(200).send("🚀 StrangerChat Socket Server Running");
});

/* ===============================
   ✅ ROUTES
=============================== */
app.use("/api", notificationRoutes);

/* ===============================
   ✅ SERVER
=============================== */
const server = http.createServer(app);

/* ===============================
   ✅ SOCKET.IO (MATCH SAME CORS)
=============================== */
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback("Socket CORS blocked");
      }
    },
    credentials: true
  }
});

require("./socket/chat")(io);
require("./socket/nightclub")(io);

/* ===============================
   ⏰ CRON JOB (IST 10PM)
=============================== */
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
          console.error("❌ Push failed:", err.statusCode);

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
  { timezone: "Asia/Kolkata" }
);

/* ===============================
   ✅ START SERVER
=============================== */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
});