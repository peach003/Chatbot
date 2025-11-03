/**
 * Cache key prefixes for different data types
 */
export enum CachePrefix {
  USER = 'user',
  SESSION = 'session',
  ITINERARY = 'itinerary',
  WEATHER = 'weather',
  TRAFFIC = 'traffic',
  PLACES = 'places',
  PRICES = 'prices',
  LLM = 'llm',
}

/**
 * Cache TTL presets (in seconds)
 */
export const CacheTTL = {
  DEFAULT: 3600,    // 1 hour
  SHORT: 300,       // 5 minutes
  MEDIUM: 1800,     // 30 minutes
  LONG: 86400,      // 24 hours
  WEATHER: 1800,    // 30 minutes
  PLACES: 86400,    // 24 hours
  PRICES: 7200,     // 2 hours
} as const;

/**
 * Cache key builder utilities
 */
export class CacheKeyBuilder {
  static user(userId: string): string {
    return `${CachePrefix.USER}:${userId}`;
  }

  static session(sessionId: string): string {
    return `${CachePrefix.SESSION}:${sessionId}`;
  }

  static itinerary(itineraryId: string): string {
    return `${CachePrefix.ITINERARY}:${itineraryId}`;
  }

  static weather(location: string, date?: string): string {
    return date
      ? `${CachePrefix.WEATHER}:${location}:${date}`
      : `${CachePrefix.WEATHER}:${location}`;
  }

  static places(query: string, locale: string): string {
    return `${CachePrefix.PLACES}:${locale}:${query}`;
  }

  static prices(attractionId: string): string {
    return `${CachePrefix.PRICES}:${attractionId}`;
  }
}
