declare module "@iunstable0/server-libs/build/mailer" {
  export function parseMessage(message: {
    title: string;
    body: Array<string>;
    footer: Array<string>;
  }): string;

  export function send(
    to: string,
    subject: string,
    text: string
  ): Promise<void>;
}
