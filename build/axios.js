"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class lib_axios {
    static parseError(error) {
        const errorMessages = [];
        // console.log(error);
        if (error.response && error.response.data) {
            if (error.response.data.errors) {
                for (let i = 0; i < error.response.data.errors.length; i++) {
                    errorMessages.push(error.response.data.errors[i].message);
                }
            }
            else if (error.response.data.error) {
                if (error.response.data.statusCode > 499 &&
                    error.response.data.statusCode < 600 &&
                    !error.response.data.message.startsWith("Internal server error. Ref:")) {
                    errorMessages.push("Internal server error");
                }
                else {
                    errorMessages.push(error.response.data.message);
                }
            }
        }
        else if (error.errors) {
            for (let i = 0; i < error.errors.length; i++) {
                errorMessages.push(error.errors[i].message);
            }
        }
        else if (error.message) {
            errorMessages.push(error.message);
        }
        else {
            errorMessages.push(error.toString());
        }
        return errorMessages;
    }
    static request(options) {
        return new Promise(async (resolve, reject) => {
            const requestHeaders = options.headers || {};
            let response;
            try {
                // console.log({
                // 	method: options.method,
                // 	url: options.url,
                // 	...(options.baseURL ? { baseURL: options.baseURL } : {}),
                // 	headers: requestHeaders,
                // 	...(options.data ? { data: options.data } : {}),
                // });
                response = await axios_1.default.request({
                    method: options.method,
                    url: options.url,
                    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
                    headers: requestHeaders,
                    ...(options.data ? { data: options.data } : {}),
                });
            }
            catch (error) {
                reject(error);
                return;
            }
            if (response.data.errors || response.data.error) {
                reject(response.data);
                return;
            }
            if (response.data.data && response.data.data.emailValid) {
                if (response.data.data.emailValid?.error) {
                    reject(response.data.data.emailValid.error);
                    return;
                }
            }
            if (response.data.data && response.data.data.usernameValid) {
                if (response.data.data.usernameValid?.error) {
                    reject(response.data.data.usernameValid.error);
                    return;
                }
            }
            resolve(response);
        });
    }
}
exports.default = lib_axios;
