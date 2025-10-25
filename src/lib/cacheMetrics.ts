/**
 * Cache metrics system
 * Tracks HIT/MISS/STALE/INVALIDATION performance
 * Exported via /api/debug/cache-metrics for monitoring
 */

export interface CacheMetricsSnapshot {
  timestamp: number;
  hits: number;
  misses: number;
  stale: number;
  sets: number;
  deletes: number;
  patternInvalidations: number;
  hitRate: number; // percentage
  averageAge: number; // seconds
  totalKeys: number;
  errors: {
    getErrors: number;
    setErrors: number;
    deleteErrors: number;
    patternErrors: number;
  };
}

class CacheMetrics {
  private metrics = {
    hits: 0,
    misses: 0,
    stale: 0,
    sets: 0,
    deletes: 0,
    patternInvalidations: 0,
    getErrors: 0,
    setErrors: 0,
    deleteErrors: 0,
    patternErrors: 0,
    keyAges: [] as number[],
    startTime: Date.now(),
  };

  /**
   * Record a cache hit
   */
  recordHit(ageSeconds: number = 0) {
    this.metrics.hits++;
    if (ageSeconds > 0) {
      this.metrics.keyAges.push(ageSeconds);
      // Keep last 1000 ages for average calculation
      if (this.metrics.keyAges.length > 1000) {
        this.metrics.keyAges = this.metrics.keyAges.slice(-1000);
      }
    }
  }

  /**
   * Record a cache miss
   */
  recordMiss() {
    this.metrics.misses++;
  }

  /**
   * Record stale-while-revalidate response
   */
  recordStale(ageSeconds: number = 0) {
    this.metrics.stale++;
    if (ageSeconds > 0) {
      this.metrics.keyAges.push(ageSeconds);
      if (this.metrics.keyAges.length > 1000) {
        this.metrics.keyAges = this.metrics.keyAges.slice(-1000);
      }
    }
  }

  /**
   * Record cache set operation
   */
  recordSet() {
    this.metrics.sets++;
  }

  /**
   * Record cache delete operation
   */
  recordDelete() {
    this.metrics.deletes++;
  }

  /**
   * Record pattern-based invalidation
   */
  recordPatternInvalidation() {
    this.metrics.patternInvalidations++;
  }

  /**
   * Record errors
   */
  recordError(type: 'get' | 'set' | 'delete' | 'pattern') {
    const errorKey = `${type}Errors` as keyof typeof this.metrics;
    if (errorKey in this.metrics) {
      (this.metrics[errorKey] as number)++;
    }
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): CacheMetricsSnapshot {
    const totalRequests = this.metrics.hits + this.metrics.misses + this.metrics.stale;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    const averageAge =
      this.metrics.keyAges.length > 0
        ? this.metrics.keyAges.reduce((a, b) => a + b, 0) / this.metrics.keyAges.length
        : 0;

    return {
      timestamp: Date.now(),
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      stale: this.metrics.stale,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      patternInvalidations: this.metrics.patternInvalidations,
      hitRate: Math.round(hitRate * 100) / 100,
      averageAge: Math.round(averageAge * 100) / 100,
      totalKeys: totalRequests,
      errors: {
        getErrors: this.metrics.getErrors,
        setErrors: this.metrics.setErrors,
        deleteErrors: this.metrics.deleteErrors,
        patternErrors: this.metrics.patternErrors,
      },
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      hits: 0,
      misses: 0,
      stale: 0,
      sets: 0,
      deletes: 0,
      patternInvalidations: 0,
      getErrors: 0,
      setErrors: 0,
      deleteErrors: 0,
      patternErrors: 0,
      keyAges: [],
      startTime: Date.now(),
    };
  }
}

// Global singleton instance
export const cacheMetrics = new CacheMetrics();

export default cacheMetrics;
