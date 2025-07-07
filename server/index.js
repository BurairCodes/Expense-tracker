import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Try to connect to MongoDB, but don't fail if it's not available
  try {
    const connectDB = await import('./config/database.js');
    await connectDB.default();
  } catch (error) {
    console.log('MongoDB not available, using in-memory storage');
  }

  // Import routes
  const expenseRoutes = await import('./routes/expenses.js');
  const incomeRoutes = await import('./routes/income.js');
  const scheduledRoutes = await import('./routes/scheduled.js');

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../public')));

  // Routes
  app.use('/api/expenses', expenseRoutes.default);
  app.use('/api/income', incomeRoutes.default);
  app.use('/api/scheduled', scheduledRoutes.default);

  // Serve the main HTML file for the root route
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
  });
}

// Start the server
startServer().catch(console.error);