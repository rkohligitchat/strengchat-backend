// const { Server } = require("socket.io");

module.exports = function setupSocket(io) { 
  let waitingUser = null;
  let onlineUsers = 0;

  io.on("connection", (socket) => {
    onlineUsers++;
    io.emit("online-users", onlineUsers);

    socket.partner = null;
    socket.isWaiting = false;

    console.log("USER CONNECTED:", socket.id);

    // ---------------- JOIN / MATCH ----------------
    socket.on("join", () => {
      if (!socket.connected) return;

      socket.emit("status", {
        type: "searching",
        message: "Searching for a stranger..."
      });

      if (socket.partner || socket.isWaiting) return;

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
      if (socket.partner && socket.partner.connected) {
        socket.partner.emit("status", {
          type: "disconnected",
          message: "Stranger left the chat"
        });

        socket.partner.partner = null;
        socket.partner.isWaiting = false;
      }

      socket.partner = null;
      socket.isWaiting = false;
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
