const redis = require('redis');
const config = require('../../utils/config');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: config.redis.host,
      },
    });

    this._client.on('error', (error) => {
      console.error('[CacheService] Redis Error:', error);
    });

    this._client
      .connect()
      .catch((err) =>
        console.error(
          '[CacheService] Gagal konek ke Redis saat inisialisasi:',
          err
        )
      );
  }

  async set(key, value, expirationInSeconds = 1800) {
    try {
      if (!this._client.isOpen) {
        await this._client.connect();
      }
      await this._client.set(key, value, {
        EX: expirationInSeconds,
      });
    } catch (error) {
      console.error(`[CacheService] Gagal set cache untuk key ${key}:`, error);
    }
  }

  async get(key) {
    try {
      if (!this._client.isOpen) {
        await this._client.connect();
      }
      const result = await this._client.get(key);
      if (result === null) {
        return null;
      }
      return result;
    } catch (error) {
      console.error(`[CacheService] Gagal get cache untuk key ${key}:`, error);
      return null;
    }
  }

  async delete(key) {
    try {
      if (!this._client.isOpen) {
        await this._client.connect();
      }
      const result = await this._client.del(key);
      return result;
    } catch (error) {
      console.error(
        `[CacheService] Gagal delete cache untuk key ${key}:`,
        error
      );
      return 0;
    }
  }

  async quit() {
    if (this._client.isOpen) {
      await this._client.quit();
    }
  }
}

module.exports = CacheService;
