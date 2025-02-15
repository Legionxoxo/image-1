const sharp = require("sharp");

// Configure Sharp for better quality
const configureSharp = () => {
    sharp.cache(false);
    sharp.concurrency(1);
};

module.exports = { configureSharp };
