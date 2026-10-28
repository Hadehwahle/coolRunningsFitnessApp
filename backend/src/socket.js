import { Server } from "socket.io";
import { verifyAccessToken } from "./utils/tokens.js";

// Socket.io lives in its own module so controllers can emit events without
// importing server.js (which caused a circular import and made it impossible
// to load a controller in a script or test without starting the server).
let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((o) => o.trim()),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Public rooms
    socket.on("join-blog", () => socket.join("blog"));
    socket.on("leave-blog", () => socket.leave("blog"));
    socket.on("join-community", () => socket.join("community"));
    socket.on("leave-community", () => socket.leave("community"));
    socket.on("join-thread", (threadId) => {
      if (typeof threadId === "string" && threadId.length <= 64)
        socket.join(`thread:${threadId}`);
    });
    socket.on("leave-thread", (threadId) => socket.leave(`thread:${threadId}`));

    // Personal notification room. The client sends its access token and we take
    // the user id from the verified token, never from the client.
    socket.on("join-user", (payload) => {
      const token =
        typeof payload === "object" && payload
          ? payload.token
          : socket.handshake.auth?.token;
      if (!token) return;
      try {
        const decoded = verifyAccessToken(token);
        socket.join(`user:${decoded.id}`);
        socket.join("users"); // every signed-in user, for broadcast notifications
      } catch {
        // Invalid or expired token: ignore. The client re-joins after refreshing.
      }
    });
    socket.on("leave-user", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("user:") || room === "users") socket.leave(room);
      }
    });
  });

  return io;
}

// Safe emit: does nothing if sockets aren't running (scripts, tests).
export function emitTo(room, event, data) {
  if (io) io.to(room).emit(event, data);
}
