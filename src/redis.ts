import Redis from "ioredis";

async function createRedis(): Promise<any> {
  const newRedis = await new Redis({
    host: "127.0.0.1",
    port: Number(process.env.REDIS_PORT),

    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,

    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT),

    db: Number(process.env.REDIS_DB_STACK),
  });

  return newRedis;
}

const redisInstances = {};

export default class lib_redis {
  public static async get(ignorePool?: boolean): Promise<any> {
    if (ignorePool) {
      const client = await createRedis();

      return client;
    }

    if (!redisInstances["default"]) {
      redisInstances["default"] = await createRedis();
    }

    return redisInstances["default"];
  }
}
