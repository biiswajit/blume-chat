import { createClient, RedisClientType } from "redis";

class RedisClient {
  private static instance: RedisClientType | null = null;

  private constructor() {}

  public static async getInstance(): Promise<RedisClientType | null> {
    RedisClient.instance = createClient();
    RedisClient.instance.on("error", function (err) {
      console.error("Redis client error " + err);
    });
    try {
      await RedisClient.instance.connect();
      console.log("Redis connected successfully");
    } catch (err) {
      console.error("Failed to connect to redis " + err);
      RedisClient.instance = null;
    }
    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.disconnect();
      RedisClient.instance = null;
      console.log("Redis client disconnected");
    }
  }
}

export default RedisClient;
