const {
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
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

async function listWasabiFiles(folder) {
    try {
        const command = new ListObjectsV2Command({
            Bucket: wasabiConfig.bucket,
            Prefix: `${folder}/`,
        });

        const response = await wasabiClient.send(command);
        return (
            response.Contents?.map((item) => ({
                key: item.Key,
                size: (item.Size / 1024).toFixed(2) + " KB",
                lastModified: item.LastModified,
                filename: item.Key.split("/").pop(),
            })) || []
        );
    } catch (error) {
        console.error("Error listing Wasabi files:", error);
        throw error;
    }
}

async function deleteFromWasabi(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: wasabiConfig.bucket,
            Key: key,
        });

        await wasabiClient.send(command);
        return true;
    } catch (error) {
        console.error("Error deleting from Wasabi:", error);
        throw error;
    }
}

module.exports = {
    uploadToWasabi,
    getFromWasabi,
    listWasabiFiles,
    deleteFromWasabi,
};
