import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app, { connectDB } from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const peerRooms = new Map();

function getRoom(roomId) {
  if (!peerRooms.has(roomId)) {
    peerRooms.set(roomId, new Map());
  }
  return peerRooms.get(roomId);
}

function serializeParticipants(room) {
  return Array.from(room.values()).map((user) => ({
    userId: user.userId,
    role: user.role,
    status: user.status || 'connected'
  }));
}

connectDB()
  .then(() => {
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      socket.on('join-room', ({ roomId, userId, role }) => {
        if (!roomId || !userId) return;
        const room = getRoom(roomId);
        const existing = room.get(userId);
        if (existing) {
          existing.socketId = socket.id;
          existing.status = 'connected';
        } else {
          room.set(userId, { userId, role, socketId: socket.id, status: 'connected' });
        }

        socket.join(roomId);
        socket.emit('room-info', {
          roomId,
          participants: serializeParticipants(room)
        });
        socket.to(roomId).emit('participant-joined', { userId, role });
      });

      socket.on('signal', ({ roomId, to, from, payload }) => {
        if (!roomId || !to || !from || !payload) return;
        const room = getRoom(roomId);
        const target = room.get(to);
        if (!target) return;
        io.to(target.socketId).emit('signal', { from, payload });
      });

      socket.on('leave-room', ({ roomId, userId }) => {
        if (!roomId || !userId) return;
        const room = getRoom(roomId);
        const existing = room.get(userId);
        if (existing) {
          room.delete(userId);
          socket.to(roomId).emit('participant-left', { userId });
        }
        socket.leave(roomId);
        if (room.size === 0) peerRooms.delete(roomId);
      });

      socket.on('disconnect', () => {
        peerRooms.forEach((room, roomId) => {
          for (const [userId, user] of room.entries()) {
            if (user.socketId === socket.id) {
              user.status = 'disconnected';
              socket.to(roomId).emit('participant-left', { userId });
              room.delete(userId);
            }
          }
          if (room.size === 0) peerRooms.delete(roomId);
        });
      });
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
