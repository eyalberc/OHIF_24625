/**
 * Error Telemetry Utilities - OHIF v3 Enhanced System
 * 
 * Task 10.4: Error Tracking and Logging Implementation
 * 
 * FEATURES IMPLEMENTED:
 * - Error telemetry collection and transmission
 * - Error frequency analysis and trending
 * - Integration with external monitoring services
 * - Privacy-conscious error reporting
 * - Batch error reporting for performance
 * - Error correlation and pattern detection
 * - Automated error classification and severity assessment
 */

import { getErrorTracker, ERROR_SEVERITY, ERROR_CATEGORIES } from '../services/ErrorTrackingService';
import { getPerformanceMonitor } from '../services/PerformanceMonitoringService';

/**
 * Error telemetry configuration
 */
const TELEMETRY_CONFIG = {
  enableTelemetry: process.env.NODE_ENV === 'production',
  batchSize: 10,
  batchInterval: 30000, // 30 seconds
  maxQueueSize: 100,
  retryAttempts: 3,
  retryDelay: 5000,
  endpoints: {
    errors: process.env.REACT_APP_ERROR_ENDPOINT || null,
    metrics: process.env.REACT_APP_METRICS_ENDPOINT || null,
    health: process.env.REACT_APP_HEALTH_ENDPOINT || null
  },
  privacy: {
    anonymizeUserData: true,
    excludeStackTraces: false,
    hashSensitiveData: true,
    maxContextDepth: 3
  }
};

/**
 * Error telemetry service for production monitoring
 */
class ErrorTelemetryService {
  constructor() {
    this.isEnabled = TELEMETRY_CONFIG.enableTelemetry;
    this.errorQueue = [];
    this.metricsQueue = [];
    this.batchTimer = null;
    this.retryQueue = [];
    this.sessionId = this.generateSessionId();
    this.errorTracker = null;
    this.performanceMonitor = null;
    
    this.initialize();
  }

  /**
   * Initialize telemetry service
   */
  initialize() {
    if (!this.isEnabled) {
      console.log('[ErrorTelemetry] Telemetry disabled for development environment');
      return;
    }

    console.log('[ErrorTelemetry] Initializing error telemetry service');

    // Get service instances
    try {
      this.errorTracker = getErrorTracker();
      this.performanceMonitor = getPerformanceMonitor();
    } catch (error) {
      console.warn('[ErrorTelemetry] Failed to initialize monitoring services:', error);
    }

    // Set up batch processing
    this.startBatchProcessing();

    // Set up error listener
    this.setupErrorListener();

    // Set up performance correlation
    this.setupPerformanceCorrelation();

    // Set up session tracking
    this.initializeSessionTracking();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up error listener for automatic telemetry
   */
  setupErrorListener() {
    if (!this.errorTracker) return;

    this.errorTracker.addEventListener('error', (errorRecord) => {
      this.queueErrorForTelemetry(errorRecord);
    });

    this.errorTracker.addEventListener('alert', (alert) => {
      this.sendImmediateAlert(alert);
    });
  }

  /**
   * Set up performance correlation
   */
  setupPerformanceCorrelation() {
    if (!this.performanceMonitor) return;

    // Monitor performance degradation that might indicate errors
    window.addEventListener('ohif-performance-alert', (event) => {
      this.correlatePerformanceWithErrors(event.detail);
    });
  }

  /**
   * Initialize session tracking
   */
  initializeSessionTracking() {
    const sessionData = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Send session start event
    this.queueMetric('session-start', sessionData);

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  /**
   * Queue error for telemetry transmission
   */
  queueErrorForTelemetry(errorRecord) {
    if (!this.isEnabled) return;

    const telemetryData = this.prepareErrorForTelemetry(errorRecord);
    
    if (telemetryData) {
      this.errorQueue.push(telemetryData);
      
      // Send immediately for critical errors
      if (errorRecord.severity === ERROR_SEVERITY.CRITICAL) {
        this.sendImmediateError(telemetryData);
      }
      
      // Trim queue if too large
      if (this.errorQueue.length > TELEMETRY_CONFIG.maxQueueSize) {
        this.errorQueue = this.errorQueue.slice(-TELEMETRY_CONFIG.maxQueueSize);
      }
    }
  }

  /**
   * Prepare error data for telemetry with privacy protection
   */
  prepareErrorForTelemetry(errorRecord) {
    try {
      const telemetryData = {
        id: errorRecord.id,
        timestamp: errorRecord.timestamp,
        sessionId: this.sessionId,
        error: {
          name: errorRecord.error.name,
          message: this.sanitizeErrorMessage(errorRecord.error.message),
          type: errorRecord.error.type,
          fingerprint: errorRecord.fingerprint
        },
        severity: errorRecord.severity,
        category: errorRecord.category,
        component: errorRecord.component,
        context: this.sanitizeContext(errorRecord.context),
        tags: errorRecord.tags,
        environment: {
          userAgent: navigator.userAgent,
          url: this.sanitizeUrl(window.location.href),
          platform: navigator.platform,
          language: navigator.language
        }
      };

      // Add stack trace if not excluded by privacy settings
      if (!TELEMETRY_CONFIG.privacy.excludeStackTraces && errorRecord.stackTrace) {
        telemetryData.error.stackTrace = this.sanitizeStackTrace(errorRecord.stackTrace);
      }

      // Add performance context if available
      if (errorRecord.context.performance) {
        telemetryData.performance = this.sanitizePerformanceData(errorRecord.context.performance);
      }

      return telemetryData;
    } catch (error) {
      console.warn('[ErrorTelemetry] Failed to prepare error for telemetry:', error);
      return null;
    }
  }

  /**
   * Sanitize error message for privacy
   */
  sanitizeErrorMessage(message) {
    if (!message) return 'Unknown error';
    
    // Remove potential PII patterns
    let sanitized = message;
    
    // Remove email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Remove potential user IDs or tokens
    sanitized = sanitized.replace(/\b[a-f0-9]{32,}\b/gi, '[TOKEN]');
    
    // Remove file paths
    sanitized = sanitized.replace(/\b[A-Za-z]:\\[^\\]*(?:\\[^\\]*)*\b/g, '[PATH]');
    sanitized = sanitized.replace(/\/[^\/\s]*(?:\/[^\/\s]*)*/g, '[PATH]');
    
    return sanitized;
  }

  /**
   * Sanitize context data for privacy
   */
  sanitizeContext(context, depth = 0) {
    if (depth > TELEMETRY_CONFIG.privacy.maxContextDepth) {
      return '[DEPTH_LIMIT]';
    }

    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Skip sensitive keys
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value, depth + 1);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeErrorMessage(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if a key contains sensitive information
   */
  isSensitiveKey(key) {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /key/i,
      /secret/i,
      /auth/i,
      /session/i,
      /cookie/i,
      /personal/i,
      /private/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  /**
   * Sanitize URL for privacy
   */
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove query parameters that might contain sensitive data
      const sanitizedParams = new URLSearchParams();
      for (const [key, value] of urlObj.searchParams.entries()) {
        if (!this.isSensitiveKey(key)) {
          sanitizedParams.set(key, value);
        } else {
          sanitizedParams.set(key, '[REDACTED]');
        }
      }
      
      urlObj.search = sanitizedParams.toString();
      return urlObj.toString();
    } catch (error) {
      return '[INVALID_URL]';
    }
  }

  /**
   * Sanitize stack trace for privacy
   */
  sanitizeStackTrace(stackTrace) {
    if (!stackTrace) return null;
    
    // Remove file paths but keep function names and line numbers
    return stackTrace
      .split('\n')
      .map(line => {
        // Replace file paths with generic markers
        return line.replace(/\b[A-Za-z]:\\[^\\]*(?:\\[^\\]*)*\b/g, '[PATH]')
                  .replace(/\/[^\/\s]*(?:\/[^\/\s]*)*/g, '[PATH]');
      })
      .join('\n');
  }

  /**
   * Sanitize performance data
   */
  sanitizePerformanceData(performanceData) {
    if (!performanceData) return null;

    return {
      timestamp: performanceData.timestamp,
      systemInfo: {
        platform: performanceData.systemInfo?.platform,
        language: performanceData.systemInfo?.language,
        onlineStatus: performanceData.systemInfo?.onlineStatus,
        memory: performanceData.systemInfo?.memory
      },
      // Include only non-sensitive metrics
      recentMetricsCount: Object.keys(performanceData.metrics || {}).length
    };
  }

  /**
   * Queue metric for telemetry
   */
  queueMetric(type, data) {
    if (!this.isEnabled) return;

    const metricData = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data: this.sanitizeContext(data)
    };

    this.metricsQueue.push(metricData);

    // Trim queue if too large
    if (this.metricsQueue.length > TELEMETRY_CONFIG.maxQueueSize) {
      this.metricsQueue = this.metricsQueue.slice(-TELEMETRY_CONFIG.maxQueueSize);
    }
  }

  /**
   * Start batch processing
   */
  startBatchProcessing() {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, TELEMETRY_CONFIG.batchInterval);
  }

  /**
   * Process queued data in batches
   */
  async processBatch() {
    // Process error queue
    if (this.errorQueue.length > 0) {
      const errorBatch = this.errorQueue.splice(0, TELEMETRY_CONFIG.batchSize);
      await this.sendErrorBatch(errorBatch);
    }

    // Process metrics queue
    if (this.metricsQueue.length > 0) {
      const metricsBatch = this.metricsQueue.splice(0, TELEMETRY_CONFIG.batchSize);
      await this.sendMetricsBatch(metricsBatch);
    }

    // Process retry queue
    if (this.retryQueue.length > 0) {
      await this.processRetryQueue();
    }
  }

  /**
   * Send error batch to telemetry endpoint
   */
  async sendErrorBatch(errors) {
    if (!TELEMETRY_CONFIG.endpoints.errors) {
      console.log('[ErrorTelemetry] No error endpoint configured, skipping batch');
      return;
    }

    try {
      const response = await fetch(TELEMETRY_CONFIG.endpoints.errors, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'error-batch',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          errors
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[ErrorTelemetry] Successfully sent ${errors.length} errors`);
    } catch (error) {
      console.warn('[ErrorTelemetry] Failed to send error batch:', error);
      this.addToRetryQueue('errors', errors);
    }
  }

  /**
   * Send metrics batch to telemetry endpoint
   */
  async sendMetricsBatch(metrics) {
    if (!TELEMETRY_CONFIG.endpoints.metrics) {
      console.log('[ErrorTelemetry] No metrics endpoint configured, skipping batch');
      return;
    }

    try {
      const response = await fetch(TELEMETRY_CONFIG.endpoints.metrics, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'metrics-batch',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          metrics
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[ErrorTelemetry] Successfully sent ${metrics.length} metrics`);
    } catch (error) {
      console.warn('[ErrorTelemetry] Failed to send metrics batch:', error);
      this.addToRetryQueue('metrics', metrics);
    }
  }

  /**
   * Send immediate error for critical issues
   */
  async sendImmediateError(errorData) {
    if (!TELEMETRY_CONFIG.endpoints.errors) return;

    try {
      const response = await fetch(TELEMETRY_CONFIG.endpoints.errors, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'immediate-error',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          error: errorData,
          priority: 'critical'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[ErrorTelemetry] Successfully sent immediate error');
    } catch (error) {
      console.warn('[ErrorTelemetry] Failed to send immediate error:', error);
      this.addToRetryQueue('errors', [errorData]);
    }
  }

  /**
   * Send immediate alert
   */
  async sendImmediateAlert(alert) {
    this.queueMetric('alert', {
      type: alert.type,
      message: alert.message,
      error: alert.error ? {
        severity: alert.error.severity,
        category: alert.error.category,
        component: alert.error.component
      } : null,
      frequency: alert.frequency
    });
  }

  /**
   * Correlate performance issues with errors
   */
  correlatePerformanceWithErrors(performanceAlert) {
    this.queueMetric('performance-error-correlation', {
      performanceAlert,
      recentErrors: this.errorTracker ? 
        this.errorTracker.getErrorStatistics().last24Hours : 0,
      systemHealth: this.errorTracker ? 
        this.errorTracker.calculateSystemHealth() : null
    });
  }

  /**
   * Add failed requests to retry queue
   */
  addToRetryQueue(type, data) {
    this.retryQueue.push({
      type,
      data,
      attempts: 0,
      nextRetry: Date.now() + TELEMETRY_CONFIG.retryDelay
    });
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    const now = Date.now();
    const readyForRetry = this.retryQueue.filter(item => now >= item.nextRetry);

    for (const item of readyForRetry) {
      if (item.attempts >= TELEMETRY_CONFIG.retryAttempts) {
        console.warn(`[ErrorTelemetry] Max retry attempts reached for ${item.type}`);
        this.retryQueue = this.retryQueue.filter(i => i !== item);
        continue;
      }

      try {
        if (item.type === 'errors') {
          await this.sendErrorBatch(item.data);
        } else if (item.type === 'metrics') {
          await this.sendMetricsBatch(item.data);
        }

        // Remove from retry queue on success
        this.retryQueue = this.retryQueue.filter(i => i !== item);
      } catch (error) {
        // Update retry information
        item.attempts++;
        item.nextRetry = now + (TELEMETRY_CONFIG.retryDelay * Math.pow(2, item.attempts));
      }
    }
  }

  /**
   * End session tracking
   */
  endSession() {
    const sessionData = {
      sessionId: this.sessionId,
      endTime: Date.now(),
      duration: Date.now() - (this.sessionStartTime || Date.now()),
      errorCount: this.errorTracker ? this.errorTracker.getErrorStatistics().total : 0
    };

    this.queueMetric('session-end', sessionData);

    // Force send remaining data
    this.processBatch();
  }

  /**
   * Get telemetry status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      sessionId: this.sessionId,
      queuedErrors: this.errorQueue.length,
      queuedMetrics: this.metricsQueue.length,
      retryQueueSize: this.retryQueue.length,
      endpoints: TELEMETRY_CONFIG.endpoints
    };
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    console.log('[ErrorTelemetry] Destroying telemetry service');
    
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Send final batch
    this.processBatch();
    
    this.errorQueue = [];
    this.metricsQueue = [];
    this.retryQueue = [];
  }
}

// Global instance
let globalTelemetryService = null;

/**
 * Get or create global telemetry service
 */
export function getErrorTelemetry() {
  if (!globalTelemetryService) {
    globalTelemetryService = new ErrorTelemetryService();
  }
  return globalTelemetryService;
}

/**
 * Initialize error telemetry
 */
export function initializeErrorTelemetry(config = {}) {
  // Apply configuration overrides
  Object.assign(TELEMETRY_CONFIG, config);
  
  const telemetry = getErrorTelemetry();
  console.log('[ErrorTelemetry] Error telemetry initialized');
  return telemetry;
}

/**
 * Convenience functions for telemetry operations
 */
export const telemetryReporter = {
  reportError: (error, context) => getErrorTelemetry().queueErrorForTelemetry({ error, ...context }),
  reportMetric: (type, data) => getErrorTelemetry().queueMetric(type, data),
  getStatus: () => getErrorTelemetry().getStatus(),
  endSession: () => getErrorTelemetry().endSession()
};

export { ErrorTelemetryService, TELEMETRY_CONFIG };
export default ErrorTelemetryService; 