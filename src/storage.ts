import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const provider = process.env.S3_PROVIDER.toUpperCase();

const endpoint = process.env[`${provider}_S3_ENDPOINT`];

const client = new S3Client({
  endpoint: endpoint,
  region: " ",
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
    }>
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
        })
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
          })
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
          }
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
    }
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
      })
    );

    return {
      publicSharingUrl: `${process.env.S3_CUSTOM_DOMAIN}/${key}`,
      key: key,
    };
  }

  public static async listFiles(
    db: string,
    depth: number = 1
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
      })
    );

    if (objects.Contents && objects.Contents.length > 0) {
      const splitDB = db.split("/");

      let extraLevel = 0;

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
      })
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
        })
      );
    }
  }

  public static async createFolder(db: string): Promise<void> {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${db}/`,
      })
    );
  }
}
