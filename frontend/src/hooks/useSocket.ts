import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, getAccessToken, onAccessTokenChange } from '@/services/api';

// Same origin as the API. In development that's the Vite dev server, which
// proxies /socket.io to the backend (see vite.config.ts).
const SOCKET_URL = API_ORIGIN || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL as string, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      withCredentials: true,
    });
  }
  return socket;
}

export function useSocketRoom(
  _room: string,
  joinEvent: string,
  leaveEvent: string,
  roomId: string,
  listeners: Record<string, (...args: any[]) => void>
) {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const s = socketRef.current;
    const join = () => s.emit(joinEvent, roomId);
    join();
    s.on('connect', join); // re-join after a reconnect (rooms are lost when the connection drops)
    Object.entries(listeners).forEach(([event, handler]) => s.on(event, handler));
    return () => {
      s.emit(leaveEvent, roomId);
      s.off('connect', join);
      Object.entries(listeners).forEach(([event, handler]) => s.off(event, handler));
    };
  }, [roomId]);
}

// Joins the signed-in user's private notification room. The server reads the
// user id from the access token. (Before, the token was never sent, so the
// server ignored the request and live notifications never arrived.)
export function useUserRoom(userId: string | undefined, onNotification: (n: any) => void) {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;
    const s = getSocket();
    const join = () => {
      const token = getAccessToken();
      if (token) s.emit('join-user', { token });
    };
    const handler = (n: any) => handlerRef.current(n);

    join();
    s.on('connect', join);
    s.on('notification', handler);
    const stopWatching = onAccessTokenChange((t) => { if (t) join(); });

    return () => {
      s.emit('leave-user');
      s.off('connect', join);
      s.off('notification', handler);
      stopWatching();
    };
  }, [userId]);
}
