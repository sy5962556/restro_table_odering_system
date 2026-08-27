let io = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    // Join Restaurant Staff Room
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`📡 Client ${socket.id} joined room: restaurant_${restaurantId}`);
      }
    });

    // Join Kitchen Staff Room
    socket.on('join_kitchen', (restaurantId) => {
      if (restaurantId) {
        socket.join(`kitchen_${restaurantId}`);
        console.log(`🍳 Client ${socket.id} joined room: kitchen_${restaurantId}`);
      }
    });

    // Join Table Room (for Customer Live Updates)
    socket.on('join_table', ({ restaurantId, tableId }) => {
      if (restaurantId && tableId) {
        socket.join(`table_${tableId}`);
        socket.join(`restaurant_${restaurantId}`);
        console.log(`🪑 Customer ${socket.id} joined table room: table_${tableId}`);
      }
    });

    // Leave rooms on disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized!');
  }
  return io;
};

// Helper broadcast functions
const emitToRestaurant = (restaurantId, event, data) => {
  if (io && restaurantId) {
    io.to(`restaurant_${restaurantId}`).emit(event, data);
  }
};

const emitToKitchen = (restaurantId, event, data) => {
  if (io && restaurantId) {
    io.to(`kitchen_${restaurantId}`).emit(event, data);
    io.to(`restaurant_${restaurantId}`).emit(event, data);
  }
};

const emitToTable = (tableId, event, data) => {
  if (io && tableId) {
    io.to(`table_${tableId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToRestaurant,
  emitToKitchen,
  emitToTable
};
