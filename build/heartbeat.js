"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("./axios"));
class lib_heartbeat {
    static async ping(id, status, message) {
        return axios_1.default.request({
            method: "GET",
            url: `/${id}?status=${status}&msg=${message}&ping=`,
            baseURL: process.env.MONITOR_API,
        });
    }
}
exports.default = lib_heartbeat;
