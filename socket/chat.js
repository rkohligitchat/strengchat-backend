// const { Server } = require("socket.io");

module.exports = function setupSocket(io) { 
  let waitingUser = null;
let baseUsers = 1215; // fake base users
let onlineUsers = baseUsers;const { getRandomBot, getBotReply } = require("./botSystem");
  io.on("connection", (socket) => {
    onlineUsers++;
    io.emit("online-users", onlineUsers);

    socket.partner = null;
    socket.isWaiting = false;
    socket.failedReplies = 0; // track consecutive unmatched messages

    console.log("USER CONNECTED:", socket.id);

    // ---------------- JOIN / MATCH ----------------
    socket.on("join", () => {
  if (!socket.connected) return;

  socket.emit("status", {
    type: "searching",
    message: "Searching for a stranger..."
  });

  if (socket.partner || socket.isWaiting) return;

  // ⭐ BOT CONNECTION CHANCE (added)
  if (!waitingUser && Math.random() < 0.9) {
    const bot = getRandomBot();
    socket.bot = bot;

    socket.emit("matched");

    socket.emit("status", {
      type: "matched",
      message: `${bot.name} connected`
    });

    return;
  }

  if (
    waitingUser &&
    waitingUser.id !== socket.id &&
    waitingUser.connected
  ) {
    // Match users
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.isWaiting = false;
    waitingUser.isWaiting = false;

    socket.emit("matched");
    waitingUser.emit("matched");

    socket.emit("status", {
      type: "matched",
      message: "You are now connected to a stranger"
    });

    waitingUser.emit("status", {
      type: "matched",
      message: "You are now connected to a stranger"
    });

    waitingUser = null;

  } else {
    waitingUser = socket;
    socket.isWaiting = true;

    socket.emit("status", {
      type: "waiting",
      message: "Waiting for another user..."
    });
  }
});

    // ---------------- TYPING ----------------
    socket.on("typing", (isTyping) => {
      if (socket.partner && socket.partner.connected) {
        socket.partner.emit("typing", isTyping);
      }
    });

    // ---------------- TEXT MESSAGE ----------------
   socket.on("message", (msg) => {

if (socket.bot) {
  const reply = getBotReply(msg, socket.bot) || "Hmm";

  const defaultReplies = ["okay", "hmm", "nice", "oh"];
  if (reply && defaultReplies.includes(reply.toLowerCase())) {
    socket.defaultReplyCount = (socket.defaultReplyCount || 0) + 1;
  } else {
    socket.defaultReplyCount = 0;
  }

  // ---------------- BOT THINKING + TYPING ----------------
  const thinkingDelay = 500 + Math.random() * 1000; // short pause before typing (0.5s–1.5s)
  const typingDuration = Math.min(Math.max(msg.length * 100, 1500), 4000); // typing duration based on message

  // 1️⃣ Start the “thinking” pause first
  setTimeout(() => {
    socket.emit("typing", true); // bot starts typing

    // 2️⃣ Send message after typingDuration
    setTimeout(() => {
      socket.emit("typing", false); // stop typing
      socket.emit("message", {
        sender: "stranger",
        type: "text",
        content: reply
      });

      // auto-disconnect after 3 consecutive default replies
      if (socket.defaultReplyCount >= 3) {
        setTimeout(() => {
          socket.emit("status", {
            type: "disconnected",
            message: "Chat ended. Start a new chat!"
          });

          socket.partner = null;
          socket.isWaiting = false;
          socket.bot = null;
          socket.defaultReplyCount = 0;
        }, 1000);
      }
    }, typingDuration);

  }, thinkingDelay);

  return;
}
  // ⭐ EXISTING REAL USER CHAT (unchanged)
  if (!socket.partner || !socket.partner.connected) return;

  socket.partner.emit("message", {
    sender: "stranger",
    type: "text",
    content: msg
  });

  socket.partner.emit("typing", false);
});

    // ---------------- IMAGE ----------------
    socket.on("sendImage", (imageData) => {
      if (!socket.partner || !socket.partner.connected) return;

      socket.partner.emit("receiveImage", imageData);
      socket.partner.emit("typing", false);
    });

    // ---------------- AUDIO ----------------
    socket.on("sendAudio", (audioData) => {
      if (!socket.partner || !socket.partner.connected) return;

      socket.partner.emit("receiveAudio", audioData);
      socket.partner.emit("typing", false);
    });

    // ---------------- END CHAT (without full disconnect) ----------------
    socket.on("endChat", () => {
  // Notify partner if exists
  if (socket.partner && socket.partner.connected) {
    socket.partner.emit("status", {
      type: "disconnected",
      message: "Stranger left the chat"
    });

    // Reset partner's state
    socket.partner.partner = null;
    socket.partner.isWaiting = false;

    // Allow partner to start a new chat
    socket.partner.emit("canStartChat", true);
  }

  // Reset current user's chat state
  socket.partner = null;
  socket.isWaiting = false;
  socket.bot = null;
  socket.defaultReplyCount = 0;

  // Notify user they can start a new chat
  socket.emit("status", {
    type: "disconnected",
    message: "Chat ended. You can start a new chat!"
  });
  socket.emit("canStartChat", true);
});

    // ---------------- DISCONNECT ----------------
    socket.on("disconnect", () => {
      onlineUsers = Math.max(onlineUsers - 1, 0);
      io.emit("online-users", onlineUsers);

      console.log("USER DISCONNECTED:", socket.id);

      // If partner exists, notify them
      if (socket.partner && socket.partner.connected) {
        socket.partner.emit("message", {
          sender: "system",
          text: "Stranger disconnected."
        });

        socket.partner.emit("status", {
          type: "disconnected",
          message: "Stranger left the chat"
        });

        socket.partner.partner = null;
        socket.partner.isWaiting = false;
      }

      // Remove from waiting queue if needed
      if (waitingUser && waitingUser.id === socket.id) {
        waitingUser = null;
      }

      socket.partner = null;
      socket.isWaiting = false;
    });
  });
};
