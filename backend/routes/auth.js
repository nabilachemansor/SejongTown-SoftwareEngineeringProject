// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');
// const User = require("../models/user"); // Adjust path if needed
// const bcrypt = require("bcrypt");

// // Signup
// router.post('/signup', authController.signup);

// // Login
// router.post('/login', async (req, res) => {
//   const { student_id, password } = req.body;
//   try {
//     const user = await User.findOne({ student_id });
//     if (!user) return res.status(401).json({ message: 'User not found' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

//     // set session
//     req.session.user = { student_id: user.studen_id, email: user.email, name: user.name };
//     req.session.lastActivity = Date.now();
//     res.json({ message: 'Login successful', profile: req.session.user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Protected endpoints with inactivity check
// router.use(['/logout', '/profile', '/auth/session'], inactivityChecker);
// // router.use(['/profile', '/auth/session'], inactivityChecker); //testing

// // Logout
// router.post('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) return res.status(500).json({ message: 'Logout failed' });
//     res.clearCookie('connect.sid');
//     res.json({ message: 'Logged out successfully' });
//   });
// });

// router.get('/auth/session', (req, res) => {
//   res.setHeader('Cache-Control', 'no-store');

//   const now = Date.now();

//   if (!req.session || !req.session.user) {
//     return res.status(440).json({ message: 'Session expired or not found' });
//   }

//   // Active session
//   return res.status(200).json({ loggedIn: true });
// });

// // Profile
// router.get('/profile', (req, res) => {
//   if (!req.session.user) return res.status(401).json({ message: 'Not authenticated' });
//   res.json({ user: req.session.user });
// });

// module.exports = router;

import express from 'express';
const router = express.Router();
import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';

// PostgreSQL connection
const client = new Client({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "123456789",
  database: process.env.DB_NAME || "sejong_town",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
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

    const match = await bcrypt.compare(password, user.password_hash);

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

// PROFILE
// GET user profile by student_id
router.get("/profile/:student_id", async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await client.query(
      "SELECT student_id, name, email, department FROM users WHERE student_id=$1",
      [student_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update profile
router.put("/profile/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { name, email, department } = req.body;

  try {
    const result = await client.query(
      `UPDATE users
       SET name=$1, email=$2, department=$3
       WHERE student_id=$4
       RETURNING student_id, name, email, department`,
      [name, email, department, studentId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile updated", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// INTERESTS SUBMISSION FORM
router.post("/interests", async (req, res) => {
  console.log("POST /interests HIT!", req.body); // <--- DEBUG

  const { student_id, interests } = req.body;

  if (!student_id || !interests || interests.length === 0) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const result = await client.query(
      `SELECT interest_id FROM interests WHERE name = ANY($1)`,
      [interests]
    );

    const interestIds = result.rows.map((row) => row.interest_id);

    await client.query(`DELETE FROM user_interests WHERE student_id = $1`, [student_id]);

    for (const interestId of interestIds) {
      await client.query(
        `INSERT INTO user_interests (student_id, interest_id)
         VALUES ($1, $2)`,
        [student_id, interestId]
      );
    }

    res.json({ message: "Interests updated successfully!" });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Error saving interests" });
  }
});



export default router;
