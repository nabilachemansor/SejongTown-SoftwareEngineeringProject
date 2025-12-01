import express from 'express';
import pool from './backend/database/database.js';
import eventsRoutes from "./backend/routes/events.js";

const app = express();
app.use(express.json());

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
    console.log("Loaded password:", process.env.PG_PASSWORD);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection failed');
  }
});

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Events API
app.use("/events", eventsRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
