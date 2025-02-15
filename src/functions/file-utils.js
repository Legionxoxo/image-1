const path = require("path");
const fsPromises = require("fs").promises;

const supportedFormats = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".tiff",
    ".cr2",
    ".nef",
    ".dng",
    ".raf",
    ".arw",
    ".rw2",
    ".orf",
    ".pef",
    ".srw",
];

const rawFormats = [".cr2", ".nef", ".dng", ".raf", ".arw", ".rw2", ".orf"];

const isRawFormat = (filename) =>
    rawFormats.includes(path.extname(filename).toLowerCase());

const isSupported = (filename) =>
    supportedFormats.includes(path.extname(filename).toLowerCase());

const getValidImages = async (directory) => {
    const files = await fsPromises.readdir(directory);
    const validFiles = files.filter((file) => isSupported(file));
    return validFiles;
};

module.exports = {
    isRawFormat,
    isSupported,
    getValidImages,
    supportedFormats,
    rawFormats,
};
