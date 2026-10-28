import 'dotenv/config';
import { createServer } from 'http';
import connectDB from './config/database.js';
import app from './app.js';
import { initSocket } from './socket.js';
import { runMigrations } from './utils/migrations.js';

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}

await connectDB();
await runMigrations().catch((err) => console.error('Migration failed:', err.message));

const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🔌 Socket.io ready');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  httpServer.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
