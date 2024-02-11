declare module "@iunstable0/server-libs/build/data" {
  export function readFile(path: string): Promise<any>;

  export function writeFile(path: string, content: any): void;

  export function exists(path: string): boolean;
}
