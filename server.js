require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();

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

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests

      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS not allowed for this origin"));
      }

      return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  })
);

// ---------------- HEALTH CHECK ROUTE ----------------
app.get("/", (req, res) => {
  res.status(200).send("🚀 StrangerChat Socket Server Running");
});

// ---------------- CREATE HTTP SERVER ----------------
const server = http.createServer(app);

// ---------------- ATTACH SOCKET ----------------
const setupSocket = require("./socket/chat");
setupSocket(server);

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
});
