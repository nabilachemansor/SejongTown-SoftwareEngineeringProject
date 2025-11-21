import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import path from "path"
import { fileURLToPath } from "url"
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import attendanceRoutes from "./routes/attendance.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => res.send("SejongTown backend running!"));

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
