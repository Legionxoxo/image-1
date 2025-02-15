const { S3Client } = require("@aws-sdk/client-s3");

const wasabiConfig = {
    credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
    },
    endpoint: `https://s3.${process.env.WASABI_REGION}.wasabisys.com`,
    region: process.env.WASABI_REGION,
    bucket: process.env.WASABI_BUCKET_NAME,
    forcePathStyle: true,
};

const wasabiClient = new S3Client({
    ...wasabiConfig,
    region: wasabiConfig.region,
    endpoint: wasabiConfig.endpoint,
    forcePathStyle: true,
});

module.exports = { wasabiClient, wasabiConfig };
