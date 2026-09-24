import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// The backend now requires a valid JWT on the socket handshake (see
// backend/src/lib/socket.ts) so unauthenticated clients can never join a task
// room. The token is refreshed from storage on every `getSocket()` call so
// reconnects always use the latest session.
export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : '/');

    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }

  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('token') || window.localStorage.getItem('access_token')
      : null;
  socket.auth = token ? { token } : {};
  return socket;
};
