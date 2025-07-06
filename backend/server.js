const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS ayarları
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://emrendersoz.github.io",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API endpoints
app.get("/api/builds", (req, res) => {
  try {
    const buildsPath = path.join(__dirname, "data", "builds.json");
    if (!fs.existsSync(buildsPath)) {
      return res.status(404).json({ error: "Builds data not found" });
    }
    const builds = JSON.parse(fs.readFileSync(buildsPath, "utf8"));
    res.json(builds);
  } catch (error) {
    console.error("Error reading builds:", error);
    res.status(500).json({ error: "Failed to read builds data" });
  }
});

app.get("/api/skills", (req, res) => {
  try {
    const skillsPath = path.join(__dirname, "data", "skills.json");
    if (!fs.existsSync(skillsPath)) {
      return res.status(404).json({ error: "Skills data not found" });
    }
    const skills = JSON.parse(fs.readFileSync(skillsPath, "utf8"));
    res.json(skills);
  } catch (error) {
    console.error("Error reading skills:", error);
    res.status(500).json({ error: "Failed to read skills data" });
  }
});

app.get("/api/stats", (req, res) => {
  try {
    const statsPath = path.join(__dirname, "data", "stats.json");
    if (!fs.existsSync(statsPath)) {
      return res.status(404).json({ error: "Stats data not found" });
    }
    const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
    res.json(stats);
  } catch (error) {
    console.error("Error reading stats:", error);
    res.status(500).json({ error: "Failed to read stats data" });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "LoL Build Aggregator API",
    endpoints: ["/api/builds", "/api/skills", "/api/stats", "/health"],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
