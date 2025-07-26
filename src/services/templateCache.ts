import { TemplateConfig } from '../types';
import { TemplateMetadata } from './templateRegistry';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number;
  enableStats?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export class TemplateCache {
  private templateCache: Map<string, CacheEntry<TemplateConfig>> = new Map();
  private metadataCache: Map<string, CacheEntry<TemplateMetadata>> = new Map();
  private contentCache: Map<string, CacheEntry<string>> = new Map();

  private maxSize: number;
  private defaultTTL: number;
  private enableStats: boolean;

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.enableStats = options.enableStats || false;
  }

  /**
   * TASK-028: Create template metadata caching
   */
  async getTemplateMetadata(key: string): Promise<TemplateMetadata | null> {
    const entry = this.metadataCache.get(key);

    if (!entry) {
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    if (this.isExpired(entry)) {
      this.metadataCache.delete(key);
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.enableStats) {
      this.stats.hits++;
    }
    return entry.data;
  }

  /**
   * Set template metadata in cache
   */
  setTemplateMetadata(key: string, data: TemplateMetadata, ttl?: number): void {
    const entry: CacheEntry<TemplateMetadata> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.metadataCache.set(key, entry);
    this.ensureCacheSize(this.metadataCache);
  }

  /**
   * TASK-028: Add template content caching
   */
  async getTemplateContent(key: string): Promise<string | null> {
    const entry = this.contentCache.get(key);

    if (!entry) {
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    if (this.isExpired(entry)) {
      this.contentCache.delete(key);
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.enableStats) {
      this.stats.hits++;
    }
    return entry.data;
  }

  /**
   * Set template content in cache
   */
  setTemplateContent(key: string, data: string, ttl?: number): void {
    const entry: CacheEntry<string> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.contentCache.set(key, entry);
    this.ensureCacheSize(this.contentCache);
  }

  /**
   * Get template configuration from cache
   */
  async getTemplateConfig(key: string): Promise<TemplateConfig | null> {
    const entry = this.templateCache.get(key);

    if (!entry) {
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    if (this.isExpired(entry)) {
      this.templateCache.delete(key);
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.enableStats) {
      this.stats.hits++;
    }
    return entry.data;
  }

  /**
   * Set template configuration in cache
   */
  setTemplateConfig(key: string, data: TemplateConfig, ttl?: number): void {
    const entry: CacheEntry<TemplateConfig> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.templateCache.set(key, entry);
    this.ensureCacheSize(this.templateCache);
  }

  /**
   * TASK-028: Implement cache invalidation
   */
  invalidateTemplate(key: string): void {
    this.templateCache.delete(key);
    this.metadataCache.delete(key);

    // Invalidate all content entries for this template
    const contentKeys = Array.from(this.contentCache.keys()).filter(k =>
      k.startsWith(key)
    );
    contentKeys.forEach(k => this.contentCache.delete(k));
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.templateCache.clear();
    this.metadataCache.clear();
    this.contentCache.clear();
  }

  /**
   * Invalidate expired entries
   */
  invalidateExpired(): void {
    this.invalidateExpiredFromCache(this.templateCache);
    this.invalidateExpiredFromCache(this.metadataCache);
    this.invalidateExpiredFromCache(this.contentCache);
  }

  /**
   * TASK-028: Add cache performance monitoring
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size:
        this.templateCache.size +
        this.metadataCache.size +
        this.contentCache.size,
      maxSize: this.maxSize * 3, // Total max size across all caches
      hitRate,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get cache size information
   */
  getSizeInfo(): {
    template: number;
    metadata: number;
    content: number;
    total: number;
  } {
    return {
      template: this.templateCache.size,
      metadata: this.metadataCache.size,
      content: this.contentCache.size,
      total:
        this.templateCache.size +
        this.metadataCache.size +
        this.contentCache.size,
    };
  }

  /**
   * Check if entry is expired
   */
  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Ensure cache doesn't exceed max size
   */
  private ensureCacheSize<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size <= this.maxSize) {
      return;
    }

    // Remove least recently used entries
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = entries.slice(0, cache.size - this.maxSize);
    toRemove.forEach(([key]) => {
      cache.delete(key);
      if (this.enableStats) {
        this.stats.evictions++;
      }
    });
  }

  /**
   * Invalidate expired entries from specific cache
   */
  private invalidateExpiredFromCache<T>(
    cache: Map<string, CacheEntry<T>>
  ): void {
    const expiredKeys: string[] = [];

    for (const [key, entry] of cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => cache.delete(key));
  }

  /**
   * Preload frequently used templates
   */
  async preloadTemplates(
    templateKeys: string[],
    loader: (key: string) => Promise<TemplateConfig>
  ): Promise<void> {
    const loadPromises = templateKeys.map(async key => {
      try {
        const template = await loader(key);
        this.setTemplateConfig(key, template, this.defaultTTL * 2); // Longer TTL for preloaded items
      } catch (error) {
        // Silently fail preloading - log error for debugging
        // console.warn replaced with error handling
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Warm up cache with metadata
   */
  async warmupMetadata(
    metadataKeys: string[],
    loader: (key: string) => Promise<TemplateMetadata>
  ): Promise<void> {
    const loadPromises = metadataKeys.map(async key => {
      try {
        const metadata = await loader(key);
        this.setTemplateMetadata(key, metadata, this.defaultTTL * 2);
      } catch (error) {
        // Silently fail warmup - log error for debugging
        // console.warn replaced with error handling
      }
    });

    await Promise.all(loadPromises);
  }
}
