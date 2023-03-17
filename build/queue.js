"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("./redis"));
const redis = redis_1.default.get();
class lib_queue {
    static async get(key) {
        try {
            const data = await redis.lrange(key, 0, -1);
            if (!data)
                return {
                    data: null,
                };
            return {
                data: data.map((item) => JSON.parse(item)),
            };
        }
        catch (error) {
            console.error(`[Queue Lib] Error while getting key ${key}`, error);
            return {
                data: null,
            };
        }
    }
    static async add(key, value, ttl) {
        try {
            const queuePayload = {
                ...value,
                expires: Math.floor(Date.now() / 1000) + ttl,
            };
            const queueLength = await redis.rpush(key, JSON.stringify(queuePayload));
            return {
                queueLength,
                queuePayload,
            };
        }
        catch (error) {
            console.error(`[Queue Lib] Error while adding value ${value} to key ${key}`, error);
            throw error;
        }
    }
    static async update(key, index, value) {
        try {
            await redis.lset(key, index, JSON.stringify(value));
        }
        catch (error) {
            console.error(`[Queue Lib] Error while updating index ${index} to value ${value} in key ${key}`, error);
            throw error;
        }
    }
    static async remove(key, value) {
        try {
            await redis.lrem(key, 0, JSON.stringify(value));
        }
        catch (error) {
            console.error(`[Queue Lib] Error while removing value ${value} from key ${key}`, error);
            throw error;
        }
    }
}
exports.default = lib_queue;
