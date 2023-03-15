"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("./redis"));
const cacheEnabled = process.env.REDIS_CACHE === "true";
const redis = redis_1.default.get("cache");
class lib_cache {
    static async get(key) {
        if (!cacheEnabled)
            return {
                data: null,
            };
        try {
            const data = await redis.get(key);
            if (!data)
                return {
                    data: null,
                };
            try {
                return {
                    data: JSON.parse(data),
                };
            }
            catch (error) {
                return {
                    data,
                };
            }
        }
        catch (error) {
            console.error(`🚨 [Cache Lib] Error while getting key ${key}`, error);
            return {
                data: null,
            };
        }
    }
    static async set(key, value, ttl) {
        if (!cacheEnabled)
            return;
        try {
            if (typeof value === "object") {
                value = JSON.stringify(value);
            }
            return await redis.set(key, value, "EX", ttl);
        }
        catch (error) {
            console.error(`🚨 [Cache Lib] Error while setting key ${key} to value ${value}`, error);
            throw error;
        }
    }
    static async delete(key) {
        if (!cacheEnabled)
            return;
        try {
            await redis.del(key);
        }
        catch (error) {
            console.error(`🚨 [Cache Lib] Error while deleting key ${key}`, error);
            throw error;
        }
    }
}
exports.default = lib_cache;
