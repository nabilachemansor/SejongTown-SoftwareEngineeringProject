import express from 'express';
const router = express.Router();
import pkg from 'pg';
const { Client } = pkg;

// PostgreSQL connection
const client = new Client({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "123456789",
    database: process.env.DB_NAME || "sejong_town",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});
await client.connect();

router.get("/:student_id", async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await db.query(
      `SELECT i.interest_id, i.name
       FROM user_interests ui
       JOIN interests i ON ui.interest_id = i.interest_id
       WHERE ui.student_id = $1`,
      [student_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user interests" });
  }
});

export default router;