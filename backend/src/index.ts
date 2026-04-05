import 'dotenv/config';
import dns from 'dns';
import app from './app';
import { connectDB } from './database/mongoose';

// Force IPv4 first to avoid IPv6 connection issues with some databases/networks
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
