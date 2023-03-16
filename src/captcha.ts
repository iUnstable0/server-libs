import axios from "axios";
import hcaptcha from "hcaptcha";

export default class lib_captcha {
  public static async verify(token: any, provider: string): Promise<any> {
    if (provider === "cloudflare") {
      return new Promise((resolve, reject) =>
        axios
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
          .then((response: any) => resolve(response.data))
          .catch((error) => reject(error))
      );
    } else {
      return new Promise((resolve, reject) =>
        hcaptcha
          .verify(process.env.HCAPTCHA_SECRET, token)
          .then((data) => resolve(data))
          .catch((error) => reject(error))
      );
    }
  }
}
