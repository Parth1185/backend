import { redisClient } from "../utils/redisClient.js";

export async function cache(req, res, next) {
  const key = req.originalUrl;

  try {
    const cachedData = await redisClient.get(key);

    if (cachedData) {
      console.log("✔ Serving from Redis Cache");
      return res.json(JSON.parse(cachedData));
    }

    // Hijack res.json
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      redisClient.setEx(key, 60 * 5, JSON.stringify(data)); // 5 min cache
      originalJson(data);
    };

    next();
  } catch (err) {
    console.error("Cache Error:", err);
    next(); // continue even if Redis fails
  }
}
