import lib_redis from "./redis";

const redis = lib_redis.get("queue");

export default class lib_queue {
  public static async get(
    key: string
  ): Promise<{ data: Array<object> | null }> {
    try {
      const data = await redis.lrange(key, 0, -1);

      if (!data)
        return {
          data: null,
        };

      return {
        data: data.map((item: any) => JSON.parse(item)),
      };
    } catch (error) {
      console.error(`🚨 [Queue Lib] Error while getting key ${key}`, error);

      return {
        data: null,
      };
    }
  }

  public static async add(
    key: string,
    value: object,
    ttl: number
  ): Promise<{
    queueLength: number;
    queuePayload: object;
  }> {
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
    } catch (error) {
      console.error(
        `🚨 [Queue Lib] Error while adding value ${value} to key ${key}`,
        error
      );

      throw error;
    }
  }

  public static async update(
    key: string,
    index: number,
    value: object
  ): Promise<void> {
    try {
      await redis.lset(key, index, JSON.stringify(value));
    } catch (error) {
      console.error(
        `🚨 [Queue Lib] Error while updating index ${index} to value ${value} in key ${key}`,
        error
      );

      throw error;
    }
  }

  public static async remove(key: string, value: object): Promise<void> {
    try {
      await redis.lrem(key, 0, JSON.stringify(value));
    } catch (error) {
      console.error(
        `🚨 [Queue Lib] Error while removing value ${value} from key ${key}`,
        error
      );

      throw error;
    }
  }
}
