declare module "@iunstable0/server-libs/build/axios" {
  export function parseError(error: any): Array<string>;

  export function request(options: {
    method: "POST" | "GET" | "PUT" | "DELETE";
    url: string;
    baseURL?: any;
    headers?: any;
    data?: any;
  }): Promise<any>;
}
