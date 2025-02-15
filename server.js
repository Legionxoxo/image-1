require("dotenv").config();
const express = require("express");
const path = require("path");
const { configureSharp } = require("./src/config/sharp.config");
const imageRoutes = require("./src/routes/image.routes");
const indexRoute = require("./src/routes/index");
const fileRoutes = require("./src/routes/file.routes");

// Validate required environment variables
const requiredEnvVars = [
    "WASABI_ACCESS_KEY",
    "WASABI_SECRET_KEY",
    "WASABI_REGION",
    "WASABI_BUCKET_NAME",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(
        "Missing required environment variables:",
        missingEnvVars.join(", ")
    );
    process.exit(1);
}

// Configure Sharp
configureSharp();

const app = express();
const PORT = process.env.PORT || 3001;

// Add CORS headers with explicit port
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", `http://localhost:${PORT}`);
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Routes
app.use("/", indexRoute);
app.use("/api/image", imageRoutes);
app.use("/file", fileRoutes);

// Serve index.html for the root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        error: "Internal server error",
        details: err.message,
    });
});

// Update the server listener to be more informative
const server = app
    .listen(PORT, () => {
        const serverUrl = `http://localhost:${PORT}`;
        console.log(`Server running at ${serverUrl}`);
        console.log(`API endpoint: ${serverUrl}`);
    })
    .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            const nextPort = PORT + 1;
            console.log(`Port ${PORT} is busy, trying ${nextPort}`);
            server.listen(nextPort);
        } else {
            console.error("Server error:", err);
        }
    });
