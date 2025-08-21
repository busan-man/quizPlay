import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

let socket: Socket | null = null;

// Initialize Socket.IO connection
export const initSocket = (token?: string) => {
  if (socket) socket.disconnect();
  
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true
  });
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

// Get the socket instance (create if doesn't exist)
export const getSocket = (token?: string) => {
  if (!socket) {
    return initSocket(token);
  }
  return socket;
};

// Join a game room
export const joinGameRoom = (gameId: string, playerId?: string) => {
  if (!socket) return null;
  
  socket.emit('joinGame', { gameId, playerId });
  return socket;
};

// Leave a game room
export const leaveGameRoom = () => {
  if (!socket) return;
  
  socket.emit('leaveGame');
};

// Send next question (teacher only)
export const sendNextQuestion = () => {
  if (!socket) return;
  
  socket.emit('nextQuestion');
};

// Submit an answer
export const submitAnswer = (answer: string | string[], timeRemaining: number) => {
  if (!socket) return;
  
  socket.emit('submitAnswer', { answer, timeRemaining });
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  joinGameRoom,
  leaveGameRoom,
  sendNextQuestion,
  submitAnswer,
  disconnectSocket
};