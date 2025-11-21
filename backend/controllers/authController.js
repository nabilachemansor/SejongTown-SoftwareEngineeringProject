import express from "express";
import pkg from "pg";
import bcrypt from "bcrypt";

const { Client } = pkg;
const router = express.Router();

// PostgreSQL connection
const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "123456789",
  database: "sejong_town",
  port: 5432,
});
await client.connect();

// SIGN UP
router.post("/signup", async (req, res) => {
  const { student_id, name, email, password, department } = req.body;

  if (!student_id || !password || !email || !name || !department) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existing = await client.query(
      "SELECT * FROM users WHERE student_id=$1 OR email=$2",
      [student_id, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (student_id, email, password_hash, name, department)
       VALUES ($1, $2, $3, $4, $5)`,
      [student_id, email, hashedPassword, name, department]
    );

    res.status(201).json({ message: "Signup successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { student_id, password } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({ message: "Missing ID or password." });
  }

  try {
    const result = await client.query(
      "SELECT * FROM users WHERE student_id=$1",
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password." });
    }

    res.status(200).json({
      message: "Login successful!",
      user: {
        student_id: user.student_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
