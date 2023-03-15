"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
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
class lib_mailer {
    static parseMessage(message) {
        return `${message.title}\n\n${message.body.join("\n")}\n\n${message.footer.join("\n")}`;
    }
    static async send(to, subject, text) {
        await transporter.sendMail({
            to: to,
            from: `"${process.env.EMAIL_IDENTITY}" <${process.env.EMAIL_USERNAME}@${process.env.EMAIL_HOST}>`,
            subject: subject,
            text: text,
        });
    }
}
exports.default = lib_mailer;
