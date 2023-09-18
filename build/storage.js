"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const provider = process.env.S3_PROVIDER.toUpperCase();
const endpoint = process.env[`${provider}_S3_ENDPOINT`];
const client = new client_s3_1.S3Client({
    endpoint: endpoint,
    region: "auto",
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
    static async listFiles(db, depth = 1) {
        // const objects = await client.send(
        //   new ListObjectsV2Command({
        //     Bucket: process.env.S3_BUCKET_NAME,
        //     Prefix: db,
        //   })
        // );
        const objects = await client.send(new client_s3_1.ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: db,
        }));
        if (objects.Contents && objects.Contents.length > 0) {
            const splitDB = db.split("/");
            let extraLevel = 0;
            if (db === "")
                extraLevel = -1;
            if (splitDB.length > 1) {
                if (splitDB[splitDB.length - 1] === "") {
                    extraLevel += splitDB.length - 2;
                }
                else {
                    extraLevel += splitDB.length - 1;
                }
            }
            const filtered = objects.Contents.filter((object) => {
                const split = object.Key.split("/");
                // console.log(split.length - 1, depth);
                // console.log(split.length - 1 === depth);
                // return split.length - 1 === depth;
                // Folders often end with a slash, while file doesn't. And split will return an array with the last element being an empty string.
                // But, it also returns the folder itself, eg. "folder/" when listing files inside "folder".
                // So we need to add extra check
                // How this check works:
                // If the last element is an empty string, then 2 is added to the extra level.
                // Otherwise, 1 is added to the extra level.
                // Extra level is the number of folders in the db path.
                // For example, if db is "folder1/folder2/folder3/", then extra level is 3.
                // Then we subtract the length of the split array with the extra level.
                // Then we compare the result with the depth.
                // If the result is equal to the depth, then we return true, otherwise we return false.
                return (split.length -
                    ((split[split.length - 1] === "" ? 2 : 1) + extraLevel) ===
                    depth);
            });
            return filtered.map((object) => object.Key);
        }
        return [];
        // if (objects.Contents && objects.Contents.length > 0)
        //   return objects.Contents.map((object: any) => object.Key);
        //
        // return [];
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
    static async copyFiles(db, destination) {
        // const objects = await client.send(new client_s3_1.ListObjectsV2Command({
        //     Bucket: process.env.S3_BUCKET_NAME,
        //     Prefix: db,
        // }));
        // console.log("LISTA");
        const objects = await lib_storage.listFiles(db);
        // console.log(objects);
        if (objects.length > 0) {
            // console.log(
            //   `Copying ${objects.length} files from ${db} to ${destination}`,
            // );
            // let count = 0;
            // let total = objects.length;
            const chunkSize = Math.ceil(objects.length / 85);
            const processChunk = async (chunk) => {
                const promises = chunk.map(async (key) => {
                    //async (key, index) => {
                    const filename = key.split("/").pop();
                    // Logging before sending
                    // console.log(
                    //   `Copying ${
                    //     process.env.S3_BUCKET_NAME
                    //   }/${key} to ${destination}/${filename} (${index + 1}/${
                    //     chunk.length
                    //   })`,
                    // );
                    await client.send(new client_s3_1.CopyObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME,
                        CopySource: encodeURIComponent(`${process.env.S3_BUCKET_NAME}/${key}`),
                        Key: `${destination}/${filename}`,
                    }));
                    // Logging after completion
                    // console.log(
                    //   `Copied ${key} to ${destination} (${index + 1}/${chunk.length})`,
                    // );
                });
                await Promise.all(promises);
            };
            // const delay = (time: number) =>
            //   new Promise((resolve) => setTimeout(resolve, time));
            (async () => {
                for (let i = 0; i < 85; i++) {
                    const chunk = objects.slice(i * chunkSize, (i + 1) * chunkSize);
                    await processChunk(chunk);
                    // if (i < 14) { // No need to wait after the last chunk
                    //     console.log('Waiting for a few minutes before processing the next chunk...');
                    //     await delay(1000 * 60); // Waiting for 1 minute
                    // }
                }
                // console.log("All copy operations completed.");
            })().catch((error) => {
                console.error("An error occurred:", error);
            });
            // const promises = objects.map(async (key, index) => {
            //     const filename = key.split("/").pop();
            //     // Logging before sending
            //     console.log(`Copying ${process.env.S3_BUCKET_NAME}/${key} to ${destination}/${filename} (${index + 1}/${objects.length})`);
            //     await client.send(new client_s3_1.CopyObjectCommand({
            //         Bucket: process.env.S3_BUCKET_NAME,
            //         CopySource: encodeURIComponent(`${process.env.S3_BUCKET_NAME}/${key}`),
            //         Key: `${destination}/${filename}`,
            //     }));
            //     // Logging after completion
            //     console.log(`Copied ${key} to ${destination} (${index + 1}/${objects.length})`);
            // });
            // Promise.all(promises)
            //     .then(() => {
            //         console.log("All copy operations completed.");
            //     })
            //     .catch((error) => {
            //         console.error("An error occurred:", error);
            //     });
            // for (const key of objects) {
            //     const filename = key.split("/").pop();
            //     // console.log(`Copying ${process.env.S3_BUCKET_NAME}/${key} to ${destination}/${filename} (${count}/${total})`);
            //     client.send(new client_s3_1.CopyObjectCommand({
            //         Bucket: process.env.S3_BUCKET_NAME,
            //         CopySource: encodeURIComponent(`${process.env.S3_BUCKET_NAME}/${key}`),
            //         Key: `${destination}/${filename}`,
            //     }))
            //     // console.log(`Copied ${key} to ${destination} (${count}/${total})`);
            // }
        }
    }
    static async createFolder(db) {
        await client.send(new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${db}/`,
        }));
    }
}
exports.default = lib_storage;
