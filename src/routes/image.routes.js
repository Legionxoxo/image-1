const express = require("express");
const router = express.Router();
const path = require("path");
const { getValidImages } = require("../functions/file-utils");
const {
    createThumbnail,
    convertToPNG,
} = require("../functions/image-converter");
const multer = require("multer");
const { uploadToWasabi, getFromWasabi } = require("../functions/s3-utils");

const IMAGES_DIR = path.join(process.cwd(), "images");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/images", async (req, res) => {
    try {
        const validImages = await getValidImages(IMAGES_DIR);
        res.json(validImages);
    } catch (error) {
        console.error("Error reading images:", error);
        res.status(500).json({ error: "Failed to read images directory" });
    }
});

router.get("/original/:imageName", async (req, res) => {
    try {
        const imagePath = path.join(IMAGES_DIR, req.params.imageName);
        const thumbnail = await createThumbnail(imagePath);
        res.contentType("image/png");
        res.send(thumbnail);
    } catch (error) {
        console.error("Error serving original image:", error);
        res.status(404).json({ error: "Image not found or invalid" });
    }
});

router.get("/convert/:imageName", async (req, res) => {
    try {
        const imagePath = path.join(IMAGES_DIR, req.params.imageName);
        const { buffer, stats } = await convertToPNG(imagePath);

        console.log("\nConversion Stats:");
        console.log(`Original size: ${stats.size} KB`);
        console.log(`Original dimensions: ${stats.dimensions}`);
        console.log(`Original format: ${stats.format}`);
        console.log(`Converted size: ${stats.convertedSize} KB`);
        console.log(`Conversion time: ${stats.conversionTime}ms`);

        res.contentType("image/png");
        res.send(buffer);
    } catch (error) {
        console.error("Conversion error:", error);
        res.status(500).json({ error: "Failed to convert image" });
    }
});

router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload original file
        const originalKey = await uploadToWasabi(
            req.file.buffer,
            req.file.originalname,
            "original"
        );

        // Convert to PNG
        const pngBuffer = await convertToPNG(req.file.buffer);

        // Generate PNG filename
        const pngFilename = req.file.originalname.split(".")[0] + ".png";

        // Upload converted file
        const convertedKey = await uploadToWasabi(
            pngBuffer,
            pngFilename,
            "converted"
        );

        res.json({
            message: "Files uploaded successfully",
            original: originalKey,
            converted: convertedKey,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});

router.get("/:folder/:filename", async (req, res) => {
    try {
        const { folder, filename } = req.params;
        const key = `${folder}/${filename}`;
        const file = await getFromWasabi(key);

        res.setHeader("Content-Type", "image/png");
        file.pipe(res);
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Download failed" });
    }
});

module.exports = router;
