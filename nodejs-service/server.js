const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for easier development
    methods: ['GET', 'POST']
  }
});

// A simple in-memory store for room states
const roomTimers = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Broadcast how many people are in the room
    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit('room-users', roomSize);

    // If room has existing state, send it to the new user
    if (roomTimers[roomId]) {
      socket.emit('timer-sync', roomTimers[roomId]);
    }
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit('room-users', roomSize);
  });

  socket.on('timer-action', ({ roomId, action, payload }) => {
    // Expected actions: 'start', 'pause', 'reset', 'update-time'
    if (!roomTimers[roomId]) {
      roomTimers[roomId] = { isActive: false, timeLeft: 25 * 60, selectedMinutes: 25 };
    }

    if (action === 'start') {
      roomTimers[roomId].isActive = true;
    } else if (action === 'pause') {
      roomTimers[roomId].isActive = false;
    } else if (action === 'reset') {
      roomTimers[roomId].isActive = false;
      roomTimers[roomId].timeLeft = payload.selectedMinutes * 60;
      roomTimers[roomId].selectedMinutes = payload.selectedMinutes;
    } else if (action === 'update-time') {
      roomTimers[roomId].timeLeft = payload.timeLeft;
      roomTimers[roomId].isActive = payload.isActive;
    } else if (action === 'change-minutes') {
      roomTimers[roomId].selectedMinutes = payload.selectedMinutes;
      roomTimers[roomId].timeLeft = payload.selectedMinutes * 60;
    }

    // Broadcast the action to everyone else in the room
    socket.to(roomId).emit('timer-action', { action, payload, serverState: roomTimers[roomId] });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Ideally we would decrement room counts here if we knew which rooms they were in,
    // but Socket.io handles room leaving on disconnect automatically.
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Node.js Socket.IO server running on port ${PORT}`);
});
