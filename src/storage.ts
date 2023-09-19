import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const provider = process.env.S3_PROVIDER.toUpperCase();

const endpoint = process.env[`${provider}_S3_ENDPOINT`];

const client = new S3Client({
  endpoint: endpoint,
  region: "auto",
  credentials: {
    accessKeyId: process.env[`${provider}_S3_ACCESS_KEY`],
    secretAccessKey: process.env[`${provider}_S3_SECRET_KEY`],
  },
  forcePathStyle: true,
});

export default class lib_storage {
  public static async requestSignedUrl(
    db: string,
    expires: number,
    files: Array<{
      name: string;
      size: number;
      mime: string;
      hash: string;
    }>,
  ): Promise<
    Array<{
      url: string;
      key: string;
    }>
  > {
    const urls = [];

    for (const file of files) {
      let fileName: any = file.name.split(".");

      fileName.pop();
      fileName = fileName.join(".");

      const objects = await client.send(
        new ListObjectsV2Command({
          Bucket: process.env.S3_BUCKET_NAME,
          Prefix: `${db}/${fileName}`,
        }),
      );

      if (objects.Contents && objects.Contents.length > 0)
        await client.send(
          new DeleteObjectsCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Delete: {
              Objects: objects.Contents.map((object: any) => ({
                Key: object.Key,
              })),
            },
          }),
        );

      const key = `${db}/${file.name}`,
        url = await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: file.mime,
            ContentLength: file.size,
            ContentMD5: file.hash,
          }),
          {
            expiresIn: expires,
            signableHeaders: new Set([
              `Content-Type`,
              `Content-Length`,
              `Content-MD5`,
            ]),
          },
        );

      urls.push({
        url: url,
        key: key,
      });
    }

    return urls;
  }

  public static async uploadFile(
    db: string,
    file: {
      name: string;
      mime: string;
      data: Buffer;
    },
    options?: {
      clearFiles?: boolean;
    },
  ): Promise<{
    publicSharingUrl: string;
    key: string;
  }> {
    const key = `${db}/${file.name}`;

    if (options?.clearFiles) {
      await lib_storage.clearFiles(db);
    }

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: file.data,
        ContentType: file.mime,
      }),
    );

    return {
      publicSharingUrl: `${process.env.S3_CUSTOM_DOMAIN}/${key}`,
      key: key,
    };
  }

  public static async listFiles(
    db: string,
    depth: number = 1,
  ): Promise<string[]> {
    // const objects = await client.send(
    //   new ListObjectsV2Command({
    //     Bucket: process.env.S3_BUCKET_NAME,
    //     Prefix: db,
    //   })
    // );

    const objects = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: db,
      }),
    );

    if (objects.Contents && objects.Contents.length > 0) {
      const splitDB = db.split("/");

      let extraLevel = 0;

      if (db === "") extraLevel = -1;

      if (splitDB.length > 1) {
        if (splitDB[splitDB.length - 1] === "") {
          extraLevel += splitDB.length - 2;
        } else {
          extraLevel += splitDB.length - 1;
        }
      }

      const filtered = objects.Contents.filter((object: any) => {
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

        return (
          split.length -
            ((split[split.length - 1] === "" ? 2 : 1) + extraLevel) ===
          depth
        );
      });

      return filtered.map((object: any) => object.Key);
    }

    return [];

    // if (objects.Contents && objects.Contents.length > 0)
    //   return objects.Contents.map((object: any) => object.Key);
    //
    // return [];
  }

  public static async clearFiles(db: string): Promise<void> {
    const objects = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: db,
      }),
    );

    if (objects.Contents && objects.Contents.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Delete: {
            Objects: objects.Contents.map((object: any) => ({
              Key: object.Key,
            })),
          },
        }),
      );
    }
  }

  public static async copyFiles(
    db: string,
    destination: string,
  ): Promise<void> {
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
      let total = objects.length;

      let chunkSize;

      for (let i = 2; i < 6; i++) {
        if (total % i == 0) {
          chunkSize = i;
          break;
        }
      }

      const processChunk = async (chunk) => {
        const promises = chunk.map(async (key, index) => {
          //async (key, index) => {
          const filename = key.split("/").pop();

          // Logging before sending
          console.log(
            `Copying ${
              process.env.S3_BUCKET_NAME
            }/${key} to ${destination}/${filename} (${index + 1}/${
              chunk.length
            })`,
          );

          await client.send(
            new CopyObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              CopySource: encodeURIComponent(
                `${process.env.S3_BUCKET_NAME}/${key}`,
              ),
              Key: `${destination}/${filename}`,
            }),
          );

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

  public static async createFolder(db: string): Promise<void> {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${db}/`,
      }),
    );
  }
}
