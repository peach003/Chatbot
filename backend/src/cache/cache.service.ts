import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache service wrapper with typed methods and TTL presets
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // TTL presets (in seconds)
  private readonly TTL = {
    DEFAULT: parseInt(process.env.CACHE_TTL_DEFAULT || '3600', 10),
    WEATHER: parseInt(process.env.CACHE_TTL_WEATHER || '1800', 10), // 30 min
    PLACES: parseInt(process.env.CACHE_TTL_PLACES || '86400', 10),  // 24 hours
    PRICES: parseInt(process.env.CACHE_TTL_PRICES || '7200', 10),   // 2 hours
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit: ${key}`);
      } else {
        this.logger.debug(`Cache miss: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache with default TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const ttlMs = (ttl || this.TTL.DEFAULT) * 1000;
      await this.cacheManager.set(key, value, ttlMs);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl || this.TTL.DEFAULT}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Clear all cache (Note: Not supported by all cache stores)
   */
  async reset(): Promise<void> {
    try {
      // Reset method not available in cache-manager v6
      // Would need to implement store-specific clear logic
      this.logger.warn('Cache reset not implemented for this store');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Get or set pattern: Fetch from cache or compute and cache if not found
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Cache with weather-specific TTL
   */
  async setWeather<T>(key: string, value: T): Promise<void> {
    return this.set(key, value, this.TTL.WEATHER);
  }

  /**
   * Cache with places-specific TTL
   */
  async setPlaces<T>(key: string, value: T): Promise<void> {
    return this.set(key, value, this.TTL.PLACES);
  }

  /**
   * Cache with prices-specific TTL
   */
  async setPrices<T>(key: string, value: T): Promise<void> {
    return this.set(key, value, this.TTL.PRICES);
  }

  /**
   * Generate cache key from parts
   */
  generateKey(...parts: (string | number)[]): string {
    return parts.filter(Boolean).join(':');
  }

  /**
   * Cache decorator-friendly method
   */
  async wrap<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    return this.cacheManager.wrap(key, factory, ttl ? ttl * 1000 : undefined);
  }
}
