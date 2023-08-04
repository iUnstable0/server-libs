declare module "@iunstable0/server-libs/build/storage" {
  export function requestSignedUrl(
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
  >;

  export function uploadFile(
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
  }>;

  export function listFiles(db: string): Promise<Array<string>>;

  export function clearFiles(db: string): Promise<void>;

  export function createFolder(db: string): Promise<void>;
}
