const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
    convertToPng,
    convertBufferToPng,
} = require("../functions/image-converter");
const {
    uploadToWasabi,
    downloadFromWasabi,
    deleteFromWasabi,
} = require("../functions/s3-utils");

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});

// Upload route
router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const originalName = req.file.originalname;
        const timestamp = Date.now();
        const filename = `${timestamp}-${originalName}`;

        // Upload original file to Wasabi
        await uploadToWasabi(
            req.file.buffer,
            `originals/${filename}`,
            req.file.mimetype
        );

        // Convert buffer to PNG
        const { buffer: convertedBuffer, stats } = await convertBufferToPng(
            req.file.buffer
        );
        const pngFilename = `${timestamp}-${path.parse(originalName).name}.png`;

        // Upload converted PNG to Wasabi
        await uploadToWasabi(
            convertedBuffer,
            `converted/${pngFilename}`,
            "image/png"
        );

        res.json({
            message: "File uploaded and converted successfully",
            original: {
                name: filename,
                url: `https://${process.env.WASABI_BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/originals/${filename}`,
            },
            converted: {
                name: pngFilename,
                url: `https://${process.env.WASABI_BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/converted/${pngFilename}`,
            },
            stats,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            error: "Failed to upload file",
            details: error.message,
        });
    }
});

// Download route
router.get("/download/:filename", async (req, res) => {
    try {
        const { type } = req.query; // 'original' or 'converted'
        const folder = type === "original" ? "originals" : "converted";
        const fileData = await downloadFromWasabi(
            `${folder}/${req.params.filename}`
        );

        const contentType =
            type === "original" ? "application/octet-stream" : "image/png";

        res.contentType(contentType);
        res.send(fileData);
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Failed to download file" });
    }
});

// Delete route
router.delete("/delete/:filename", async (req, res) => {
    try {
        const { type } = req.query; // 'original' or 'converted'
        const folder = type === "original" ? "originals" : "converted";
        await deleteFromWasabi(`${folder}/${req.params.filename}`);

        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

module.exports = router;
