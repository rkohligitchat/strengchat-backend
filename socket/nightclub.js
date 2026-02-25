// socket/nightclub.js
module.exports = (io) => {
  // =====================
  // In-memory storage
  // =====================
  const users = {}; // socketId -> userData
  const activePrivateChats = {}; // roomId -> [socketId1, socketId2]

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // =====================
    // User joins club
    // =====================
    socket.on("join-club", (userData) => {
      if (!userData || !userData.nickname) return;

      users[socket.id] = {
        nickname: userData.nickname || "Anonymous",
        age: userData.age || null,
        gender: userData.gender || null,
        state: userData.state || null,
      };

      emitUserList();
    });

    // =====================
    // Group chat
    // =====================
    socket.on("group-message", (msgData) => {
      if (!msgData?.text) return;

      io.emit("group-message", {
        id: socket.id,
        nickname: users[socket.id]?.nickname || "Anonymous",
        text: msgData.text,
      });
    });

    // =====================
    // Start Private Chat (create room)
    // =====================
    socket.on("start-private-chat", ({ targetSocketId }) => {
      if (!targetSocketId || !users[targetSocketId]) return;

      const roomId = [socket.id, targetSocketId].sort().join("#");

      activePrivateChats[roomId] = [socket.id, targetSocketId];

      socket.join(roomId);
      io.sockets.sockets.get(targetSocketId)?.join(roomId);

      io.to(roomId).emit("private-chat-started", {
        roomId,
        users: activePrivateChats[roomId],
      });
    });

    // =====================
    // Private Message (inside room)
    // =====================
    socket.on("private-message", ({ roomId, message }) => {
      if (!roomId || !message) return;
      if (!activePrivateChats[roomId]) return;

      io.to(roomId).emit("private-message", {
        roomId,
        fromSocketId: socket.id,
        from: users[socket.id]?.nickname || "Anonymous",
        message,
      });
    });

    // =====================
    // End Private Chat (manual close)
    // =====================
    socket.on("end-private-chat", ({ roomId }) => {
      endPrivateRoom(roomId);
    });

    // =====================
    // Disconnect
    // =====================
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);

      // Remove user
      delete users[socket.id];

      // End any private chats they were in
      for (const roomId in activePrivateChats) {
        if (activePrivateChats[roomId].includes(socket.id)) {
          endPrivateRoom(roomId);
        }
      }

      emitUserList();
    });

    // =====================
    // Helpers
    // =====================
    function emitUserList() {
      io.emit(
        "update-user-list",
        Object.entries(users).map(([socketId, u]) => ({
          ...u,
          socketId,
        }))
      );
    }

    function endPrivateRoom(roomId) {
      if (!activePrivateChats[roomId]) return;

      io.to(roomId).emit("private-chat-ended");

      activePrivateChats[roomId].forEach((id) => {
        const s = io.sockets.sockets.get(id);
        if (s) s.leave(roomId);
      });

      delete activePrivateChats[roomId];
    }
  });
};