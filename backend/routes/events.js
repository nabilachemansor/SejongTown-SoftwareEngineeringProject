// import express from "express";
// import pool from "../database.js";
// import multer from "multer";

// const router = express.Router();

// // Create events
// // --- File Upload Setup ---
// const storage = multer.diskStorage({
//   destination: "uploads/posters",
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   }
// });
// const upload = multer({ storage });

import multer from "multer";
import path from "path";
import express from "express";
import pkg from 'pg';
const { Client } = pkg;

console.log("Events router loaded"); // DEBUG

const router = express.Router();

// PostgreSQL connection
const client = new Client({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "123456789",
  database: process.env.DB_NAME || "sejong_town",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});
await client.connect();

// Set storage options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder where files are stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// CREATE EVENT
router.post("/create-event", upload.single("poster"), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      event_date,
      event_time,
      location,
      capacity,
    } = req.body;

    // Poster path
    const poster_path = req.file ? req.file.path.replace(/\\/g, "/") : null

    // Organizer ID from logged-in user (for example, stored in session or JWT)
    const organizer_id = req.body.organizer_id; // make sure to pass this from frontend

    // Default slots_left = capacity
    const slots_left = capacity ? parseInt(capacity) : null;

    const result = await client.query(
      `INSERT INTO events 
       (title, description, category, event_date, event_time, location, capacity, slots_left, poster_path, organizer_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        title,
        description,
        category,
        event_date,
        event_time,
        location,
        capacity,
        slots_left,
        poster_path,
        organizer_id,
      ]
    );

    res.json({ message: "Event created successfully!", event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// GET EVENTS CREATED BY A USER
router.get("/created/:student_id", async (req, res) => {
  const { student_id } = req.params;
  console.log("Fetching created events for student_id:", student_id); // DEBUG

  try {
    const result = await client.query(
      `SELECT * FROM events WHERE organizer_id = $1 ORDER BY event_date ASC`,
      [student_id]
    );
    console.log("DB result:", result.rows); // DEBUG
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to fetch created events" });
    }
  }
});

// GET EVENT BY ID (FOR EDIT CREATE EVENT)
router.get("/:event_id", async (req, res) => {
  const { event_id } = req.params;

  try {
    const result = await client.query(
      `SELECT e.*, u.name AS organizer_name
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.student_id
       WHERE e.event_id = $1`,
      [event_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// UPDATE EVENT CREATED BY OURSELVES
router.put("/:event_id", upload.single("poster"), async (req, res) => {
  const { event_id } = req.params;
  const poster = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await client.query(
      `
      UPDATE events SET
        title = $1,
        description = $2,
        category = $3,
        event_date = $4,
        event_time = $5,
        location = $6,
        capacity = $7,
        poster_path = COALESCE($8, poster_path)
      WHERE event_id = $9
      `,
      [
        req.body.title,
        req.body.description,
        req.body.category,
        req.body.event_date,
        req.body.event_time,
        req.body.location,
        req.body.capacity,
        poster,
        event_id
      ]
    );

    res.json({ message: "Event updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// DELETE EVENT CREATED BY OURSELVES
router.delete("/:event_id", async (req, res) => {
  const { event_id } = req.params;

  try {
    await client.query("DELETE FROM events WHERE event_id = $1", [event_id]);
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// DISPLAY ALL EVENTS
router.get("/", async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        event_id, title, description, category,
        event_date, event_time, location,
        capacity, slots_left, registration_status,
        poster_path, organizer_id, created_at
      FROM events
      ORDER BY event_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// REGISTER FOR AN EVENT
router.post("/:event_id/register", async (req, res) => {
  const { event_id } = req.params;
  const { student_id } = req.body;

  try {
    await client.query(
      `INSERT INTO attendances (student_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [student_id, event_id]
    );

    await client.query(
      `UPDATE events
       SET slots_left = slots_left - 1
       WHERE event_id = $1 AND slots_left > 0`,
      [event_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register" });
  }
});

// CANCEL REGISTRATION FOR AN EVENT
router.delete("/:event_id/register", async (req, res) => {
  const { event_id } = req.params;
  const { student_id } = req.body;

  try {
    await client.query(
      `DELETE FROM attendances
       WHERE student_id = $1 AND event_id = $2`,
      [student_id, event_id]
    );

    await client.query(
      `UPDATE events
       SET slots_left = slots_left + 1
       WHERE event_id = $1`,
      [event_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel registration" });
  }
});

export default router;