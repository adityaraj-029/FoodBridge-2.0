import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  API_ORIGIN ||
  window.location.origin;

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;