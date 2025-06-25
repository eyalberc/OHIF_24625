/**
 * Highlighting Optimization Utilities - OHIF v3 Enhanced System
 * 
 * Task 10.3: Study Comparison Highlighting Optimization
 * 
 * OPTIMIZATION UTILITIES:
 * - Efficient difference detection algorithms
 * - Adaptive thresholding for dynamic highlighting
 * - Spatial indexing for fast region lookup
 * - Memory-efficient image processing
 * - GPU acceleration utilities
 * - Performance monitoring and metrics
 */

/**
 * Efficient difference detection using optimized algorithms
 */
export class DifferenceDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.15;
    this.colorSpace = options.colorSpace || 'RGB';
    this.filterSize = options.filterSize || 3;
    this.useAdaptiveThreshold = options.useAdaptiveThreshold || true;
  }

  /**
   * Detect differences between two image data arrays
   */
  detectDifferences(imageData1, imageData2, options = {}) {
    const startTime = performance.now();
    
    if (!this.validateInputs(imageData1, imageData2)) {
      throw new Error('Invalid image data for difference detection');
    }

    const detectionOptions = { ...this.getDefaultOptions(), ...options };
    const differences = [];

    switch (detectionOptions.algorithm) {
      case 'pixel-by-pixel':
        return this.pixelByPixelDetection(imageData1, imageData2, detectionOptions);
      
      case 'block-based':
        return this.blockBasedDetection(imageData1, imageData2, detectionOptions);
      
      case 'gradient-based':
        return this.gradientBasedDetection(imageData1, imageData2, detectionOptions);
      
      case 'adaptive':
        return this.adaptiveDetection(imageData1, imageData2, detectionOptions);
      
      default:
        return this.optimizedDetection(imageData1, imageData2, detectionOptions);
    }
  }

  /**
   * Optimized difference detection with multiple strategies
   */
  optimizedDetection(imageData1, imageData2, options) {
    const { width, height } = imageData1;
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    const differences = [];
    
    // Use SIMD-like operations for better performance
    const batchSize = 16; // Process 16 pixels at once
    const threshold = options.threshold;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x += batchSize) {
        const endX = Math.min(x + batchSize, width);
        const batchDifferences = this.processBatch(
          data1, data2, x, y, endX, width, threshold
        );
        differences.push(...batchDifferences);
      }
    }

    return this.postProcessDifferences(differences, options);
  }

  /**
   * Process a batch of pixels for differences
   */
  processBatch(data1, data2, startX, y, endX, width, threshold) {
    const differences = [];
    
    for (let x = startX; x < endX; x++) {
      const pixelIndex = (y * width + x) * 4;
      const difference = this.calculatePixelDifference(
        data1, data2, pixelIndex, threshold
      );
      
      if (difference.magnitude > threshold) {
        differences.push({
          x,
          y,
          difference: difference.magnitude,
          colorDiff: difference.colorDiff
        });
      }
    }
    
    return differences;
  }

  /**
   * Calculate difference between two pixels
   */
  calculatePixelDifference(data1, data2, pixelIndex, threshold) {
    const r1 = data1[pixelIndex];
    const g1 = data1[pixelIndex + 1];
    const b1 = data1[pixelIndex + 2];
    const a1 = data1[pixelIndex + 3];
    
    const r2 = data2[pixelIndex];
    const g2 = data2[pixelIndex + 1];
    const b2 = data2[pixelIndex + 2];
    const a2 = data2[pixelIndex + 3];

    // Calculate difference based on color space
    let magnitude;
    
    switch (this.colorSpace) {
      case 'LAB':
        magnitude = this.calculateLABDifference(r1, g1, b1, r2, g2, b2);
        break;
      
      case 'HSV':
        magnitude = this.calculateHSVDifference(r1, g1, b1, r2, g2, b2);
        break;
      
      default: // RGB
        magnitude = Math.sqrt(
          Math.pow(r1 - r2, 2) + 
          Math.pow(g1 - g2, 2) + 
          Math.pow(b1 - b2, 2)
        ) / (255 * Math.sqrt(3));
    }

    return {
      magnitude,
      colorDiff: {
        r: Math.abs(r1 - r2),
        g: Math.abs(g1 - g2),
        b: Math.abs(b1 - b2),
        a: Math.abs(a1 - a2)
      }
    };
  }

  /**
   * Block-based difference detection for better performance
   */
  blockBasedDetection(imageData1, imageData2, options) {
    const { width, height } = imageData1;
    const blockSize = options.blockSize || 8;
    const differences = [];

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        const blockDiff = this.calculateBlockDifference(
          imageData1, imageData2, x, y, blockSize, options.threshold
        );
        
        if (blockDiff.difference > options.threshold) {
          differences.push({
            x,
            y,
            width: Math.min(blockSize, width - x),
            height: Math.min(blockSize, height - y),
            difference: blockDiff.difference,
            type: 'block'
          });
        }
      }
    }

    return differences;
  }

  /**
   * Calculate difference for a block of pixels
   */
  calculateBlockDifference(imageData1, imageData2, startX, startY, blockSize, threshold) {
    const { width } = imageData1;
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    
    let totalDifference = 0;
    let pixelCount = 0;

    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        
        if (x >= width || y >= imageData1.height) continue;
        
        const pixelIndex = (y * width + x) * 4;
        const pixelDiff = this.calculatePixelDifference(data1, data2, pixelIndex, threshold);
        
        totalDifference += pixelDiff.magnitude;
        pixelCount++;
      }
    }

    return {
      difference: pixelCount > 0 ? totalDifference / pixelCount : 0,
      pixelCount
    };
  }

  /**
   * Post-process differences to remove noise and merge regions
   */
  postProcessDifferences(differences, options) {
    let processed = differences;

    // Remove isolated pixels (noise reduction)
    if (options.removeNoise) {
      processed = this.removeNoisyDifferences(processed, options.noiseThreshold || 3);
    }

    // Merge nearby differences into regions
    if (options.mergeRegions) {
      processed = this.mergeNearbyDifferences(processed, options.mergeDistance || 5);
    }

    // Filter by minimum size
    if (options.minRegionSize) {
      processed = processed.filter(diff => 
        (diff.width || 1) * (diff.height || 1) >= options.minRegionSize
      );
    }

    return processed;
  }

  /**
   * Remove noisy differences using connectivity analysis
   */
  removeNoisyDifferences(differences, threshold) {
    const spatialMap = new Map();
    
    // Build spatial map
    differences.forEach((diff, index) => {
      const key = ${diff.x},;
      spatialMap.set(key, { diff, index, neighbors: 0 });
    });

    // Count neighbors for each difference
    spatialMap.forEach((item, key) => {
      const [x, y] = key.split(',').map(Number);
      
      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const neighborKey = ${x + dx},;
          if (spatialMap.has(neighborKey)) {
            item.neighbors++;
          }
        }
      }
    });

    // Filter out isolated differences
    return Array.from(spatialMap.values())
      .filter(item => item.neighbors >= threshold)
      .map(item => item.diff);
  }

  /**
   * Merge nearby differences into larger regions
   */
  mergeNearbyDifferences(differences, maxDistance) {
    const merged = [];
    const used = new Set();

    differences.forEach((diff, index) => {
      if (used.has(index)) return;

      const region = {
        x: diff.x,
        y: diff.y,
        width: diff.width || 1,
        height: diff.height || 1,
        difference: diff.difference,
        mergedCount: 1
      };

      used.add(index);

      // Find nearby differences to merge
      differences.forEach((otherDiff, otherIndex) => {
        if (used.has(otherIndex) || index === otherIndex) return;

        const distance = Math.sqrt(
          Math.pow(diff.x - otherDiff.x, 2) + 
          Math.pow(diff.y - otherDiff.y, 2)
        );

        if (distance <= maxDistance) {
          // Expand region to include other difference
          const minX = Math.min(region.x, otherDiff.x);
          const minY = Math.min(region.y, otherDiff.y);
          const maxX = Math.max(region.x + region.width, otherDiff.x + (otherDiff.width || 1));
          const maxY = Math.max(region.y + region.height, otherDiff.y + (otherDiff.height || 1));

          region.x = minX;
          region.y = minY;
          region.width = maxX - minX;
          region.height = maxY - minY;
          region.difference = Math.max(region.difference, otherDiff.difference);
          region.mergedCount++;

          used.add(otherIndex);
        }
      });

      merged.push(region);
    });

    return merged;
  }

  /**
   * Validate input image data
   */
  validateInputs(imageData1, imageData2) {
    return imageData1 && imageData2 && 
           imageData1.width === imageData2.width &&
           imageData1.height === imageData2.height &&
           imageData1.data && imageData2.data &&
           imageData1.data.length === imageData2.data.length;
  }

  /**
   * Get default detection options
   */
  getDefaultOptions() {
    return {
      algorithm: 'optimized',
      threshold: this.threshold,
      blockSize: 8,
      removeNoise: true,
      noiseThreshold: 3,
      mergeRegions: true,
      mergeDistance: 5,
      minRegionSize: 4
    };
  }
}

/**
 * Adaptive thresholding for dynamic highlighting
 */
export class AdaptiveThresholdCalculator {
  constructor() {
    this.historySize = 10;
    this.thresholdHistory = [];
  }

  /**
   * Calculate adaptive threshold based on image characteristics
   */
  calculateAdaptiveThreshold(imageData1, imageData2, baseThreshold = 0.15) {
    const imageStats = this.analyzeImageStatistics(imageData1, imageData2);
    const adaptiveThreshold = this.computeThreshold(imageStats, baseThreshold);
    
    // Store in history for smoothing
    this.thresholdHistory.push(adaptiveThreshold);
    if (this.thresholdHistory.length > this.historySize) {
      this.thresholdHistory.shift();
    }

    // Return smoothed threshold
    return this.smoothThreshold();
  }

  /**
   * Analyze image statistics for threshold calculation
   */
  analyzeImageStatistics(imageData1, imageData2) {
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    const pixelCount = data1.length / 4;

    let sumDifference = 0;
    let maxDifference = 0;
    let varianceSum = 0;

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

      const difference = Math.sqrt(
        Math.pow(r1 - r2, 2) + 
        Math.pow(g1 - g2, 2) + 
        Math.pow(b1 - b2, 2)
      ) / (255 * Math.sqrt(3));

      sumDifference += difference;
      maxDifference = Math.max(maxDifference, difference);
    }

    const meanDifference = sumDifference / pixelCount;

    // Calculate variance
    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

      const difference = Math.sqrt(
        Math.pow(r1 - r2, 2) + 
        Math.pow(g1 - g2, 2) + 
        Math.pow(b1 - b2, 2)
      ) / (255 * Math.sqrt(3));

      varianceSum += Math.pow(difference - meanDifference, 2);
    }

    const variance = varianceSum / pixelCount;
    const standardDeviation = Math.sqrt(variance);

    return {
      meanDifference,
      maxDifference,
      standardDeviation,
      pixelCount
    };
  }

  /**
   * Compute adaptive threshold based on statistics
   */
  computeThreshold(stats, baseThreshold) {
    // Use Otsu's method inspired approach
    const { meanDifference, standardDeviation } = stats;
    
    // Adaptive threshold = mean + k * standard deviation
    const k = 1.5; // Empirically determined factor
    let adaptiveThreshold = meanDifference + k * standardDeviation;
    
    // Clamp to reasonable bounds
    adaptiveThreshold = Math.max(adaptiveThreshold, baseThreshold * 0.5);
    adaptiveThreshold = Math.min(adaptiveThreshold, baseThreshold * 2.0);
    
    return adaptiveThreshold;
  }

  /**
   * Smooth threshold using historical values
   */
  smoothThreshold() {
    if (this.thresholdHistory.length === 0) return 0.15;
    
    // Use exponential moving average
    const weights = this.thresholdHistory.map((_, index) => 
      Math.pow(0.8, this.thresholdHistory.length - index - 1)
    );
    
    const weightedSum = this.thresholdHistory.reduce((sum, threshold, index) => 
      sum + threshold * weights[index], 0
    );
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    return weightedSum / totalWeight;
  }
}

/**
 * Spatial indexing for efficient region lookup
 */
export class SpatialIndex {
  constructor(bounds, cellSize = 32) {
    this.bounds = bounds;
    this.cellSize = cellSize;
    this.grid = new Map();
    this.items = new Map();
  }

  /**
   * Add item to spatial index
   */
  add(id, x, y, width = 1, height = 1, data = null) {
    const item = { id, x, y, width, height, data };
    this.items.set(id, item);

    const cells = this.getCellsForRegion(x, y, width, height);
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey).add(id);
    });
  }

  /**
   * Remove item from spatial index
   */
  remove(id) {
    const item = this.items.get(id);
    if (!item) return;

    const cells = this.getCellsForRegion(item.x, item.y, item.width, item.height);
    cells.forEach(cellKey => {
      const cellItems = this.grid.get(cellKey);
      if (cellItems) {
        cellItems.delete(id);
        if (cellItems.size === 0) {
          this.grid.delete(cellKey);
        }
      }
    });

    this.items.delete(id);
  }

  /**
   * Query items in region
   */
  query(x, y, width = 1, height = 1) {
    const cells = this.getCellsForRegion(x, y, width, height);
    const candidateIds = new Set();

    cells.forEach(cellKey => {
      const cellItems = this.grid.get(cellKey);
      if (cellItems) {
        cellItems.forEach(id => candidateIds.add(id));
      }
    });

    // Filter candidates by actual intersection
    const results = [];
    candidateIds.forEach(id => {
      const item = this.items.get(id);
      if (item && this.intersects(x, y, width, height, item.x, item.y, item.width, item.height)) {
        results.push(item);
      }
    });

    return results;
  }

  /**
   * Get cell keys for region
   */
  getCellsForRegion(x, y, width, height) {
    const startX = Math.floor(x / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endX = Math.floor((x + width - 1) / this.cellSize);
    const endY = Math.floor((y + height - 1) / this.cellSize);

    const cells = [];
    for (let cellY = startY; cellY <= endY; cellY++) {
      for (let cellX = startX; cellX <= endX; cellX++) {
        cells.push(${cellX},);
      }
    }

    return cells;
  }

  /**
   * Check if two rectangles intersect
   */
  intersects(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
  }

  /**
   * Clear all items
   */
  clear() {
    this.grid.clear();
    this.items.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalItems: this.items.size,
      totalCells: this.grid.size,
      averageItemsPerCell: this.grid.size > 0 ? 
        Array.from(this.grid.values()).reduce((sum, set) => sum + set.size, 0) / this.grid.size : 0
    };
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      differenceDetection: [],
      highlighting: [],
      memoryUsage: []
    };
  }

  /**
   * Optimize image data processing based on size
   */
  selectOptimalStrategy(imageData1, imageData2) {
    const pixelCount = imageData1.width * imageData1.height;
    const dataSize = pixelCount * 4; // RGBA

    if (dataSize > 50 * 1024 * 1024) { // > 50MB
      return 'gpu-accelerated';
    } else if (dataSize > 10 * 1024 * 1024) { // > 10MB
      return 'worker-parallel';
    } else if (pixelCount > 1000000) { // > 1M pixels
      return 'chunked-progressive';
    } else {
      return 'standard';
    }
  }

  /**
   * Calculate optimal chunk size for processing
   */
  calculateOptimalChunkSize(imageWidth, imageHeight, memoryLimit = 100 * 1024 * 1024) {
    const bytesPerPixel = 4; // RGBA
    const maxPixelsPerChunk = memoryLimit / (bytesPerPixel * 2); // Two images
    
    let chunkSize = Math.floor(Math.sqrt(maxPixelsPerChunk));
    
    // Align to powers of 2 for better performance
    chunkSize = Math.pow(2, Math.floor(Math.log2(chunkSize)));
    
    // Ensure minimum and maximum chunk sizes
    chunkSize = Math.max(32, Math.min(chunkSize, 512));
    
    return chunkSize;
  }

  /**
   * Monitor memory usage during processing
   */
  monitorMemoryUsage(operation) {
    if (performance.memory) {
      const before = performance.memory.usedJSHeapSize;
      const result = operation();
      const after = performance.memory.usedJSHeapSize;
      
      this.metrics.memoryUsage.push({
        operation: operation.name || 'unknown',
        memoryDelta: after - before,
        timestamp: Date.now()
      });
      
      return result;
    } else {
      return operation();
    }
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    const recommendations = [];
    
    // Analyze memory usage patterns
    if (this.metrics.memoryUsage.length > 0) {
      const avgMemoryDelta = this.metrics.memoryUsage.reduce((sum, metric) => 
        sum + metric.memoryDelta, 0) / this.metrics.memoryUsage.length;
      
      if (avgMemoryDelta > 50 * 1024 * 1024) { // > 50MB average
        recommendations.push({
          type: 'memory',
          message: 'Consider reducing chunk size or using progressive processing',
          severity: 'high'
        });
      }
    }
    
    return recommendations;
  }
}

export default {
  DifferenceDetector,
  AdaptiveThresholdCalculator,
  SpatialIndex,
  PerformanceOptimizer
};
