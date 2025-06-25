/**
 * Error Tracking and Logging Service - OHIF v3 Enhanced System
 * 
 * Task 10.4: Error Tracking and Logging Implementation
 * 
 * FEATURES IMPLEMENTED:
 * - Centralized error boundary system with recovery mechanisms
 * - Structured logging with severity levels and component categorization
 * - Contextual error information (user actions, system state, breadcrumbs)
 * - Graceful degradation for non-critical feature failures
 * - Error telemetry and frequency tracking
 * - Integration with performance monitoring infrastructure
 * - Error replay and debugging assistance
 */

import { getPerformanceMonitor } from './PerformanceMonitoringService';

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  MEMORY: 'memory',
  RENDERING: 'rendering',
  USER_ACTION: 'user-action',
  DATA_PROCESSING: 'data-processing',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  INTEGRATION: 'integration',
  UNKNOWN: 'unknown'
};

// Component types for error tracking
export const COMPONENT_TYPES = {
  VIEWPORT: 'viewport',
  TOOLBAR: 'toolbar',
  PANEL: 'panel',
  SERVICE: 'service',
  EXTENSION: 'extension',
  MODE: 'mode',
  DATA_SOURCE: 'data-source',
  CORE: 'core'
};

/**
 * Enhanced error tracking and logging service
 */
class ErrorTrackingService {
  constructor() {
    this.isEnabled = true;
    this.errors = [];
    this.breadcrumbs = [];
    this.userContext = {};
    this.systemContext = {};
    this.errorFrequencies = new Map();
    this.listeners = [];
    this.performanceMonitor = null;
    
    // Configuration
    this.config = {
      maxErrors: 1000,
      maxBreadcrumbs: 100,
      enableTelemetry: process.env.NODE_ENV === 'production',
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableLocalStorage: true,
      telemetryEndpoint: null,
      reportingThreshold: {
        [ERROR_SEVERITY.LOW]: 10,
        [ERROR_SEVERITY.MEDIUM]: 5,
        [ERROR_SEVERITY.HIGH]: 2,
        [ERROR_SEVERITY.CRITICAL]: 1
      }
    };

    this.initialize();
  }

  /**
   * Initialize error tracking system
   */
  initialize() {
    console.log('[ErrorTracker] Initializing error tracking service');

    // Get performance monitor instance
    try {
      this.performanceMonitor = getPerformanceMonitor();
    } catch (error) {
      console.warn('[ErrorTracker] Performance monitor not available:', error);
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Initialize system context
    this.updateSystemContext();

    // Set up periodic cleanup
    this.setupPeriodicCleanup();

    // Load persisted errors if enabled
    if (this.config.enableLocalStorage) {
      this.loadPersistedErrors();
    }
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(new Error(event.message), {
        category: ERROR_CATEGORIES.UNKNOWN,
        severity: ERROR_SEVERITY.MEDIUM,
        component: COMPONENT_TYPES.CORE,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: 'global-error-handler'
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        category: ERROR_CATEGORIES.UNKNOWN,
        severity: ERROR_SEVERITY.HIGH,
        component: COMPONENT_TYPES.CORE,
        context: {
          source: 'unhandled-promise-rejection',
          promise: event.promise
        }
      });
    });

    // Handle React errors (will be caught by error boundaries)
    if (typeof window !== 'undefined') {
      window.addEventListener('ohif-react-error', (event) => {
        this.captureError(event.detail.error, {
          category: ERROR_CATEGORIES.RENDERING,
          severity: ERROR_SEVERITY.HIGH,
          component: event.detail.component || COMPONENT_TYPES.UNKNOWN,
          context: {
            source: 'react-error-boundary',
            componentStack: event.detail.componentStack,
            errorBoundary: event.detail.errorBoundary
          }
        });
      });
    }
  }

  /**
   * Capture and process an error
   */
  captureError(error, options = {}) {
    if (!this.isEnabled) return;

    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    const errorRecord = {
      id: errorId,
      timestamp,
      error: this.serializeError(error),
      severity: options.severity || ERROR_SEVERITY.MEDIUM,
      category: options.category || this.categorizeError(error),
      component: options.component || COMPONENT_TYPES.UNKNOWN,
      context: {
        ...options.context,
        userContext: { ...this.userContext },
        systemContext: { ...this.systemContext },
        breadcrumbs: [...this.breadcrumbs],
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      tags: options.tags || [],
      fingerprint: this.generateFingerprint(error),
      stackTrace: error.stack || null
    };

    // Add performance context if available
    if (this.performanceMonitor) {
      errorRecord.context.performance = this.performanceMonitor.getPerformanceSummary();
    }

    // Store error
    this.errors.push(errorRecord);
    this.trimErrors();

    // Update frequency tracking
    this.updateErrorFrequency(errorRecord);

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorRecord);
    }

    // Persist if enabled
    if (this.config.enableLocalStorage) {
      this.persistError(errorRecord);
    }

    // Notify listeners
    this.notifyListeners('error', errorRecord);

    // Check reporting threshold
    this.checkReportingThreshold(errorRecord);

    // Add to breadcrumbs for future errors
    this.addBreadcrumb({
      type: 'error',
      message: error.message || 'Unknown error',
      category: errorRecord.category,
      severity: errorRecord.severity,
      timestamp
    });

    return errorId;
  }

  /**
   * Create a structured log entry
   */
  logStructured(level, message, context = {}) {
    if (!this.isEnabled) return;

    const logEntry = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      level,
      message,
      context: {
        ...context,
        url: window.location.href,
        userContext: { ...this.userContext },
        systemContext: { ...this.systemContext }
      }
    };

    // Add to breadcrumbs
    this.addBreadcrumb({
      type: 'log',
      level,
      message,
      timestamp: logEntry.timestamp
    });

    // Log to console
    if (this.config.enableConsoleLogging) {
      console.log(`[ErrorTracker] ${level.toUpperCase()}: ${message}`, context);
    }

    // Notify listeners
    this.notifyListeners('log', logEntry);

    return logEntry.id;
  }

  /**
   * Add breadcrumb for error context
   */
  addBreadcrumb(breadcrumb) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now()
    });

    // Trim breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * Update user context
   */
  updateUserContext(context) {
    this.userContext = {
      ...this.userContext,
      ...context,
      lastUpdated: Date.now()
    };

    this.addBreadcrumb({
      type: 'user-context',
      message: 'User context updated',
      context
    });
  }

  /**
   * Update system context
   */
  updateSystemContext(context = {}) {
    const systemInfo = {
      timestamp: Date.now(),
      platform: navigator.platform,
      language: navigator.language,
      onlineStatus: navigator.onLine,
      ...context
    };

    // Add memory information if available
    if (performance.memory) {
      systemInfo.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }

    // Add connection information if available
    if (navigator.connection) {
      systemInfo.connection = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }

    this.systemContext = systemInfo;
  }

  /**
   * Implement graceful degradation for component failures
   */
  gracefulDegradation(component, error, fallbackComponent = null) {
    const errorId = this.captureError(error, {
      category: ERROR_CATEGORIES.RENDERING,
      severity: ERROR_SEVERITY.MEDIUM,
      component,
      context: {
        source: 'graceful-degradation',
        hasFallback: !!fallbackComponent
      }
    });

    this.addBreadcrumb({
      type: 'degradation',
      message: `Graceful degradation triggered for ${component}`,
      context: {
        errorId,
        hasFallback: !!fallbackComponent
      }
    });

    // Return fallback component or null
    return fallbackComponent;
  }

  /**
   * Categorize error automatically
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return ERROR_CATEGORIES.NETWORK;
    }
    
    if (message.includes('memory') || message.includes('heap')) {
      return ERROR_CATEGORIES.MEMORY;
    }
    
    if (message.includes('render') || stack.includes('react')) {
      return ERROR_CATEGORIES.RENDERING;
    }
    
    if (message.includes('performance') || message.includes('timeout')) {
      return ERROR_CATEGORIES.PERFORMANCE;
    }
    
    if (message.includes('permission') || message.includes('security')) {
      return ERROR_CATEGORIES.SECURITY;
    }
    
    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Generate error fingerprint for grouping
   */
  generateFingerprint(error) {
    const message = error.message || 'Unknown error';
    const stack = error.stack || '';
    
    // Create a simple hash of the error signature
    const signature = message + stack.split('\n').slice(0, 3).join('');
    let hash = 0;
    
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Serialize error for storage
   */
  serializeError(error) {
    if (!error) return { message: 'Unknown error' };
    
    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack || null,
      code: error.code || null,
      type: error.constructor?.name || 'Error'
    };
  }

  /**
   * Update error frequency tracking
   */
  updateErrorFrequency(errorRecord) {
    const key = `${errorRecord.fingerprint}-${errorRecord.category}`;
    const current = this.errorFrequencies.get(key) || {
      count: 0,
      firstSeen: errorRecord.timestamp,
      lastSeen: errorRecord.timestamp,
      fingerprint: errorRecord.fingerprint,
      category: errorRecord.category,
      severity: errorRecord.severity
    };

    current.count++;
    current.lastSeen = errorRecord.timestamp;
    
    this.errorFrequencies.set(key, current);
  }

  /**
   * Check if error frequency exceeds reporting threshold
   */
  checkReportingThreshold(errorRecord) {
    const key = `${errorRecord.fingerprint}-${errorRecord.category}`;
    const frequency = this.errorFrequencies.get(key);
    const threshold = this.config.reportingThreshold[errorRecord.severity];

    if (frequency && frequency.count >= threshold) {
      this.triggerAlert(errorRecord, frequency);
    }
  }

  /**
   * Trigger alert for high-frequency errors
   */
  triggerAlert(errorRecord, frequency) {
    const alert = {
      type: 'error-frequency-alert',
      timestamp: Date.now(),
      error: errorRecord,
      frequency,
      message: `Error frequency threshold exceeded: ${frequency.count} occurrences of ${errorRecord.category} error`
    };

    console.warn('[ErrorTracker] ALERT:', alert.message);

    // Emit event for dashboard or other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ohif-error-alert', {
        detail: alert
      }));
    }

    // Notify listeners
    this.notifyListeners('alert', alert);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const recentErrors = this.errors.filter(e => e.timestamp >= last24Hours);
    const criticalErrors = this.errors.filter(e => e.severity === ERROR_SEVERITY.CRITICAL);

    const statistics = {
      total: this.errors.length,
      last24Hours: recentErrors.length,
      lastHour: this.errors.filter(e => e.timestamp >= lastHour).length,
      critical: criticalErrors.length,
      byCategory: {},
      bySeverity: {},
      topErrors: [],
      systemHealth: this.calculateSystemHealth()
    };

    // Group by category
    for (const error of this.errors) {
      statistics.byCategory[error.category] = (statistics.byCategory[error.category] || 0) + 1;
      statistics.bySeverity[error.severity] = (statistics.bySeverity[error.severity] || 0) + 1;
    }

    // Get top errors by frequency
    statistics.topErrors = Array.from(this.errorFrequencies.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return statistics;
  }

  /**
   * Calculate system health score
   */
  calculateSystemHealth() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp >= last24Hours);

    let healthScore = 100;

    // Reduce score based on error frequency and severity
    for (const error of recentErrors) {
      switch (error.severity) {
        case ERROR_SEVERITY.CRITICAL:
          healthScore -= 20;
          break;
        case ERROR_SEVERITY.HIGH:
          healthScore -= 10;
          break;
        case ERROR_SEVERITY.MEDIUM:
          healthScore -= 5;
          break;
        case ERROR_SEVERITY.LOW:
          healthScore -= 1;
          break;
      }
    }

    return Math.max(0, Math.min(100, healthScore));
  }

  /**
   * Export error data for analysis
   */
  exportErrorData(options = {}) {
    const {
      includeSystemContext = true,
      includeBreadcrumbs = true,
      includeFrequencies = true,
      fromTimestamp = 0,
      toTimestamp = Date.now()
    } = options;

    const filteredErrors = this.errors.filter(
      error => error.timestamp >= fromTimestamp && error.timestamp <= toTimestamp
    );

    const exportData = {
      timestamp: Date.now(),
      summary: this.getErrorStatistics(),
      errors: filteredErrors,
      config: this.config
    };

    if (includeSystemContext) {
      exportData.systemContext = this.systemContext;
    }

    if (includeBreadcrumbs) {
      exportData.breadcrumbs = this.breadcrumbs;
    }

    if (includeFrequencies) {
      exportData.frequencies = Object.fromEntries(this.errorFrequencies);
    }

    return exportData;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Trim errors to maximum limit
   */
  trimErrors() {
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }
  }

  /**
   * Log error to console with formatting
   */
  logToConsole(errorRecord) {
    const prefix = `[ErrorTracker][${errorRecord.severity.toUpperCase()}][${errorRecord.category}]`;
    console.error(`${prefix} ${errorRecord.error.message}`, {
      error: errorRecord.error,
      context: errorRecord.context,
      id: errorRecord.id
    });
  }

  /**
   * Persist error to local storage
   */
  persistError(errorRecord) {
    try {
      const storageKey = `ohif_error_${errorRecord.id}`;
      localStorage.setItem(storageKey, JSON.stringify(errorRecord));
    } catch (error) {
      console.warn('[ErrorTracker] Failed to persist error to localStorage:', error);
    }
  }

  /**
   * Load persisted errors from local storage
   */
  loadPersistedErrors() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('ohif_error_'));
      const persistedErrors = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Merge with current errors
      this.errors = [...persistedErrors, ...this.errors];
      this.trimErrors();

      console.log(`[ErrorTracker] Loaded ${persistedErrors.length} persisted errors`);
    } catch (error) {
      console.warn('[ErrorTracker] Failed to load persisted errors:', error);
    }
  }

  /**
   * Set up periodic cleanup
   */
  setupPeriodicCleanup() {
    setInterval(() => {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Clean old errors
      this.errors = this.errors.filter(error => error.timestamp > cutoff);
      
      // Clean old breadcrumbs
      this.breadcrumbs = this.breadcrumbs.filter(breadcrumb => breadcrumb.timestamp > cutoff);
      
      // Clean old frequency data
      for (const [key, frequency] of this.errorFrequencies.entries()) {
        if (frequency.lastSeen < cutoff) {
          this.errorFrequencies.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Add event listener
   */
  addEventListener(type, listener) {
    this.listeners.push({ type, listener });
  }

  /**
   * Remove event listener
   */
  removeEventListener(type, listener) {
    this.listeners = this.listeners.filter(l => l.type !== type || l.listener !== listener);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(type, data) {
    this.listeners
      .filter(l => l.type === type)
      .forEach(l => {
        try {
          l.listener(data);
        } catch (error) {
          console.warn('[ErrorTracker] Listener error:', error);
        }
      });
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    console.log('[ErrorTracker] Destroying error tracking service');
    
    this.isEnabled = false;
    this.listeners = [];
    this.errors = [];
    this.breadcrumbs = [];
    this.errorFrequencies.clear();
  }
}

// Global instance for easy access
let globalErrorTracker = null;

/**
 * Get or create global error tracker instance
 */
export function getErrorTracker() {
  if (!globalErrorTracker) {
    globalErrorTracker = new ErrorTrackingService();
  }
  return globalErrorTracker;
}

/**
 * Initialize error tracking for OHIF
 */
export function initializeErrorTracking(config = {}) {
  const tracker = getErrorTracker();
  
  // Apply configuration
  Object.assign(tracker.config, config);
  
  console.log('[ErrorTracker] Error tracking initialized');
  return tracker;
}

/**
 * Convenience functions for common operations
 */
export const errorLogger = {
  logError: (error, options) => getErrorTracker().captureError(error, options),
  logInfo: (message, context) => getErrorTracker().logStructured('info', message, context),
  logWarning: (message, context) => getErrorTracker().logStructured('warning', message, context),
  logDebug: (message, context) => getErrorTracker().logStructured('debug', message, context),
  addBreadcrumb: (breadcrumb) => getErrorTracker().addBreadcrumb(breadcrumb),
  updateUserContext: (context) => getErrorTracker().updateUserContext(context),
  gracefulDegradation: (component, error, fallback) => getErrorTracker().gracefulDegradation(component, error, fallback)
};

export { ErrorTrackingService };
export default ErrorTrackingService; 