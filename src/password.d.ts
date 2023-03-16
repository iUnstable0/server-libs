declare module "@iunstable0/server-libs/build/password" {
  export function validate(password: string): {
    valid: boolean;
    errors: Array<string>;
  };
}
