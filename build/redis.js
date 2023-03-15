"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
function createRedis() {
    return new ioredis_1.default({
        host: "127.0.0.1",
        port: Number(process.env.REDIS_PORT),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT),
        db: Number(process.env.REDIS_DB_STACK),
    });
}
const redisInstances = {};
class lib_redis {
    static get(db, ignorePool) {
        if (ignorePool) {
            return createRedis();
        }
        if (!redisInstances[db]) {
            redisInstances[db] = createRedis();
        }
        return redisInstances[db];
    }
}
exports.default = lib_redis;
