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

// GET EVENTS A USER IS REGISTERED FOR
router.get("/:student_id/attendances", async (req, res) => {
    const { student_id } = req.params;

    try {
        const result = await client.query(
            `SELECT e.event_id, e.title, e.category, e.event_date, e.event_time, e.location, e.poster_path, e.capacity, e.slots_left, e.description,
            COUNT(a2.student_id) AS registered
            FROM events e
            LEFT JOIN attendances a2 ON e.event_id = a2.event_id
            WHERE e.event_id IN (
                SELECT event_id FROM attendances WHERE student_id = $1
            )
            GROUP BY e.event_id;
            `,
            [student_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch attendances" });
    }
});

export default router;