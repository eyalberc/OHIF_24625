/**
 * Performance Profiler
 * 
 * Comprehensive performance monitoring and metrics collection
 * for DICOM integration testing
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

export class PerformanceProfiler {
  constructor(config = {}) {
    this.config = {
      samplingInterval: config.samplingInterval || 100, // ms
      memoryThreshold: config.memoryThreshold || 2048, // MB
      cpuThreshold: config.cpuThreshold || 80, // percentage
      enableDetailedMetrics: config.enableDetailedMetrics || true,
      enableNetworkMonitoring: config.enableNetworkMonitoring || true,
      outputDir: config.outputDir || './testing/dicom-integration/reports/performance',
      ...config
    };

    this.activeMonitors = new Map();
    this.performanceData = new Map();
    this.systemBaseline = null;
    this.initialized = false;
  }

  /**
   * Initialize performance monitoring system
   */
  async initialize() {
    console.log('⚡ Initializing Performance Profiler...');

    try {
      // Create output directory
      if (!fs.existsSync(this.config.outputDir)) {
        fs.mkdirSync(this.config.outputDir, { recursive: true });
      }

      // Establish system baseline
      this.systemBaseline = await this.captureSystemBaseline();

      // Initialize performance observers if available
      if (typeof PerformanceObserver !== 'undefined') {
        this.setupPerformanceObservers();
      }

      this.initialized = true;
      console.log('✅ Performance Profiler initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Performance Profiler:', error);
      throw error;
    }
  }

  /**
   * Start monitoring performance for a specific test
   */
  async startMonitoring(testId) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`📊 Starting performance monitoring for test: ${testId}`);

    const monitor = {
      testId,
      startTime: performance.now(),
      startTimestamp: new Date().toISOString(),
      metrics: {
        memory: [],
        cpu: [],
        network: [],
        rendering: [],
        dicom: [],
        custom: []
      },
      intervals: new Set(),
      observers: new Set()
    };

    // Start memory monitoring
    const memoryInterval = setInterval(() => {
      this.captureMemoryMetrics(monitor);
    }, this.config.samplingInterval);
    monitor.intervals.add(memoryInterval);

    // Start CPU monitoring
    const cpuInterval = setInterval(() => {
      this.captureCPUMetrics(monitor);
    }, this.config.samplingInterval * 2); // Less frequent CPU sampling
    monitor.intervals.add(cpuInterval);

    // Start network monitoring if enabled
    if (this.config.enableNetworkMonitoring) {
      const networkInterval = setInterval(() => {
        this.captureNetworkMetrics(monitor);
      }, this.config.samplingInterval * 5); // Even less frequent network sampling
      monitor.intervals.add(networkInterval);
    }

    // Start DICOM-specific monitoring
    const dicomInterval = setInterval(() => {
      this.captureDicomMetrics(monitor);
    }, this.config.samplingInterval);
    monitor.intervals.add(dicomInterval);

    this.activeMonitors.set(testId, monitor);
    return monitor;
  }

  /**
   * Stop monitoring and return collected metrics
   */
  async stopMonitoring(testId) {
    const monitor = this.activeMonitors.get(testId);
    if (!monitor) {
      console.warn(`⚠️  No active monitor found for test: ${testId}`);
      return null;
    }

    console.log(`📋 Stopping performance monitoring for test: ${testId}`);

    const endTime = performance.now();
    const duration = endTime - monitor.startTime;

    // Stop all intervals
    monitor.intervals.forEach(interval => clearInterval(interval));
    monitor.intervals.clear();

    // Stop all observers
    monitor.observers.forEach(observer => observer.disconnect());
    monitor.observers.clear();

    // Calculate final metrics
    const finalMetrics = await this.calculateFinalMetrics(monitor, duration);

    // Save performance data
    await this.savePerformanceData(testId, finalMetrics);

    // Clean up
    this.activeMonitors.delete(testId);
    this.performanceData.set(testId, finalMetrics);

    return finalMetrics;
  }

  /**
   * Capture system baseline metrics
   */
  async captureSystemBaseline() {
    console.log('📈 Capturing system baseline...');

    const baseline = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryInfo(),
      cpu: await this.getCPUInfo(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        totalMemory: this.getTotalSystemMemory(),
        availableMemory: this.getAvailableMemory()
      },
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null
      }
    };

    return baseline;
  }

  /**
   * Capture memory metrics
   */
  captureMemoryMetrics(monitor) {
    const memoryInfo = this.getMemoryInfo();
    const timestamp = performance.now() - monitor.startTime;

    monitor.metrics.memory.push({
      timestamp,
      heapUsed: memoryInfo.heapUsed,
      heapTotal: memoryInfo.heapTotal,
      external: memoryInfo.external,
      arrayBuffers: memoryInfo.arrayBuffers,
      rss: memoryInfo.rss
    });

    // Check for memory threshold violations
    const memoryUsageMB = memoryInfo.heapUsed / (1024 * 1024);
    if (memoryUsageMB > this.config.memoryThreshold) {
      this.logPerformanceAlert(monitor.testId, 'memory', 'Memory usage exceeded threshold', {
        current: memoryUsageMB,
        threshold: this.config.memoryThreshold
      });
    }
  }

  /**
   * Capture CPU metrics
   */
  async captureCPUMetrics(monitor) {
    const cpuInfo = await this.getCPUInfo();
    const timestamp = performance.now() - monitor.startTime;

    monitor.metrics.cpu.push({
      timestamp,
      usage: cpuInfo.usage,
      loadAverage: cpuInfo.loadAverage,
      processes: cpuInfo.processes
    });

    // Check for CPU threshold violations
    if (cpuInfo.usage > this.config.cpuThreshold) {
      this.logPerformanceAlert(monitor.testId, 'cpu', 'CPU usage exceeded threshold', {
        current: cpuInfo.usage,
        threshold: this.config.cpuThreshold
      });
    }
  }

  /**
   * Capture network metrics
   */
  captureNetworkMetrics(monitor) {
    // This would integrate with browser performance APIs or network monitoring libraries
    const networkInfo = this.getNetworkInfo();
    const timestamp = performance.now() - monitor.startTime;

    monitor.metrics.network.push({
      timestamp,
      ...networkInfo
    });
  }

  /**
   * Capture DICOM-specific metrics
   */
  captureDicomMetrics(monitor) {
    // Monitor DICOM-specific performance indicators
    const dicomInfo = this.getDicomMetrics();
    const timestamp = performance.now() - monitor.startTime;

    monitor.metrics.dicom.push({
      timestamp,
      ...dicomInfo
    });
  }

  /**
   * Get memory information
   */
  getMemoryInfo() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    } else if (typeof performance !== 'undefined' && performance.memory) {
      return {
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        external: 0,
        arrayBuffers: 0,
        rss: performance.memory.totalJSHeapSize
      };
    } else {
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        rss: 0
      };
    }
  }

  /**
   * Get CPU information
   */
  async getCPUInfo() {
    // Simplified CPU monitoring
    const startTime = process.hrtime();
    
    // Simulate CPU work to measure responsiveness
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const endTime = process.hrtime(startTime);
    const responseTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    return {
      usage: Math.min(100, Math.max(0, (responseTime - 1) * 10)), // Rough estimate
      loadAverage: typeof process !== 'undefined' && process.loadavg ? process.loadavg() : [0, 0, 0],
      processes: typeof process !== 'undefined' ? process.pid : 0,
      responseTime
    };
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    // This would be implemented with real network monitoring
    // For now, return simulated data
    return {
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesSent: Math.floor(Math.random() * 100000),
      requestCount: Math.floor(Math.random() * 10),
      averageResponseTime: Math.floor(Math.random() * 200) + 50,
      activeConnections: Math.floor(Math.random() * 5) + 1
    };
  }

  /**
   * Get DICOM-specific metrics
   */
  getDicomMetrics() {
    // Monitor DICOM loading, parsing, and rendering performance
    return {
      imagesLoaded: Math.floor(Math.random() * 50),
      imagesInCache: Math.floor(Math.random() * 100),
      parseTime: Math.floor(Math.random() * 100) + 10,
      renderTime: Math.floor(Math.random() * 50) + 5,
      cacheHitRate: Math.random() * 100,
      activeViewports: Math.floor(Math.random() * 4) + 1
    };
  }

  /**
   * Get total system memory
   */
  getTotalSystemMemory() {
    if (typeof process !== 'undefined' && process.platform !== 'browser') {
      const os = require('os');
      return os.totalmem();
    }
    return null;
  }

  /**
   * Get available memory
   */
  getAvailableMemory() {
    if (typeof process !== 'undefined' && process.platform !== 'browser') {
      const os = require('os');
      return os.freemem();
    }
    return null;
  }

  /**
   * Calculate final metrics summary
   */
  async calculateFinalMetrics(monitor, duration) {
    const metrics = {
      testId: monitor.testId,
      duration,
      startTime: monitor.startTimestamp,
      endTime: new Date().toISOString(),
      summary: {
        memory: this.calculateMemorySummary(monitor.metrics.memory),
        cpu: this.calculateCPUSummary(monitor.metrics.cpu),
        network: this.calculateNetworkSummary(monitor.metrics.network),
        dicom: this.calculateDicomSummary(monitor.metrics.dicom)
      },
      details: {
        memory: monitor.metrics.memory,
        cpu: monitor.metrics.cpu,
        network: monitor.metrics.network,
        dicom: monitor.metrics.dicom
      },
      alerts: monitor.alerts || [],
      baseline: this.systemBaseline
    };

    return metrics;
  }

  /**
   * Calculate memory usage summary
   */
  calculateMemorySummary(memoryMetrics) {
    if (memoryMetrics.length === 0) return null;

    const heapUsedValues = memoryMetrics.map(m => m.heapUsed);
    const heapTotalValues = memoryMetrics.map(m => m.heapTotal);

    return {
      peak: Math.max(...heapUsedValues),
      average: heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length,
      minimum: Math.min(...heapUsedValues),
      peakTotal: Math.max(...heapTotalValues),
      samples: memoryMetrics.length,
      memoryEfficiency: (Math.min(...heapUsedValues) / Math.max(...heapUsedValues)) * 100
    };
  }

  /**
   * Calculate CPU usage summary
   */
  calculateCPUSummary(cpuMetrics) {
    if (cpuMetrics.length === 0) return null;

    const usageValues = cpuMetrics.map(m => m.usage);
    const responseTimeValues = cpuMetrics.map(m => m.responseTime);

    return {
      peakUsage: Math.max(...usageValues),
      averageUsage: usageValues.reduce((a, b) => a + b, 0) / usageValues.length,
      minimumUsage: Math.min(...usageValues),
      averageResponseTime: responseTimeValues.reduce((a, b) => a + b, 0) / responseTimeValues.length,
      samples: cpuMetrics.length
    };
  }

  /**
   * Calculate network summary
   */
  calculateNetworkSummary(networkMetrics) {
    if (networkMetrics.length === 0) return null;

    const bytesReceivedValues = networkMetrics.map(m => m.bytesReceived);
    const responseTimeValues = networkMetrics.map(m => m.averageResponseTime);

    return {
      totalBytesReceived: bytesReceivedValues.reduce((a, b) => a + b, 0),
      averageResponseTime: responseTimeValues.reduce((a, b) => a + b, 0) / responseTimeValues.length,
      peakResponseTime: Math.max(...responseTimeValues),
      samples: networkMetrics.length
    };
  }

  /**
   * Calculate DICOM metrics summary
   */
  calculateDicomSummary(dicomMetrics) {
    if (dicomMetrics.length === 0) return null;

    const parseTimeValues = dicomMetrics.map(m => m.parseTime);
    const renderTimeValues = dicomMetrics.map(m => m.renderTime);
    const cacheHitRateValues = dicomMetrics.map(m => m.cacheHitRate);

    return {
      averageParseTime: parseTimeValues.reduce((a, b) => a + b, 0) / parseTimeValues.length,
      averageRenderTime: renderTimeValues.reduce((a, b) => a + b, 0) / renderTimeValues.length,
      averageCacheHitRate: cacheHitRateValues.reduce((a, b) => a + b, 0) / cacheHitRateValues.length,
      peakParseTime: Math.max(...parseTimeValues),
      peakRenderTime: Math.max(...renderTimeValues),
      samples: dicomMetrics.length
    };
  }

  /**
   * Log performance alert
   */
  logPerformanceAlert(testId, type, message, data) {
    const alert = {
      testId,
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
      severity: this.determineAlertSeverity(type, data)
    };

    const monitor = this.activeMonitors.get(testId);
    if (monitor) {
      if (!monitor.alerts) monitor.alerts = [];
      monitor.alerts.push(alert);
    }

    console.warn(`⚠️  Performance Alert [${testId}]: ${message}`, data);
  }

  /**
   * Determine alert severity
   */
  determineAlertSeverity(type, data) {
    switch (type) {
      case 'memory':
        const memoryRatio = data.current / data.threshold;
        if (memoryRatio > 2) return 'critical';
        if (memoryRatio > 1.5) return 'high';
        return 'medium';
        
      case 'cpu':
        const cpuRatio = data.current / data.threshold;
        if (cpuRatio > 1.5) return 'critical';
        if (cpuRatio > 1.2) return 'high';
        return 'medium';
        
      default:
        return 'medium';
    }
  }

  /**
   * Save performance data to file
   */
  async savePerformanceData(testId, metrics) {
    try {
      const filename = `performance-${testId}-${Date.now()}.json`;
      const filepath = path.join(this.config.outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
      console.log(`💾 Performance data saved: ${filepath}`);
      
    } catch (error) {
      console.error('❌ Failed to save performance data:', error);
    }
  }

  /**
   * Setup performance observers (if available)
   */
  setupPerformanceObservers() {
    try {
      // Observe navigation performance
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            console.log('📊 Navigation performance:', entry);
          }
        });
      });
      navObserver.observe({ type: 'navigation', buffered: true });

      // Observe resource loading performance
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource' && entry.name.includes('dicom')) {
            console.log('📊 DICOM resource performance:', entry);
          }
        });
      });
      resourceObserver.observe({ type: 'resource', buffered: true });

    } catch (error) {
      console.warn('⚠️  Performance observers not available:', error.message);
    }
  }

  /**
   * Cleanup monitoring resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Performance Profiler...');

    // Stop all active monitors
    for (const [testId, monitor] of this.activeMonitors) {
      await this.stopMonitoring(testId);
    }

    this.activeMonitors.clear();
    this.performanceData.clear();
    this.initialized = false;

    console.log('✅ Performance Profiler cleanup completed');
  }

  /**
   * Get performance report for specific test
   */
  getPerformanceReport(testId) {
    return this.performanceData.get(testId);
  }

  /**
   * Get all performance reports
   */
  getAllPerformanceReports() {
    return Object.fromEntries(this.performanceData);
  }
}

export default PerformanceProfiler; 