"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const provider = process.env.S3_PROVIDER.toUpperCase();
const endpoint = process.env[`${provider}_S3_ENDPOINT`];
const client = new client_s3_1.S3Client({
    endpoint: endpoint,
    region: " ",
    credentials: {
        accessKeyId: process.env[`${provider}_S3_ACCESS_KEY`],
        secretAccessKey: process.env[`${provider}_S3_SECRET_KEY`],
    },
    forcePathStyle: true,
});
class lib_storage {
    static async requestSignedUrl(db, expires, files) {
        const urls = [];
        for (const file of files) {
            let fileName = file.name.split(".");
            fileName.pop();
            fileName = fileName.join(".");
            const objects = await client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: process.env.S3_BUCKET_NAME,
                Prefix: `${db}/${fileName}`,
            }));
            if (objects.Contents && objects.Contents.length > 0)
                await client.send(new client_s3_1.DeleteObjectsCommand({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Delete: {
                        Objects: objects.Contents.map((object) => ({
                            Key: object.Key,
                        })),
                    },
                }));
            const key = `${db}/${file.name}`, url = await (0, s3_request_presigner_1.getSignedUrl)(client, new client_s3_1.PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
                ContentType: file.mime,
                ContentLength: file.size,
                ContentMD5: file.hash,
            }), {
                expiresIn: expires,
                signableHeaders: new Set([
                    `Content-Type`,
                    `Content-Length`,
                    `Content-MD5`,
                ]),
            });
            urls.push({
                url: url,
                key: key,
            });
        }
        return urls;
    }
    static async uploadFile(db, file, options) {
        const key = `${db}/${file.name}`;
        if (options?.clearFiles) {
            await lib_storage.clearFiles(db);
        }
        await client.send(new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.data,
            ContentType: file.mime,
        }));
        return {
            publicSharingUrl: `${process.env.S3_CUSTOM_DOMAIN}/${key}`,
            key: key,
        };
    }
    static async listFiles(db) {
        const objects = await client.send(new client_s3_1.ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: db,
        }));
        if (objects.Contents && objects.Contents.length > 0)
            return objects.Contents.map((object) => object.Key);
        return [];
    }
    static async clearFiles(db) {
        const objects = await client.send(new client_s3_1.ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: db,
        }));
        if (objects.Contents && objects.Contents.length > 0) {
            await client.send(new client_s3_1.DeleteObjectsCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Delete: {
                    Objects: objects.Contents.map((object) => ({
                        Key: object.Key,
                    })),
                },
            }));
        }
    }
}
exports.default = lib_storage;
