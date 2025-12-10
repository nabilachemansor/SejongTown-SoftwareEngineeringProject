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
  const { student_id, birthdate, password } = req.body;

  // 1. Check all required fields
  if (!student_id || !birthdate || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // 2. Check if user already registered
    const existing = await client.query(
      "SELECT * FROM users WHERE student_id=$1",
      [student_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 3. Verify student in valid_students
    const valid = await client.query(
      "SELECT * FROM valid_students WHERE student_id=$1 AND birthdate=$2",
      [student_id, birthdate]
    );

    if (valid.rows.length === 0) {
      return res.status(403).json({
        message: "Student ID and Birth Date do not match Sejong University records."
      });
    }

    const student = valid.rows[0]; // name, email, department come from here

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Insert into users using verified info from valid_students
    const insertQuery = `
      INSERT INTO users (student_id, name, email, department, birthdate, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING student_id, name, email, department, birthdate
    `;

    const inserted = await client.query(insertQuery, [
      student.student_id,
      student.name,
      student.email,
      student.department,
      student.birthdate,
      hashedPassword
    ]);

    res.status(201).json({
      message: "Signup successful!",
      user: inserted.rows[0]
    });

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
        department: user.department,
        birthdate: user.birthdate,
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