declare module "@iunstable0/server-libs/build/queue" {
  export function get(key: string): Promise<{
    data: Array<object> | null;
  }>;

  export function add(
    key: string,
    value: object,
    ttl: number
  ): Promise<{
    queueLength: number;
    queuePayload: object;
  }>;

  export function update(
    key: string,
    index: number,
    value: object
  ): Promise<void>;

  export function remove(key: string, value: object): Promise<void>;
}
