// Define generic type for cache data
class MemoryCache<T = unknown> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) { // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  remove(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Create a singleton instance
export const apiCache = new MemoryCache();

// Utility function to wrap API calls with cache
export async function cachedFetch(url: string, options: RequestInit & { ttl?: number } = {}) {
  const cacheKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || '')}`;
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch from API
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Only cache successful GET requests
  if (response.ok && (!options.method || options.method === 'GET')) {
    apiCache.set(cacheKey, data, options.ttl);
  }
  
  return data;
}

// Local Storage wrapper for persistent cache
export const storageCache = {
  set<T>(key: string, value: T, ttl = 24 * 60 * 60 * 1000) { // Default 24 hours
    const item = {
      value,
      timestamp: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get(key: string) {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { value, timestamp } = JSON.parse(item);
    if (Date.now() > timestamp) {
      localStorage.removeItem(key);
      return null;
    }

    return value;
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },
};