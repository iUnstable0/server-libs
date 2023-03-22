declare module "@iunstable0/server-libs/build/cache" {
  export function get(key: string): Promise<{
    data: any;
  }>;

  export function set(
    key: string,
    value: object | string,
    ttl: number
  ): Promise<void>;

  export function _delete(key: string): Promise<void>;
}
