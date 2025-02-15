const sharp = require("sharp");
const path = require("path");
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

async function convertToPNG(buffer) {
    try {
        const convertedBuffer = await sharp(buffer).png().toBuffer();
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
