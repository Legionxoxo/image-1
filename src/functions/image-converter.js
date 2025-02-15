const sharp = require("sharp");
const { spawn } = require('child_process');
const path = require("path");
const os = require('os');
const fsPromises = require("fs").promises;

const createThumbnail = async (imagePath) => {
    const image = sharp(imagePath, {
        failOnError: false,
        limitInputPixels: false,
        sequentialRead: true,
    });

    return image
        .rotate()
        .resize(400, 400, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .png({
            quality: 100,
            compressionLevel: 9,
            palette: true,
        })
        .toBuffer();
};

// Add new function to handle buffer input
const convertBufferToPng = async (buffer) => {
    try {
        const image = sharp(buffer, {
            failOnError: false,
            limitInputPixels: false,
            sequentialRead: true,
        });

        const metadata = await image.metadata();

        const originalInfo = {
            dimensions: `${metadata.width}x${metadata.height}`,
            format: metadata.format,
            size: (buffer.length / 1024).toFixed(2),
        };

        const startTime = process.hrtime();

        const convertedImage = await image
            .rotate()
            .png({
                quality: 100,
                compressionLevel: 9,
                effort: 10,
                palette: false,
                colors: 256,
                dither: 1.0,
            })
            .withMetadata()
            .toBuffer();

        const endTime = process.hrtime();
        const conversionTime = (
            endTime[0] * 1000 +
            endTime[1] / 1000000
        ).toFixed(2);

        return {
            buffer: convertedImage,
            stats: {
                ...originalInfo,
                convertedSize: (convertedImage.length / 1024).toFixed(2),
                conversionTime,
            },
        };
    } catch (error) {
        console.error("Error converting buffer:", error);
        throw error;
    }
};

const convertToPng = async (input) => {
    // Handle both file paths and buffers
    if (Buffer.isBuffer(input)) {
        return convertBufferToPng(input);
    }

    const image = sharp(input, {
        failOnError: false,
        limitInputPixels: false,
        sequentialRead: true,
    });

    const metadata = await image.metadata();
    const stats = await fsPromises.stat(input);

    const originalInfo = {
        size: (stats.size / 1024).toFixed(2),
        dimensions: `${metadata.width}x${metadata.height}`,
        format: metadata.format,
    };

    const startTime = process.hrtime();

    const convertedImage = await image
        .rotate()
        .png({
            quality: 100,
            compressionLevel: 9,
            effort: 10,
            palette: false,
            colors: 256,
            dither: 1.0,
        })
        .withMetadata()
        .toBuffer();

    const endTime = process.hrtime();
    const conversionTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(
        2
    );

    return {
        buffer: convertedImage,
        stats: {
            ...originalInfo,
            convertedSize: (convertedImage.length / 1024).toFixed(2),
            conversionTime,
        },
    };
};

async function convertRawToPNG(buffer) {
    try {
        // Create a temporary file for the RAW image
        const tempRawPath = path.join(os.tmpdir(), `temp-${Date.now()}.arw`);
        const tempPpmPath = path.join(os.tmpdir(), `temp-${Date.now()}.ppm`);
        
        // Write the buffer to a temporary file
        await fsPromises.writeFile(tempRawPath, buffer);
        
        // Convert RAW to PPM using dcraw
        await new Promise((resolve, reject) => {
            const dcraw = spawn('dcraw', ['-c', tempRawPath]);
            const writeStream = fsPromises.createWriteStream(tempPpmPath);
            
            dcraw.stdout.pipe(writeStream);
            
            dcraw.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`dcraw process exited with code ${code}`));
            });
            
            dcraw.on('error', reject);
        });
        
        // Read the PPM file
        const ppmBuffer = await fsPromises.readFile(tempPpmPath);
        
        // Convert PPM to PNG using Sharp
        const pngBuffer = await sharp(ppmBuffer)
            .png({
                quality: 100,
                compressionLevel: 9,
                effort: 10,
            })
            .toBuffer();
            
        // Clean up temporary files
        await Promise.all([
            fsPromises.unlink(tempRawPath),
            fsPromises.unlink(tempPpmPath)
        ]);
        
        return pngBuffer;
    } catch (error) {
        console.error("Error converting RAW file:", error);
        throw error;
    }
}

async function convertToPNG(buffer, originalFilename) {
    try {
        // Check if file is RAW format
        const isRaw = originalFilename.toLowerCase().endsWith('.arw');
        
        if (isRaw) {
            return await convertRawToPNG(buffer);
        }
        
        // For non-RAW images, use regular Sharp conversion
        const convertedBuffer = await sharp(buffer, {
            failOnError: false,
            limitInputPixels: false,
            sequentialRead: true,
        })
        .rotate() // Auto-rotate based on EXIF
        .png({
            quality: 100,
            compressionLevel: 9,
            effort: 10,
            palette: false,
        })
        .toBuffer();
        
        return convertedBuffer;
    } catch (error) {
        console.error("Error converting image:", error);
        throw error;
    }
}

module.exports = {
    createThumbnail,
    convertToPng,
    convertBufferToPng,
    convertToPNG,
};
