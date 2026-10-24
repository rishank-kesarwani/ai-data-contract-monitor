import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheItem {
  value: any;
  expiresAt: number;
}

@Injectable()
export class RedisAdapter implements OnModuleDestroy {
  private readonly logger = new Logger(RedisAdapter.name);
  private client: Redis | null = null;
  private readonly inMemoryCache = new Map<string, CacheItem>();

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl && redisUrl.trim().length > 0) {
      try {
        this.client = new Redis(redisUrl, {
          connectTimeout: 3000,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });

        this.client.connect().then(() => {
          this.logger.log('Connected successfully to Railway Redis cache.');
        }).catch((err) => {
          this.logger.warn(`Redis connection failed: ${err.message}. Using In-Memory fallback cache.`);
          this.client = null;
        });

        this.client.on('error', (err) => {
          this.logger.warn(`Redis runtime error: ${err.message}`);
        });
      } catch (err: any) {
        this.logger.warn(`Could not initialize Redis client (${err.message}). Using In-Memory fallback cache.`);
        this.client = null;
      }
    } else {
      this.logger.log('Redis URL omitted. In-Memory cache enabled.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        this.logger.warn(`Redis get error: ${(err as any).message}`);
      }
    }

    const item = this.inMemoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.client) {
      try {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err) {
        this.logger.warn(`Redis set error: ${(err as any).message}`);
      }
    }

    this.inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        this.logger.warn(`Redis del error: ${(err as any).message}`);
      }
    }
    this.inMemoryCache.delete(key);
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
