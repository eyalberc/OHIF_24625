/**
 * Virtual Series Performance Monitoring and Profiling Utilities
 * 
 * Tools for measuring and optimizing Virtual Series "Scroll All" implementation
 * Task 4.1: Performance Profiling of Virtual Series
 */

// Performance metrics collection
class VirtualSeriesProfiler {
  constructor() {
    this.metrics = {
      mapStudiesTime: [],
      memoryUsage: [],
      instanceProcessingTime: [],
      sortingTime: [],
      retrieveTime: [],
      renderTime: []
    };
    this.isProfilingEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing a specific operation
   */
  startTiming(operation) {
    if (!this.isProfilingEnabled) return null;
    
    const timingId = `${operation}_${Date.now()}_${Math.random()}`;
    performance.mark(`${timingId}_start`);
    
    return {
      timingId,
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    };
  }

  /**
   * End timing and record metrics
   */
  endTiming(timingContext, operation) {
    if (!this.isProfilingEnabled || !timingContext) return null;
    
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    
    performance.mark(`${timingContext.timingId}_end`);
    performance.measure(
      timingContext.timingId,
      `${timingContext.timingId}_start`,
      `${timingContext.timingId}_end`
    );

    const duration = endTime - timingContext.startTime;
    const memoryDelta = endMemory.usedJSHeapSize - timingContext.startMemory.usedJSHeapSize;

    // Record metrics
    if (this.metrics[operation]) {
      this.metrics[operation].push({
        duration,
        memoryDelta,
        timestamp: Date.now(),
        startMemory: timingContext.startMemory.usedJSHeapSize,
        endMemory: endMemory.usedJSHeapSize
      });
    }

    return {
      duration,
      memoryDelta,
      operation
    };
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    // Check if performance.memory is available (Chrome/Chromium only)
    if (performance && 'memory' in performance) {
      const memoryInfo = performance.memory;
      return {
        usedJSHeapSize: memoryInfo.usedJSHeapSize || 0,
        totalJSHeapSize: memoryInfo.totalJSHeapSize || 0,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit || 0
      };
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }

  /**
   * Profile mapStudies function execution
   */
  profileMapStudies(mapStudiesFunction, studies) {
    const timing = this.startTiming('mapStudiesTime');
    
    try {
      const result = mapStudiesFunction(studies);
      const metrics = this.endTiming(timing, 'mapStudiesTime');
      
      console.log(`[VirtualSeries] mapStudies completed in ${metrics.duration.toFixed(2)}ms`);
      console.log(`[VirtualSeries] Memory delta: ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      
      return result;
    } catch (error) {
      console.error('[VirtualSeries] mapStudies error:', error);
      throw error;
    }
  }

  /**
   * Profile instance processing performance
   */
  profileInstanceProcessing(instances, sortFunction) {
    const timing = this.startTiming('instanceProcessingTime');
    
    try {
      // Measure sorting specifically
      const sortTiming = this.startTiming('sortingTime');
      const sortedInstances = sortFunction(instances);
      this.endTiming(sortTiming, 'sortingTime');
      
      const metrics = this.endTiming(timing, 'instanceProcessingTime');
      
      console.log(`[VirtualSeries] Processed ${instances.length} instances in ${metrics.duration.toFixed(2)}ms`);
      
      return sortedInstances;
    } catch (error) {
      console.error('[VirtualSeries] Instance processing error:', error);
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {};
    
    Object.keys(this.metrics).forEach(operation => {
      const measurements = this.metrics[operation];
      if (measurements.length > 0) {
        const durations = measurements.map(m => m.duration);
        const memoryDeltas = measurements.map(m => m.memoryDelta);
        
        summary[operation] = {
          count: measurements.length,
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          maxDuration: Math.max(...durations),
          minDuration: Math.min(...durations),
          avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
          maxMemoryDelta: Math.max(...memoryDeltas),
          totalMemoryUsed: memoryDeltas.reduce((a, b) => a + b, 0)
        };
      }
    });
    
    return summary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });
  }
}

// Test data generation for performance testing
class VirtualSeriesTestDataGenerator {
  /**
   * Generate synthetic study with specified number of series and instances
   */
  static generateLargeStudy(config = {}) {
    const {
      studyUID = `1.2.3.4.${Date.now()}`,
      seriesCount = 5,
      instancesPerSeries = 100,
      modality = 'CT',
      includeTimeMetadata = true
    } = config;

    const study = {
      StudyInstanceUID: studyUID,
      StudyDate: '20241215',
      StudyTime: '120000',
      StudyDescription: `Performance Test Study - ${seriesCount}x${instancesPerSeries} images`,
      PatientName: 'TEST^PERFORMANCE',
      PatientID: 'PERF001',
      series: []
    };

    // Generate multiple series
    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const series = {
        SeriesInstanceUID: `${studyUID}.${seriesIndex + 1}`,
        SeriesNumber: (seriesIndex + 1).toString(),
        SeriesDescription: `Test Series ${seriesIndex + 1}`,
        SeriesDate: study.StudyDate,
        SeriesTime: study.StudyTime,
        Modality: modality,
        instances: []
      };

      // Generate instances for each series
      for (let instanceIndex = 0; instanceIndex < instancesPerSeries; instanceIndex++) {
        const instance = {
          SOPInstanceUID: `${series.SeriesInstanceUID}.${instanceIndex + 1}`,
          InstanceNumber: instanceIndex + 1,
          ImagePositionPatient: [0, 0, instanceIndex * 1.25], // 1.25mm slice spacing
          ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
          PixelSpacing: [0.625, 0.625],
          SliceThickness: 1.25,
          Rows: 512,
          Columns: 512
        };

        // Add time metadata for sorting tests
        if (includeTimeMetadata) {
          const timeOffset = instanceIndex * 100; // 100ms between acquisitions
          const acquisitionTime = new Date(Date.now() + timeOffset).toTimeString().split(' ')[0].replace(/:/g, '');
          instance.AcquisitionTime = acquisitionTime;
        }

        series.instances.push(instance);
      }

      study.series.push(series);
    }

    return study;
  }

  /**
   * Generate performance test suite with various study sizes
   */
  static generatePerformanceTestSuite() {
    return {
      small: this.generateLargeStudy({ seriesCount: 2, instancesPerSeries: 50 }),
      medium: this.generateLargeStudy({ seriesCount: 5, instancesPerSeries: 100 }),
      large: this.generateLargeStudy({ seriesCount: 10, instancesPerSeries: 200 }),
      xlarge: this.generateLargeStudy({ seriesCount: 15, instancesPerSeries: 300 }),
      extreme: this.generateLargeStudy({ seriesCount: 20, instancesPerSeries: 500 })
    };
  }

  /**
   * Generate studies with edge case characteristics
   */
  static generateEdgeCaseStudies() {
    return {
      // Study with missing time metadata
      noTimeMetadata: this.generateLargeStudy({ 
        seriesCount: 3, 
        instancesPerSeries: 100, 
        includeTimeMetadata: false 
      }),
      
      // Single series with many instances
      singleSeries: this.generateLargeStudy({ 
        seriesCount: 1, 
        instancesPerSeries: 1000 
      }),
      
      // Many series with few instances each
      manySeries: this.generateLargeStudy({ 
        seriesCount: 50, 
        instancesPerSeries: 10 
      }),
      
      // Mixed modalities
      multiModality: (() => {
        const study = this.generateLargeStudy({ seriesCount: 4, instancesPerSeries: 100 });
        study.series[0].Modality = 'CT';
        study.series[1].Modality = 'MR';
        study.series[2].Modality = 'PET';
        study.series[3].Modality = 'US';
        return study;
      })()
    };
  }
}

// Performance benchmarking suite
class VirtualSeriesBenchmark {
  constructor() {
    this.profiler = new VirtualSeriesProfiler();
    this.results = {};
  }

  /**
   * Run comprehensive performance benchmark
   */
  async runBenchmark(mapStudiesFunction) {
    console.log('[VirtualSeries] Starting performance benchmark...');
    
    const testSuite = VirtualSeriesTestDataGenerator.generatePerformanceTestSuite();
    const edgeCases = VirtualSeriesTestDataGenerator.generateEdgeCaseStudies();
    
    // Test normal cases
    for (const [testName, testStudy] of Object.entries(testSuite)) {
      console.log(`[VirtualSeries] Testing ${testName} study...`);
      
      const startTime = performance.now();
      const result = this.profiler.profileMapStudies(mapStudiesFunction, [testStudy]);
      const endTime = performance.now();
      
      this.results[testName] = {
        studySize: {
          seriesCount: testStudy.series.length,
          totalInstances: testStudy.series.reduce((total, series) => total + series.instances.length, 0)
        },
        performance: {
          totalTime: endTime - startTime,
          memoryUsage: this.profiler.getMemoryUsage()
        },
        virtualSeries: result[0].series[0] // First series should be the virtual one
      };
    }
    
    // Test edge cases
    for (const [caseName, testStudy] of Object.entries(edgeCases)) {
      console.log(`[VirtualSeries] Testing edge case: ${caseName}...`);
      
      try {
        const result = this.profiler.profileMapStudies(mapStudiesFunction, [testStudy]);
        this.results[`edge_${caseName}`] = {
          success: true,
          studySize: {
            seriesCount: testStudy.series.length,
            totalInstances: testStudy.series.reduce((total, series) => total + series.instances.length, 0)
          },
          virtualSeries: result[0].series[0]
        };
      } catch (error) {
        this.results[`edge_${caseName}`] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return this.generateBenchmarkReport();
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateBenchmarkReport() {
    const performanceSummary = this.profiler.getPerformanceSummary();
    
    const report = {
      timestamp: new Date().toISOString(),
      performanceMetrics: performanceSummary,
      testResults: this.results,
      recommendations: this.generateRecommendations()
    };
    
    // Log summary to console
    console.log('\n[VirtualSeries] PERFORMANCE BENCHMARK RESULTS');
    console.log('='.repeat(60));
    
    Object.entries(this.results).forEach(([testName, result]) => {
      if (result.performance) {
        console.log(`${testName}:`);
        console.log(`  - Total instances: ${result.studySize.totalInstances}`);
        console.log(`  - Processing time: ${result.performance.totalTime.toFixed(2)}ms`);
        console.log(`  - Memory usage: ${(result.performance.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  - Virtual series instances: ${result.virtualSeries.instances.length}`);
      }
    });
    
    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    
    return report;
  }

  /**
   * Generate optimization recommendations based on benchmark results
   */
  generateRecommendations() {
    const recommendations = [];
    const performanceSummary = this.profiler.getPerformanceSummary();
    
    // Analyze mapStudies performance
    if (performanceSummary.mapStudiesTime) {
      const avgTime = performanceSummary.mapStudiesTime.avgDuration;
      if (avgTime > 1000) {
        recommendations.push('mapStudies function is slow (>1s average). Consider implementing lazy loading.');
      }
      if (avgTime > 500) {
        recommendations.push('Instance processing should be moved to a Web Worker for large studies.');
      }
    }
    
    // Analyze memory usage
    if (performanceSummary.instanceProcessingTime) {
      const avgMemory = performanceSummary.instanceProcessingTime.avgMemoryDelta;
      if (avgMemory > 50 * 1024 * 1024) { // 50MB
        recommendations.push('High memory usage detected. Implement virtual scrolling or pagination.');
      }
    }
    
    // Check for sorting performance
    if (performanceSummary.sortingTime) {
      const avgSortTime = performanceSummary.sortingTime.avgDuration;
      if (avgSortTime > 100) {
        recommendations.push('Instance sorting is expensive. Consider pre-sorting or indexing strategies.');
      }
    }
    
    // General recommendations
    recommendations.push('Implement caching for frequently accessed virtual series data.');
    recommendations.push('Add progressive loading for very large studies (>1000 instances).');
    recommendations.push('Consider implementing memory cleanup when navigating away from studies.');
    
    return recommendations;
  }
}

// Global profiler instance
export const virtualSeriesProfiler = new VirtualSeriesProfiler();
export { VirtualSeriesTestDataGenerator, VirtualSeriesBenchmark };

// Development helper to run benchmarks
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.virtualSeriesProfiler = virtualSeriesProfiler;
  window.VirtualSeriesTestDataGenerator = VirtualSeriesTestDataGenerator;
  window.VirtualSeriesBenchmark = VirtualSeriesBenchmark;
  
  // Helper function to run quick benchmark
  window.runVirtualSeriesBenchmark = async (mapStudiesFunction) => {
    const benchmark = new VirtualSeriesBenchmark();
    return await benchmark.runBenchmark(mapStudiesFunction);
  };
} 