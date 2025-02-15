const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { wasabiClient, wasabiConfig } = require("../config/wasabi.config");

async function uploadToWasabi(buffer, filename, folder) {
    try {
        const command = new PutObjectCommand({
            Bucket: wasabiConfig.bucket,
            Key: `${folder}/${filename}`,
            Body: buffer,
            ContentType: "image/png",
        });

        await wasabiClient.send(command);
        return `${folder}/${filename}`;
    } catch (error) {
        console.error("Error uploading to Wasabi:", error);
        throw error;
    }
}

async function getFromWasabi(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: wasabiConfig.bucket,
            Key: key,
        });

        const response = await wasabiClient.send(command);
        return response.Body;
    } catch (error) {
        console.error("Error getting from Wasabi:", error);
        throw error;
    }
}

module.exports = { uploadToWasabi, getFromWasabi };
