declare module "@iunstable0/server-libs/build/heartbeat" {
  export function ping(
    id: string,
    status: string,
    message: string
  ): Promise<any>;
}
