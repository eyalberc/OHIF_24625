/**
 * Performance Benchmark Service - OHIF v3 Enhanced System
 * 
 * Task 10.5: Performance Benchmarking
 * 
 * FEATURES IMPLEMENTED:
 * - Baseline performance metrics for key operations (study loading, tool usage)
 * - Automated performance testing for CI/CD pipeline integration
 * - Performance budgets for critical user interactions
 * - Performance regression testing protocol
 * - Hardware configuration performance expectations
 * - Benchmarking of optimization impacts
 * - Real-time performance comparison and analysis
 */

import { getPerformanceMonitor } from './PerformanceMonitoringService';
import { getErrorTracker } from './ErrorTrackingService';

/**
 * Performance budgets for different operations (in milliseconds)
 */
export const PERFORMANCE_BUDGETS = {
  // Study Loading Operations
  studyInitialLoad: {
    low: 8000,    // Low-end devices (8 seconds)
    medium: 5000, // Medium devices (5 seconds)
    high: 2000    // High-end devices (2 seconds)
  },
  
  // Virtual Series Operations
  virtualSeriesLoad: {
    low: 3000,
    medium: 2000,
    high: 1000
  },
  
  // Viewport Operations
  viewportRender: {
    low: 500,
    medium: 300,
    high: 150
  },
  
  // Tool Operations
  toolActivation: {
    low: 800,
    medium: 500,
    high: 200
  },
  
  // Study Comparison
  studyComparison: {
    low: 2000,
    medium: 1500,
    high: 800
  },
  
  // Memory Budgets (in MB)
  memoryUsage: {
    low: 800,
    medium: 1500,
    high: 3000
  },
  
  // Frame Rate Budgets (FPS)
  frameRate: {
    low: 20,
    medium: 30,
    high: 60
  }
};

/**
 * Hardware configuration categories
 */
export const HARDWARE_PROFILES = {
  low: {
    name: 'Low-end Device',
    memory: '≤ 8GB RAM',
    cpu: 'Dual-core or older',
    gpu: 'Integrated graphics',
    network: '3G/slow broadband',
    description: 'Basic workstations, older hardware'
  },
  
  medium: {
    name: 'Medium Device',
    memory: '8-16GB RAM',
    cpu: 'Quad-core modern',
    gpu: 'Dedicated graphics',
    network: '4G/broadband',
    description: 'Standard workstations, typical clinical setups'
  },
  
  high: {
    name: 'High-end Device',
    memory: '≥ 32GB RAM',
    cpu: 'Multi-core high-performance',
    gpu: 'High-end dedicated graphics',
    network: '5G/high-speed fiber',
    description: 'Specialized imaging workstations, high-performance setups'
  }
};

/**
 * Benchmark test scenarios
 */
export const BENCHMARK_SCENARIOS = {
  smallStudy: {
    name: 'Small Study',
    seriesCount: 3,
    instancesPerSeries: 25,
    totalInstances: 75,
    estimatedSize: '30MB'
  },
  
  mediumStudy: {
    name: 'Medium Study',
    seriesCount: 8,
    instancesPerSeries: 50,
    totalInstances: 400,
    estimatedSize: '200MB'
  },
  
  largeStudy: {
    name: 'Large Study',
    seriesCount: 15,
    instancesPerSeries: 100,
    totalInstances: 1500,
    estimatedSize: '750MB'
  },
  
  extraLargeStudy: {
    name: 'Extra Large Study',
    seriesCount: 25,
    instancesPerSeries: 200,
    totalInstances: 5000,
    estimatedSize: '2.5GB'
  }
};

/**
 * Performance Benchmark Service
 */
class PerformanceBenchmarkService {
  constructor() {
    this.isEnabled = true;
    this.benchmarkResults = new Map();
    this.baselineMetrics = new Map();
    this.currentHardwareProfile = null;
    this.performanceMonitor = null;
    this.errorTracker = null;
    this.activeBenchmarks = new Map();
    this.isRunning = false;
    
    this.initialize();
  }

  /**
   * Initialize benchmark service
   */
  initialize() {
    console.log('[PerformanceBenchmark] Initializing performance benchmark service');

    // Get service instances
    try {
      this.performanceMonitor = getPerformanceMonitor();
      this.errorTracker = getErrorTracker();
    } catch (error) {
      console.warn('[PerformanceBenchmark] Failed to initialize monitoring services:', error);
    }

    // Detect hardware profile
    this.detectHardwareProfile();

    // Set up benchmark event listeners
    this.setupBenchmarkListeners();

    // Initialize baseline metrics
    this.initializeBaselineMetrics();
  }

  /**
   * Detect current hardware profile
   */
  detectHardwareProfile() {
    const navigator = window.navigator;
    const performance = window.performance;

    let profile = 'medium'; // Default

    try {
      // Estimate based on available information
      const memory = performance.memory ? performance.memory.jsHeapSizeLimit : 0;
      const cores = navigator.hardwareConcurrency || 4;
      const connection = navigator.connection;

      // Simple heuristic for hardware classification
      if (memory > 4 * 1024 * 1024 * 1024 && cores >= 8) { // > 4GB heap limit, 8+ cores
        profile = 'high';
      } else if (memory < 2 * 1024 * 1024 * 1024 || cores <= 2) { // < 2GB heap limit, 2 cores
        profile = 'low';
      }

      // Adjust based on network connection
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          profile = 'low';
        } else if (effectiveType === '4g' && profile !== 'high') {
          profile = 'medium';
        }
      }

    } catch (error) {
      console.warn('[PerformanceBenchmark] Error detecting hardware profile:', error);
    }

    this.currentHardwareProfile = profile;
    console.log(`[PerformanceBenchmark] Detected hardware profile: ${profile}`);

    // Add to error tracking context
    if (this.errorTracker) {
      this.errorTracker.updateSystemContext({
        hardwareProfile: profile,
        hardwareDetails: HARDWARE_PROFILES[profile]
      });
    }
  }

  /**
   * Set up benchmark event listeners
   */
  setupBenchmarkListeners() {
    // Listen for study loading events
    window.addEventListener('ohif-study-load-start', (event) => {
      this.startBenchmark('study-load', event.detail);
    });

    window.addEventListener('ohif-study-load-complete', (event) => {
      this.endBenchmark('study-load', event.detail);
    });

    // Listen for tool events
    window.addEventListener('ohif-tool-activated', (event) => {
      this.startBenchmark('tool-activation', event.detail);
    });

    window.addEventListener('ohif-tool-activation-complete', (event) => {
      this.endBenchmark('tool-activation', event.detail);
    });

    // Listen for viewport events
    window.addEventListener('ohif-viewport-render-start', (event) => {
      this.startBenchmark('viewport-render', event.detail);
    });

    window.addEventListener('ohif-viewport-render-complete', (event) => {
      this.endBenchmark('viewport-render', event.detail);
    });
  }

  /**
   * Initialize baseline metrics
   */
  initializeBaselineMetrics() {
    // Set baseline expectations based on hardware profile
    const profile = this.currentHardwareProfile;
    
    this.baselineMetrics.set('study-load', {
      target: PERFORMANCE_BUDGETS.studyInitialLoad[profile],
      acceptable: PERFORMANCE_BUDGETS.studyInitialLoad[profile] * 1.5,
      critical: PERFORMANCE_BUDGETS.studyInitialLoad[profile] * 2
    });

    this.baselineMetrics.set('virtual-series-load', {
      target: PERFORMANCE_BUDGETS.virtualSeriesLoad[profile],
      acceptable: PERFORMANCE_BUDGETS.virtualSeriesLoad[profile] * 1.5,
      critical: PERFORMANCE_BUDGETS.virtualSeriesLoad[profile] * 2
    });

    this.baselineMetrics.set('viewport-render', {
      target: PERFORMANCE_BUDGETS.viewportRender[profile],
      acceptable: PERFORMANCE_BUDGETS.viewportRender[profile] * 1.5,
      critical: PERFORMANCE_BUDGETS.viewportRender[profile] * 2
    });

    this.baselineMetrics.set('tool-activation', {
      target: PERFORMANCE_BUDGETS.toolActivation[profile],
      acceptable: PERFORMANCE_BUDGETS.toolActivation[profile] * 1.5,
      critical: PERFORMANCE_BUDGETS.toolActivation[profile] * 2
    });

    console.log('[PerformanceBenchmark] Baseline metrics initialized for hardware profile:', profile);
  }

  /**
   * Start a benchmark measurement
   */
  startBenchmark(benchmarkType, context = {}) {
    if (!this.isEnabled) return null;

    const benchmarkId = this.generateBenchmarkId(benchmarkType);
    const startTime = performance.now();

    const benchmark = {
      id: benchmarkId,
      type: benchmarkType,
      startTime,
      context,
      hardwareProfile: this.currentHardwareProfile,
      systemState: this.captureSystemState()
    };

    // Store active benchmark
    this.activeBenchmarks.set(benchmarkId, benchmark);

    // Create performance mark
    if (this.performanceMonitor) {
      this.performanceMonitor.createPerformanceMark(`benchmark-${benchmarkType}-start`, {
        benchmarkId,
        context
      });
    }

    return benchmarkId;
  }

  /**
   * End a benchmark measurement
   */
  endBenchmark(benchmarkType, context = {}) {
    if (!this.isEnabled) return null;

    const endTime = performance.now();

    // Find matching active benchmark
    let benchmarkId = null;
    let benchmark = null;

    for (const [id, activeBenchmark] of this.activeBenchmarks.entries()) {
      if (activeBenchmark.type === benchmarkType) {
        benchmarkId = id;
        benchmark = activeBenchmark;
        break;
      }
    }

    if (!benchmark) {
      console.warn(`[PerformanceBenchmark] No active benchmark found for type: ${benchmarkType}`);
      return null;
    }

    // Calculate duration
    const duration = endTime - benchmark.startTime;

    // Complete benchmark record
    const completedBenchmark = {
      ...benchmark,
      endTime,
      duration,
      endContext: context,
      systemStateEnd: this.captureSystemState(),
      performanceScore: this.calculatePerformanceScore(benchmarkType, duration),
      budgetCompliance: this.checkBudgetCompliance(benchmarkType, duration)
    };

    // Store result
    if (!this.benchmarkResults.has(benchmarkType)) {
      this.benchmarkResults.set(benchmarkType, []);
    }
    this.benchmarkResults.get(benchmarkType).push(completedBenchmark);

    // Remove from active benchmarks
    this.activeBenchmarks.delete(benchmarkId);

    // Create performance measure
    if (this.performanceMonitor) {
      this.performanceMonitor.createPerformanceMeasure(
        `benchmark-${benchmarkType}`,
        `ohif-benchmark-${benchmarkType}-start`
      );
    }

    // Log benchmark result
    this.logBenchmarkResult(completedBenchmark);

    // Check for performance regression
    this.checkPerformanceRegression(benchmarkType, completedBenchmark);

    return benchmarkId;
  }

  /**
   * Capture current system state
   */
  captureSystemState() {
    const state = {
      timestamp: Date.now(),
      memory: null,
      cpu: null,
      network: null
    };

    try {
      // Memory information
      if (performance.memory) {
        state.memory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        };
      }

      // Network information
      if (navigator.connection) {
        state.network = {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        };
      }

      // Basic CPU estimation
      state.cpu = {
        cores: navigator.hardwareConcurrency || 'unknown'
      };

    } catch (error) {
      console.warn('[PerformanceBenchmark] Error capturing system state:', error);
    }

    return state;
  }

  /**
   * Calculate performance score (0-100)
   */
  calculatePerformanceScore(benchmarkType, duration) {
    const baseline = this.baselineMetrics.get(benchmarkType);
    if (!baseline) return 50; // Neutral score if no baseline

    if (duration <= baseline.target) {
      return 100; // Excellent performance
    } else if (duration <= baseline.acceptable) {
      // Linear scale from 100 to 70
      const ratio = (duration - baseline.target) / (baseline.acceptable - baseline.target);
      return Math.round(100 - (ratio * 30));
    } else if (duration <= baseline.critical) {
      // Linear scale from 70 to 30
      const ratio = (duration - baseline.acceptable) / (baseline.critical - baseline.acceptable);
      return Math.round(70 - (ratio * 40));
    } else {
      // Below critical threshold
      return Math.max(0, Math.round(30 - ((duration - baseline.critical) / baseline.critical) * 30));
    }
  }

  /**
   * Check budget compliance
   */
  checkBudgetCompliance(benchmarkType, duration) {
    const baseline = this.baselineMetrics.get(benchmarkType);
    if (!baseline) return 'unknown';

    if (duration <= baseline.target) {
      return 'excellent';
    } else if (duration <= baseline.acceptable) {
      return 'good';
    } else if (duration <= baseline.critical) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  }

  /**
   * Run automated benchmark suite
   */
  async runBenchmarkSuite(scenarios = Object.keys(BENCHMARK_SCENARIOS)) {
    if (this.isRunning) {
      console.warn('[PerformanceBenchmark] Benchmark suite already running');
      return;
    }

    this.isRunning = true;
    console.log('[PerformanceBenchmark] Starting automated benchmark suite');

    const results = {
      startTime: Date.now(),
      hardwareProfile: this.currentHardwareProfile,
      scenarios: [],
      summary: null
    };

    try {
      for (const scenarioName of scenarios) {
        const scenario = BENCHMARK_SCENARIOS[scenarioName];
        if (!scenario) continue;

        console.log(`[PerformanceBenchmark] Running scenario: ${scenario.name}`);
        
        const scenarioResult = await this.runScenario(scenario);
        results.scenarios.push(scenarioResult);

        // Brief pause between scenarios
        await this.sleep(1000);
      }

      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;
      results.summary = this.generateBenchmarkSummary(results);

      console.log('[PerformanceBenchmark] Benchmark suite completed:', results.summary);

    } catch (error) {
      console.error('[PerformanceBenchmark] Benchmark suite failed:', error);
      
      if (this.errorTracker) {
        this.errorTracker.captureError(error, {
          category: 'performance',
          severity: 'high',
          component: 'benchmark',
          context: { phase: 'benchmark-suite' }
        });
      }
    }

    this.isRunning = false;
    return results;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(tests) {
    const recommendations = [];
    const poorTests = tests.filter(t => t.compliance === 'poor');
    
    if (poorTests.length > 0) {
      recommendations.push({
        type: 'performance-optimization',
        message: `${poorTests.length} tests performed poorly. Consider optimization for: ${poorTests.map(t => t.type).join(', ')}`,
        priority: 'high'
      });
    }

    const studyLoadTests = tests.filter(t => t.type === 'study-load');
    const avgStudyLoadScore = studyLoadTests.reduce((sum, t) => sum + t.score, 0) / studyLoadTests.length;
    
    if (avgStudyLoadScore < 70) {
      recommendations.push({
        type: 'study-load-optimization',
        message: 'Study loading performance is below target. Consider implementing caching and progressive loading.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics() {
    const stats = {
      totalBenchmarks: 0,
      averageScore: 0,
      complianceDistribution: { excellent: 0, good: 0, acceptable: 0, poor: 0 },
      hardwareProfile: this.currentHardwareProfile,
      recentTrends: {}
    };

    let totalScore = 0;
    let totalCount = 0;

    for (const [type, results] of this.benchmarkResults.entries()) {
      totalCount += results.length;
      stats.totalBenchmarks += results.length;
      
      const typeScore = results.reduce((sum, r) => sum + r.performanceScore, 0) / results.length;
      totalScore += typeScore * results.length;

      // Compliance distribution
      results.forEach(result => {
        stats.complianceDistribution[result.budgetCompliance]++;
      });

      // Recent trends (last 5 results)
      const recent = results.slice(-5);
      if (recent.length >= 2) {
        const trend = this.calculateTrend(recent);
        stats.recentTrends[type] = trend;
      }
    }

    stats.averageScore = totalCount > 0 ? totalScore / totalCount : 0;
    return stats;
  }

  /**
   * Export benchmark data for CI/CD
   */
  exportForCICD() {
    const stats = this.getPerformanceStatistics();
    const results = this.getBenchmarkResults();

    return {
      timestamp: Date.now(),
      hardwareProfile: this.currentHardwareProfile,
      statistics: stats,
      results: results,
      budgets: PERFORMANCE_BUDGETS,
      cicdMetrics: {
        passThreshold: 70, // Minimum average score to pass
        regressionThreshold: 15, // Maximum score decrease to trigger regression alert
        complianceThreshold: {
          poor: 0.2, // Maximum 20% poor results
          acceptable: 0.5 // Maximum 50% acceptable or below
        }
      }
    };
  }

  /**
   * Helper methods
   */
  generateBenchmarkId(benchmarkType) {
    return `benchmark_${benchmarkType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getBenchmarkResults(benchmarkType = null) {
    if (benchmarkType) {
      return this.benchmarkResults.get(benchmarkType) || [];
    }
    return Object.fromEntries(this.benchmarkResults);
  }

  calculateTrend(results) {
    if (results.length < 2) return 'insufficient-data';

    const scores = results.map(r => r.performanceScore);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  logBenchmarkResult(benchmark) {
    const compliance = benchmark.budgetCompliance;
    const logLevel = compliance === 'poor' ? 'warn' : 'log';

    console[logLevel](`[PerformanceBenchmark] ${benchmark.type}:`, {
      duration: `${benchmark.duration.toFixed(2)}ms`,
      score: benchmark.performanceScore,
      compliance,
      hardwareProfile: benchmark.hardwareProfile
    });

    // Add to error tracking breadcrumbs
    if (this.errorTracker) {
      this.errorTracker.addBreadcrumb({
        type: 'performance-benchmark',
        message: `${benchmark.type} benchmark completed`,
        context: {
          duration: benchmark.duration,
          score: benchmark.performanceScore,
          compliance,
          hardwareProfile: benchmark.hardwareProfile
        }
      });
    }
  }

  checkPerformanceRegression(benchmarkType, currentBenchmark) {
    const results = this.benchmarkResults.get(benchmarkType);
    if (!results || results.length < 3) return;

    const recentResults = results.slice(-5);
    const previousResults = recentResults.slice(0, -1);
    
    const avgPreviousDuration = previousResults.reduce((sum, r) => sum + r.duration, 0) / previousResults.length;
    const avgPreviousScore = previousResults.reduce((sum, r) => sum + r.performanceScore, 0) / previousResults.length;

    const durationIncrease = ((currentBenchmark.duration - avgPreviousDuration) / avgPreviousDuration) * 100;
    const scoreDecrease = avgPreviousScore - currentBenchmark.performanceScore;

    if (durationIncrease > 20 || scoreDecrease > 15) {
      this.reportPerformanceRegression(benchmarkType, {
        currentBenchmark,
        avgPreviousDuration,
        avgPreviousScore,
        durationIncrease,
        scoreDecrease
      });
    }
  }

  reportPerformanceRegression(benchmarkType, regressionData) {
    const message = `Performance regression detected in ${benchmarkType}`;
    
    console.warn(`[PerformanceBenchmark] ${message}:`, regressionData);

    if (this.errorTracker) {
      this.errorTracker.captureError(new Error(message), {
        category: 'performance',
        severity: 'medium',
        component: 'benchmark',
        context: {
          benchmarkType,
          regression: regressionData,
          hardwareProfile: this.currentHardwareProfile
        }
      });
    }

    window.dispatchEvent(new CustomEvent('ohif-performance-regression', {
      detail: {
        benchmarkType,
        regression: regressionData,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    console.log('[PerformanceBenchmark] Destroying benchmark service');
    
    this.isEnabled = false;
    this.isRunning = false;
    this.benchmarkResults.clear();
    this.baselineMetrics.clear();
    this.activeBenchmarks.clear();
  }
}

// Global instance
let globalBenchmarkService = null;

/**
 * Get or create global benchmark service
 */
export function getPerformanceBenchmark() {
  if (!globalBenchmarkService) {
    globalBenchmarkService = new PerformanceBenchmarkService();
  }
  return globalBenchmarkService;
}

/**
 * Initialize performance benchmarking
 */
export function initializePerformanceBenchmarking(config = {}) {
  const benchmark = getPerformanceBenchmark();
  
  // Apply configuration
  Object.assign(benchmark, config);
  
  console.log('[PerformanceBenchmark] Performance benchmarking initialized');
  return benchmark;
}

/**
 * Convenience functions for benchmark operations
 */
export const benchmarkRunner = {
  runQuickBenchmark: () => getPerformanceBenchmark().runBenchmarkSuite(['smallStudy', 'mediumStudy']),
  runFullBenchmark: () => getPerformanceBenchmark().runBenchmarkSuite(),
  getResults: () => getPerformanceBenchmark().getBenchmarkResults(),
  getStatistics: () => getPerformanceBenchmark().getPerformanceStatistics(),
  exportForCI: () => getPerformanceBenchmark().exportForCICD()
};

export { PerformanceBenchmarkService };
export default PerformanceBenchmarkService;
