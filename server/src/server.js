const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const ngoRoutes = require('./routes/ngoRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodBridge server running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ngos', ngoRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// The latest location is kept in memory so donors and NGO admins can see the
// most recent point even when they open the tracking page after pickup.
const liveLocations = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinTracking', ({ donationId } = {}) => {
    if (!donationId) return;

    const room = `tracking-room-${donationId}`;
    socket.join(room);

    const lastLocation = liveLocations.get(String(donationId));
    if (lastLocation) {
      socket.emit(`tracking-${donationId}`, lastLocation);
    }
  });

  socket.on('leaveTracking', ({ donationId } = {}) => {
    if (donationId) socket.leave(`tracking-room-${donationId}`);
  });

  socket.on('locationUpdate', (data = {}) => {
    const { donationId, latitude, longitude, accuracy, timestamp } = data;

    if (
      !donationId ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return;
    }

    const location = {
      donationId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : null,
      timestamp: timestamp || new Date().toISOString(),
    };

    liveLocations.set(String(donationId), location);
    io.to(`tracking-room-${donationId}`).emit(
      `tracking-${donationId}`,
      location
    );
  });

  socket.on('stopTracking', ({ donationId } = {}) => {
    if (donationId) socket.leave(`tracking-room-${donationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});