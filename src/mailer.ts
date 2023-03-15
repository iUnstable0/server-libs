import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  // @ts-ignore
  pool: true,
  host: `mail.${process.env.EMAIL_HOST}`,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default class lib_mailer {
  public static parseMessage(message: {
    title: string;
    body: Array<string>;
    footer: Array<string>;
  }) {
    return `${message.title}\n\n${message.body.join(
      "\n"
    )}\n\n${message.footer.join("\n")}`;
  }

  public static async send(to: string, subject: string, text: string) {
    await transporter.sendMail({
      to: to,
      from: `"${process.env.EMAIL_IDENTITY}" <${process.env.EMAIL_USERNAME}@${process.env.EMAIL_HOST}>`,
      subject: subject,
      text: text,
    });
  }
}
