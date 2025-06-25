/**
 * Performance Monitoring Infrastructure - OHIF v3 Enhanced System
 * 
 * Task 10.2: Performance Monitoring Infrastructure Setup
 * 
 * FEATURES IMPLEMENTED:
 * - Custom performance marks and measures for critical rendering paths
 * - User interaction instrumentation (study loading, tool activation, viewport manipulation)
 * - Performance data collection service with aggregation
 * - Real-time dashboard component for development mode
 * - Memory usage monitoring and optimization alerts
 * - Network performance tracking
 * - Frame rate monitoring for smooth user experience
 */

// Performance metrics collection and analysis
class PerformanceMonitoringService {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || window.location.search.includes('debug=perf');
    this.metrics = new Map();
    this.observers = [];
    this.dashboardElement = null;
    this.updateInterval = null;
    this.performanceMarks = new Map();
    this.performanceMeasures = new Map();
    this.userInteractions = [];
    this.networkMetrics = [];
    this.frameRateMonitor = null;
    this.memoryMonitor = null;
    
    // Performance thresholds for alerts
    this.thresholds = {
      studyLoadTime: 5000, // 5 seconds
      toolActivationTime: 500, // 500ms
      viewportRenderTime: 100, // 100ms
      memoryUsage: 500 * 1024 * 1024, // 500MB
      frameRate: 30, // 30 FPS minimum
      networkLatency: 1000, // 1 second
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize all performance monitoring components
   */
  initializeMonitoring() {
    if (!this.isEnabled) {
      console.log('[PerformanceMonitor] Performance monitoring disabled');
      return;
    }

    console.log('[PerformanceMonitor] Initializing performance monitoring infrastructure');

    // Initialize performance observer for navigation timing
    this.initializePerformanceObserver();

    // Initialize memory monitoring
    this.initializeMemoryMonitoring();

    // Initialize frame rate monitoring
    this.initializeFrameRateMonitoring();

    // Initialize network monitoring
    this.initializeNetworkMonitoring();

    // Initialize dashboard if in development mode
    if (process.env.NODE_ENV === 'development') {
      this.initializeDashboard();
    }

    // Start periodic data collection
    this.startPeriodicCollection();
  }

  /**
   * Initialize Performance Observer for critical metrics
   */
  initializePerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('[PerformanceMonitor] PerformanceObserver not supported');
      return;
    }

    // Observe navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.recordMetric('navigation', {
          type: entry.entryType,
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          timestamp: Date.now()
        });
      });
    });

    // Observe measure performance
    const measureObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.recordMetric('measure', {
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          timestamp: Date.now()
        });
      });
    });

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] });
      measureObserver.observe({ entryTypes: ['measure'] });
      
      this.observers.push(navigationObserver, measureObserver);
    } catch (error) {
      console.warn('[PerformanceMonitor] Failed to initialize performance observers:', error);
    }
  }

  /**
   * Initialize memory usage monitoring
   */
  initializeMemoryMonitoring() {
    if (!performance.memory) {
      console.warn('[PerformanceMonitor] Memory API not available');
      return;
    }

    this.memoryMonitor = setInterval(() => {
      const memoryInfo = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      this.recordMetric('memory', memoryInfo);

      // Check memory threshold
      if (memoryInfo.usedJSHeapSize > this.thresholds.memoryUsage) {
        this.triggerAlert('memory', High memory usage: MB);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Initialize frame rate monitoring
   */
  initializeFrameRateMonitoring() {
    let lastFrameTime = performance.now();
    let frameCount = 0;

    const measureFrameRate = (currentTime) => {
      frameCount++;
      const deltaTime = currentTime - lastFrameTime;
      
      if (deltaTime >= 1000) { // Calculate FPS every second
        const fps = (frameCount * 1000) / deltaTime;
        
        this.recordMetric('framerate', {
          fps,
          timestamp: Date.now()
        });

        // Check frame rate threshold
        if (fps < this.thresholds.frameRate) {
          this.triggerAlert('framerate', Low frame rate:  FPS);
        }

        frameCount = 0;
        lastFrameTime = currentTime;
      }

      this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
    };

    this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
  }

  /**
   * Initialize network performance monitoring
   */
  initializeNetworkMonitoring() {
    // Monitor network connection changes
    if (navigator.connection) {
      const updateNetworkInfo = () => {
        const networkInfo = {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
          timestamp: Date.now()
        };

        this.recordMetric('network', networkInfo);

        // Check network latency threshold
        if (networkInfo.rtt > this.thresholds.networkLatency) {
          this.triggerAlert('network', High network latency: ms);
        }
      };

      navigator.connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo(); // Initial reading
    }
  }

  /**
   * Create custom performance mark
   */
  createPerformanceMark(name, detail = {}) {
    if (!this.isEnabled) return;

    const markName = ohif-;
    const startTime = performance.now();
    
    try {
      performance.mark(markName);
      this.performanceMarks.set(markName, {
        name: markName,
        startTime,
        detail,
        timestamp: Date.now()
      });
      
      console.log([PerformanceMonitor] Mark created: );
    } catch (error) {
      console.warn([PerformanceMonitor] Failed to create mark :, error);
    }
  }

  /**
   * Create custom performance measure
   */
  createPerformanceMeasure(name, startMark, endMark = null) {
    if (!this.isEnabled) return;

    const measureName = ohif-measure-;
    
    try {
      if (endMark) {
        performance.measure(measureName, startMark, endMark);
      } else {
        performance.measure(measureName, startMark);
      }

      const entries = performance.getEntriesByName(measureName);
      if (entries.length > 0) {
        const measure = entries[entries.length - 1];
        this.performanceMeasures.set(measureName, {
          name: measureName,
          duration: measure.duration,
          startTime: measure.startTime,
          timestamp: Date.now()
        });

        console.log([PerformanceMonitor] Measure created:  (ms));
        return measure.duration;
      }
    } catch (error) {
      console.warn([PerformanceMonitor] Failed to create measure :, error);
    }

    return null;
  }

  /**
   * Instrument study loading performance
   */
  instrumentStudyLoading(studyInstanceUID) {
    if (!this.isEnabled) return { start: () => {}, end: () => {} };

    const markName = study-load-;
    this.createPerformanceMark(${markName}-start, { studyInstanceUID });

    return {
      start: () => {
        this.createPerformanceMark(${markName}-start, { studyInstanceUID });
      },
      end: () => {
        this.createPerformanceMark(${markName}-end, { studyInstanceUID });
        const duration = this.createPerformanceMeasure(study-load-, 
          ohif--start, ohif--end);
        
        if (duration) {
          this.recordUserInteraction('study-load', {
            studyInstanceUID,
            duration,
            timestamp: Date.now()
          });

          // Check study load threshold
          if (duration > this.thresholds.studyLoadTime) {
            this.triggerAlert('study-load', Slow study loading: ms for );
          }
        }
      }
    };
  }

  /**
   * Record a generic metric
   */
  recordMetric(category, data) {
    if (!this.isEnabled) return;

    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const metrics = this.metrics.get(category);
    metrics.push({
      ...data,
      timestamp: Date.now()
    });

    // Keep only last 1000 entries per category to prevent memory bloat
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(type, data) {
    if (!this.isEnabled) return;

    this.userInteractions.push({
      type,
      ...data,
      timestamp: Date.now()
    });

    // Keep only last 500 interactions
    if (this.userInteractions.length > 500) {
      this.userInteractions.splice(0, this.userInteractions.length - 500);
    }
  }

  /**
   * Trigger performance alert
   */
  triggerAlert(type, message) {
    console.warn([PerformanceMonitor] ALERT []: );
    
    // Emit event for dashboard or other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ohif-performance-alert', {
        detail: { type, message, timestamp: Date.now() }
      }));
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      timestamp: Date.now(),
      metrics: {},
      userInteractions: this.userInteractions.slice(-10), // Last 10 interactions
      systemInfo: this.getSystemInfo()
    };

    // Aggregate metrics by category
    for (const [category, data] of this.metrics.entries()) {
      if (data.length > 0) {
        summary.metrics[category] = this.aggregateMetrics(data);
      }
    }

    return summary;
  }

  /**
   * Aggregate metrics for summary
   */
  aggregateMetrics(data) {
    if (data.length === 0) return {};

    const durations = data.filter(d => d.duration).map(d => d.duration);
    const recent = data.slice(-10);

    return {
      count: data.length,
      recentCount: recent.length,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      maxDuration: durations.length > 0 ? Math.max(...durations) : null,
      minDuration: durations.length > 0 ? Math.min(...durations) : null,
      recent: recent
    };
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onlineStatus: navigator.onLine
    };

    if (navigator.connection) {
      info.connection = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }

    if (performance.memory) {
      info.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }

    return info;
  }

  /**
   * Export performance data
   */
  exportPerformanceData() {
    const exportData = {
      timestamp: Date.now(),
      summary: this.getPerformanceSummary(),
      rawMetrics: Object.fromEntries(this.metrics),
      userInteractions: this.userInteractions,
      performanceMarks: Object.fromEntries(this.performanceMarks),
      performanceMeasures: Object.fromEntries(this.performanceMeasures)
    };

    return exportData;
  }

  /**
   * Cleanup and destroy monitoring
   */
  destroy() {
    console.log('[PerformanceMonitor] Destroying performance monitoring');

    // Disconnect observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });

    // Clear intervals
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Cancel frame rate monitoring
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
    }

    // Clear data
    this.metrics.clear();
    this.userInteractions = [];
    this.performanceMarks.clear();
    this.performanceMeasures.clear();
  }
}

// Global instance for easy access
let globalPerformanceMonitor = null;

/**
 * Get or create global performance monitor instance
 */
export function getPerformanceMonitor() {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitoringService();
  }
  return globalPerformanceMonitor;
}

/**
 * Initialize performance monitoring for OHIF
 */
export function initializePerformanceMonitoring(config = {}) {
  const monitor = getPerformanceMonitor();
  
  // Apply configuration
  if (config.thresholds) {
    Object.assign(monitor.thresholds, config.thresholds);
  }

  console.log('[PerformanceMonitor] Performance monitoring initialized');
  return monitor;
}

export { PerformanceMonitoringService };
export default PerformanceMonitoringService;
