"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const hcaptcha_1 = __importDefault(require("hcaptcha"));
class lib_captcha {
    static async verify(token, provider) {
        if (provider === "cloudflare") {
            return new Promise((resolve, reject) => axios_1.default
                .request({
                method: "POST",
                url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
                    response: token,
                },
            })
                .then((response) => resolve(response.data))
                .catch((error) => reject(error)));
        }
        else {
            return new Promise((resolve, reject) => hcaptcha_1.default
                .verify(process.env.HCAPTCHA_SECRET, token)
                .then((data) => resolve(data))
                .catch((error) => reject(error)));
        }
    }
}
exports.default = lib_captcha;
