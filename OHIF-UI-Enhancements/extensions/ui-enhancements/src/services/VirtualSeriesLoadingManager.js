/**
 * Virtual Series Loading Manager
 * 
 * Advanced loading management service for Virtual Series that implements
 * progressive loading, intelligent caching, network optimization, and memory management
 * 
 * Task 4.4: Loading Logic Optimization
 */

import { virtualSeriesProfiler } from '../utils/virtualSeriesPerformance.js';

/**
 * Advanced Loading Manager for Virtual Series
 * Handles progressive loading, caching, and network optimization
 */
export class VirtualSeriesLoadingManager {
  constructor(options = {}) {
    this.options = {
      // Progressive Loading Settings
      chunkSize: options.chunkSize || 50,
      prefetchDistance: options.prefetchDistance || 5,
      maxConcurrentRequests: options.maxConcurrentRequests || 3,
      
      // Caching Settings
      maxCacheSize: options.maxCacheSize || 100 * 1024 * 1024, // 100MB
      maxCacheEntries: options.maxCacheEntries || 1000,
      cacheExpirationMs: options.cacheExpirationMs || 30 * 60 * 1000, // 30 minutes
      
      // Memory Management
      memoryThresholdMB: options.memoryThresholdMB || 200,
      autoCleanupInterval: options.autoCleanupInterval || 60000, // 1 minute
      
      // Network Optimization
      requestBatchSize: options.requestBatchSize || 10,
      adaptiveLoading: options.adaptiveLoading || true,
      connectionSpeedThreshold: options.connectionSpeedThreshold || 'slow-2g',
      
      // Performance Monitoring
      enablePerformanceTracking: options.enablePerformanceTracking || true,
      enableDebugLogging: options.enableDebugLogging || (process.env.NODE_ENV === 'development')
    };

    // Internal state
    this.cache = new Map();
    this.loadingQueue = [];
    this.activeRequests = new Set();
    this.requestPriorities = new Map();
    this.memoryUsage = 0;
    this.connectionSpeed = 'unknown';
    
    // Performance tracking
    this.performanceMetrics = {
      totalRequestsProcessed: 0,
      cacheHitRate: 0,
      averageLoadTime: 0,
      memoryOptimizations: 0,
      networksOptimizations: 0
    };

    // Initialize services
    this.initializeNetworkDetection();
    this.initializeMemoryMonitoring();
    this.initializeAutoCleanup();
    
    this.log('VirtualSeriesLoadingManager initialized', this.options);
  }

  /**
   * Load virtual series instances with progressive loading and caching
   */
  async loadVirtualSeriesInstances(studyUID, seriesUID, requestedRange = null) {
    const loadTiming = virtualSeriesProfiler.startTiming('loadVirtualSeriesInstances');
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(studyUID, seriesUID, requestedRange);
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        this.performanceMetrics.totalRequestsProcessed++;
        this.updateCacheHitRate(true);
        virtualSeriesProfiler.endTiming(loadTiming, 'loadVirtualSeriesInstances');
        this.log('Cache hit for virtual series instances', { studyUID, seriesUID });
        return cachedData;
      }

      // Determine loading strategy based on connection and cache state
      const loadingStrategy = this.determineLoadingStrategy(studyUID, seriesUID, requestedRange);
      this.log('Determined loading strategy', loadingStrategy);

      let instanceData;
      
      switch (loadingStrategy.type) {
        case 'progressive':
          instanceData = await this.progressiveLoad(studyUID, seriesUID, requestedRange, loadingStrategy);
          break;
        case 'chunked':
          instanceData = await this.chunkedLoad(studyUID, seriesUID, requestedRange, loadingStrategy);
          break;
        case 'batch':
          instanceData = await this.batchLoad(studyUID, seriesUID, requestedRange, loadingStrategy);
          break;
        default:
          instanceData = await this.standardLoad(studyUID, seriesUID, requestedRange);
      }

      // Cache the result
      await this.cacheData(cacheKey, instanceData, loadingStrategy.priority);
      
      // Update performance metrics
      this.performanceMetrics.totalRequestsProcessed++;
      this.updateCacheHitRate(false);
      
      virtualSeriesProfiler.endTiming(loadTiming, 'loadVirtualSeriesInstances');
      return instanceData;
      
    } catch (error) {
      this.log('Error loading virtual series instances', error);
      virtualSeriesProfiler.endTiming(loadTiming, 'loadVirtualSeriesInstances');
      throw error;
    }
  }

  /**
   * Progressive loading implementation
   */
  async progressiveLoad(studyUID, seriesUID, requestedRange, strategy) {
    const progressTiming = virtualSeriesProfiler.startTiming('progressiveLoad');
    
    try {
      const instances = [];
      const totalInstances = strategy.estimatedInstanceCount || 100;
      const chunks = this.calculateProgressiveChunks(totalInstances, requestedRange);
      
      this.log('Progressive loading strategy', { totalInstances, chunks: chunks.length });

      // Load visible chunk first (highest priority)
      const visibleChunk = chunks.find(chunk => chunk.priority === 'visible') || chunks[0];
      if (visibleChunk) {
        const visibleData = await this.loadInstanceChunk(studyUID, seriesUID, visibleChunk);
        instances.push(...visibleData);
      }

      // Load adjacent chunks with prefetching
      const adjacentChunks = chunks.filter(chunk => chunk.priority === 'adjacent');
      for (const chunk of adjacentChunks) {
        if (this.shouldContinueLoading()) {
          const chunkData = await this.loadInstanceChunk(studyUID, seriesUID, chunk);
          instances.push(...chunkData);
        }
      }

      // Background loading for remaining chunks
      this.scheduleBackgroundLoading(studyUID, seriesUID, chunks.filter(chunk => 
        chunk.priority === 'background' && !this.isChunkLoaded(chunk)
      ));

      virtualSeriesProfiler.endTiming(progressTiming, 'progressiveLoad');
      return this.sortAndMergeInstances(instances);
      
    } catch (error) {
      virtualSeriesProfiler.endTiming(progressTiming, 'progressiveLoad');
      throw error;
    }
  }

  /**
   * Chunked loading implementation
   */
  async chunkedLoad(studyUID, seriesUID, requestedRange, strategy) {
    const chunkTiming = virtualSeriesProfiler.startTiming('chunkedLoad');
    
    try {
      const chunks = this.calculateOptimalChunks(strategy.estimatedInstanceCount, requestedRange);
      const instances = [];
      
      this.log('Chunked loading strategy', { chunks: chunks.length, chunkSize: this.options.chunkSize });

      // Process chunks with concurrency control
      const chunkPromises = chunks.map(chunk => 
        this.loadInstanceChunkWithPriority(studyUID, seriesUID, chunk)
      );
      
      const chunkResults = await this.processConcurrentRequests(chunkPromises, this.options.maxConcurrentRequests);
      
      for (const chunkData of chunkResults) {
        if (chunkData && chunkData.length > 0) {
          instances.push(...chunkData);
        }
      }

      virtualSeriesProfiler.endTiming(chunkTiming, 'chunkedLoad');
      return this.sortAndMergeInstances(instances);
      
    } catch (error) {
      virtualSeriesProfiler.endTiming(chunkTiming, 'chunkedLoad');
      throw error;
    }
  }

  /**
   * Batch loading implementation
   */
  async batchLoad(studyUID, seriesUID, requestedRange, strategy) {
    const batchTiming = virtualSeriesProfiler.startTiming('batchLoad');
    
    try {
      // Create optimized batch requests
      const batches = this.createOptimalBatches(studyUID, seriesUID, requestedRange, strategy);
      
      this.log('Batch loading strategy', { batches: batches.length, batchSize: this.options.requestBatchSize });

      const allInstances = [];
      
      for (const batch of batches) {
        const batchData = await this.processBatchRequest(batch);
        if (batchData && batchData.length > 0) {
          allInstances.push(...batchData);
        }
      }

      virtualSeriesProfiler.endTiming(batchTiming, 'batchLoad');
      return this.sortAndMergeInstances(allInstances);
      
    } catch (error) {
      virtualSeriesProfiler.endTiming(batchTiming, 'batchLoad');
      throw error;
    }
  }

  /**
   * Standard loading fallback
   */
  async standardLoad(studyUID, seriesUID, requestedRange) {
    const standardTiming = virtualSeriesProfiler.startTiming('standardLoad');
    
    try {
      this.log('Using standard loading strategy', { studyUID, seriesUID });
      
      // Simple load all instances approach
      const instances = await this.loadAllInstances(studyUID, seriesUID, requestedRange);
      
      virtualSeriesProfiler.endTiming(standardTiming, 'standardLoad');
      return instances;
      
    } catch (error) {
      virtualSeriesProfiler.endTiming(standardTiming, 'standardLoad');
      throw error;
    }
  }

  /**
   * Intelligent Caching Layer
   */
  
  getCachedData(cacheKey) {
    const cacheEntry = this.cache.get(cacheKey);
    
    if (!cacheEntry) {
      return null;
    }
    
    // Check expiration
    if (Date.now() - cacheEntry.timestamp > this.options.cacheExpirationMs) {
      this.cache.delete(cacheKey);
      this.updateMemoryUsage(-cacheEntry.size);
      return null;
    }
    
    // Update LRU
    cacheEntry.lastAccessed = Date.now();
    
    return cacheEntry.data;
  }

  async cacheData(cacheKey, data, priority = 'normal') {
    const dataSize = this.estimateDataSize(data);
    
    // Check if we need to free up space
    if (this.memoryUsage + dataSize > this.options.maxCacheSize) {
      await this.performCacheCleanup(dataSize);
    }
    
    // Store in cache
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      size: dataSize,
      priority,
      accessCount: 1
    };
    
    this.cache.set(cacheKey, cacheEntry);
    this.updateMemoryUsage(dataSize);
    
    this.log('Data cached', { cacheKey, size: dataSize, priority });
  }

  async performCacheCleanup(requiredSpace = 0) {
    const cleanupTiming = virtualSeriesProfiler.startTiming('cacheCleanup');
    
    try {
      // LRU eviction strategy
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => {
          // Sort by priority first, then by last accessed time
          const priorityWeight = { high: 3, normal: 2, low: 1 };
          const aPriority = priorityWeight[a[1].priority] || 2;
          const bPriority = priorityWeight[b[1].priority] || 2;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority; // Lower priority first
          }
          
          return a[1].lastAccessed - b[1].lastAccessed; // Older first
        });
      
      let freedSpace = 0;
      let entriesRemoved = 0;
      
      for (const [key, entry] of entries) {
        if (freedSpace >= requiredSpace && this.memoryUsage <= this.options.maxCacheSize * 0.8) {
          break;
        }
        
        this.cache.delete(key);
        freedSpace += entry.size;
        entriesRemoved++;
        this.updateMemoryUsage(-entry.size);
      }
      
      this.performanceMetrics.memoryOptimizations++;
      this.log('Cache cleanup completed', { entriesRemoved, freedSpace: `${freedSpace / 1024 / 1024}MB` });
      
      virtualSeriesProfiler.endTiming(cleanupTiming, 'cacheCleanup');
      
    } catch (error) {
      this.log('Error during cache cleanup', error);
      virtualSeriesProfiler.endTiming(cleanupTiming, 'cacheCleanup');
    }
  }

  /**
   * Network Request Optimization
   */
  
  determineLoadingStrategy(studyUID, seriesUID, requestedRange) {
    const estimatedInstanceCount = this.estimateInstanceCount(studyUID, seriesUID);
    const connectionQuality = this.assessConnectionQuality();
    const memoryPressure = this.assessMemoryPressure();
    
    let strategy = {
      type: 'standard',
      estimatedInstanceCount,
      connectionQuality,
      memoryPressure,
      priority: 'normal'
    };
    
    // Progressive loading for large datasets
    if (estimatedInstanceCount > 200 && connectionQuality !== 'fast') {
      strategy.type = 'progressive';
      strategy.priority = 'high';
    }
    // Chunked loading for medium datasets
    else if (estimatedInstanceCount > 50) {
      strategy.type = 'chunked';
      strategy.priority = 'normal';
    }
    // Batch loading for small datasets with good connection
    else if (connectionQuality === 'fast' && memoryPressure === 'low') {
      strategy.type = 'batch';
      strategy.priority = 'normal';
    }
    
    return strategy;
  }

  async processConcurrentRequests(promises, maxConcurrent) {
    const results = [];
    const executing = [];
    
    for (const promise of promises) {
      const p = Promise.resolve(promise).then(result => {
        executing.splice(executing.indexOf(p), 1);
        return result;
      });
      
      results.push(p);
      
      if (promises.length >= maxConcurrent) {
        executing.push(p);
        
        if (executing.length >= maxConcurrent) {
          await Promise.race(executing);
        }
      }
    }
    
    return Promise.all(results);
  }

  /**
   * Memory Management
   */
  
  initializeMemoryMonitoring() {
    if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
      setInterval(() => {
        this.checkMemoryPressure();
      }, this.options.autoCleanupInterval);
    }
  }

  checkMemoryPressure() {
    if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
      const memoryInfo = window.performance.memory;
      const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      
      if (usedMB > this.options.memoryThresholdMB) {
        this.log('Memory pressure detected, performing cleanup', { usedMB });
        this.performCacheCleanup();
      }
    }
  }

  assessMemoryPressure() {
    if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
      const memoryInfo = window.performance.memory;
      const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
      const usageRatio = usedMB / totalMB;
      
      if (usageRatio > 0.8) return 'high';
      if (usageRatio > 0.6) return 'medium';
      return 'low';
    }
    
    return 'unknown';
  }

  /**
   * Network Detection and Optimization
   */
  
  initializeNetworkDetection() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      this.connectionSpeed = connection.effectiveType || 'unknown';
      
      connection.addEventListener('change', () => {
        this.connectionSpeed = connection.effectiveType || 'unknown';
        this.log('Connection speed changed', { speed: this.connectionSpeed });
      });
    }
  }

  assessConnectionQuality() {
    switch (this.connectionSpeed) {
      case '4g':
        return 'fast';
      case '3g':
        return 'medium';
      case 'slow-2g':
      case '2g':
        return 'slow';
      default:
        return 'unknown';
    }
  }

  /**
   * Utility Methods
   */
  
  generateCacheKey(studyUID, seriesUID, requestedRange) {
    const rangeKey = requestedRange ? `${requestedRange.start}-${requestedRange.end}` : 'all';
    return `virtual-series:${studyUID}:${seriesUID}:${rangeKey}`;
  }

  estimateDataSize(data) {
    // Rough estimation of data size in bytes
    return JSON.stringify(data).length * 2; // Factor for object overhead
  }

  updateMemoryUsage(delta) {
    this.memoryUsage += delta;
    this.memoryUsage = Math.max(0, this.memoryUsage);
  }

  estimateInstanceCount(studyUID, seriesUID) {
    // This would integrate with study metadata to get actual counts
    // For now, return a reasonable default
    return 100;
  }

  updateCacheHitRate(wasHit) {
    const totalRequests = this.performanceMetrics.totalRequestsProcessed;
    if (totalRequests === 0) {
      this.performanceMetrics.cacheHitRate = wasHit ? 1 : 0;
    } else {
      const hits = this.performanceMetrics.cacheHitRate * (totalRequests - 1);
      this.performanceMetrics.cacheHitRate = (hits + (wasHit ? 1 : 0)) / totalRequests;
    }
  }

  shouldContinueLoading() {
    return this.activeRequests.size < this.options.maxConcurrentRequests &&
           this.assessMemoryPressure() !== 'high';
  }

  log(message, data = null) {
    if (this.options.enableDebugLogging) {
      if (data) {
        console.log(`[VirtualSeriesLoadingManager] ${message}`, data);
      } else {
        console.log(`[VirtualSeriesLoadingManager] ${message}`);
      }
    }
  }

  /**
   * Performance and Monitoring
   */
  
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheSize: this.cache.size,
      memoryUsage: `${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      connectionSpeed: this.connectionSpeed,
      activeRequests: this.activeRequests.size
    };
  }

  initializeAutoCleanup() {
    setInterval(() => {
      this.performCacheCleanup();
    }, this.options.autoCleanupInterval);
  }

  /**
   * Cleanup and disposal
   */
  dispose() {
    this.cache.clear();
    this.loadingQueue = [];
    this.activeRequests.clear();
    this.memoryUsage = 0;
    this.log('VirtualSeriesLoadingManager disposed');
  }
}

// Singleton instance for global use
let globalLoadingManager = null;

export function getVirtualSeriesLoadingManager(options = {}) {
  if (!globalLoadingManager) {
    globalLoadingManager = new VirtualSeriesLoadingManager(options);
  }
  return globalLoadingManager;
}

export function resetVirtualSeriesLoadingManager() {
  if (globalLoadingManager) {
    globalLoadingManager.dispose();
    globalLoadingManager = null;
  }
}

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.getVirtualSeriesLoadingManager = getVirtualSeriesLoadingManager;
  window.VirtualSeriesLoadingManager = VirtualSeriesLoadingManager;
} 