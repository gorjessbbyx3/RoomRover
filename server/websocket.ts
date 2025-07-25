
import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-property", (propertyId) => {
      socket.join(`property-${propertyId}`);
    });

    socket.on("join-admin", () => {
      socket.join("admin");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function notifyRoomUpdate(io: any, roomId: string, data: any) {
  io.emit("room-updated", { roomId, data });
}

export function notifyBookingUpdate(io: any, bookingId: string, data: any) {
  io.emit("booking-updated", { bookingId, data });
}

export function notifyInventoryAlert(io: any, propertyId: string, alert: any) {
  io.to(`property-${propertyId}`).emit("inventory-alert", alert);
  io.to("admin").emit("inventory-alert", alert);
}
