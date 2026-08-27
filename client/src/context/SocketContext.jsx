import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // In dev, proxy handles /socket.io, or connect directly to window.location.origin
    const socketInstance = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected to server with ID:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected from server');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  const joinRestaurant = (restaurantId) => {
    if (socketRef.current && restaurantId) {
      socketRef.current.emit('join_restaurant', restaurantId);
    }
  };

  const joinKitchen = (restaurantId) => {
    if (socketRef.current && restaurantId) {
      socketRef.current.emit('join_kitchen', restaurantId);
    }
  };

  const joinTable = (restaurantId, tableId) => {
    if (socketRef.current && restaurantId && tableId) {
      socketRef.current.emit('join_table', { restaurantId, tableId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinRestaurant, joinKitchen, joinTable }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
