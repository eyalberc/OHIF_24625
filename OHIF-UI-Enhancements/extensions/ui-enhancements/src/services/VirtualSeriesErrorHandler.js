/**
 * Virtual Series Error Handler
 * 
 * Comprehensive error handling service for all stages of the virtual series lifecycle
 * Provides user-friendly error messages, logging, and automatic recovery strategies
 * 
 * Task 4.6: Error Handling Implementation
 */

import { virtualSeriesProfiler } from '../utils/virtualSeriesPerformance.js';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',           // Minor issues that don't affect functionality
  MEDIUM: 'medium',     // Issues that may affect some functionality
  HIGH: 'high',         // Issues that significantly impact functionality
  CRITICAL: 'critical'  // Issues that prevent core functionality
};

/**
 * Error categories for virtual series operations
 */
export const ErrorCategory = {
  DATA_LOADING: 'data_loading',
  STUDY_MAPPING: 'study_mapping',
  CACHE_OPERATION: 'cache_operation',
  NETWORK_REQUEST: 'network_request',
  MEMORY_MANAGEMENT: 'memory_management',
  SERVICE_INITIALIZATION: 'service_initialization',
  VALIDATION: 'validation',
  DISPLAY_RENDERING: 'display_rendering',
  USER_INTERACTION: 'user_interaction'
};

/**
 * Recovery strategies for different error types
 */
export const RecoveryStrategy = {
  RETRY: 'retry',                    // Retry the operation
  FALLBACK: 'fallback',             // Use fallback implementation
  GRACEFUL_DEGRADATION: 'graceful', // Continue with reduced functionality
  CACHE_CLEAR: 'cache_clear',       // Clear cache and retry
  RELOAD: 'reload',                 // Reload the component/service
  USER_ACTION: 'user_action'        // Require user intervention
};

/**
 * Virtual Series Error Handler Class
 */
export class VirtualSeriesErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableLogging: options.enableLogging !== false,
      enableUserNotifications: options.enableUserNotifications !== false,
      enableAutoRecovery: options.enableAutoRecovery !== false,
      maxRetryAttempts: options.maxRetryAttempts || 3,
      retryDelayMs: options.retryDelayMs || 1000,
      enableTelemetry: options.enableTelemetry || false,
      logLevel: options.logLevel || 'error'
    };

    // Error tracking
    this.errorCounts = new Map();
    this.recentErrors = [];
    this.recoveryAttempts = new Map();
    this.userNotificationCallbacks = [];
    
    // Recovery handlers
    this.recoveryHandlers = new Map();
    this.initializeDefaultRecoveryHandlers();

    this.log('VirtualSeriesErrorHandler initialized', this.options);
  }

  /**
   * Main error handling method
   */
  async handleError(error, context = {}) {
    const errorTiming = virtualSeriesProfiler.startTiming('errorHandling');
    
    try {
      // Normalize error object
      const normalizedError = this.normalizeError(error, context);
      
      // Log the error
      this.logError(normalizedError);
      
      // Track error statistics
      this.trackError(normalizedError);
      
      // Determine recovery strategy
      const recoveryStrategy = this.determineRecoveryStrategy(normalizedError);
      
      // Attempt recovery
      const recoveryResult = await this.attemptRecovery(normalizedError, recoveryStrategy);
      
      // Notify user if necessary
      if (this.shouldNotifyUser(normalizedError, recoveryResult)) {
        this.notifyUser(normalizedError, recoveryResult);
      }
      
      virtualSeriesProfiler.endTiming(errorTiming, 'errorHandling');
      return recoveryResult;
      
    } catch (handlingError) {
      this.log('Error occurred while handling error', handlingError);
      virtualSeriesProfiler.endTiming(errorTiming, 'errorHandling');
      return {
        success: false,
        strategy: RecoveryStrategy.USER_ACTION,
        message: 'An unexpected error occurred. Please refresh the application.',
        originalError: error
      };
    }
  }

  /**
   * Normalize error to standard format
   */
  normalizeError(error, context) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();

    return {
      id: errorId,
      timestamp,
      message: error?.message || error?.toString() || 'Unknown error',
      stack: error?.stack,
      code: error?.code,
      name: error?.name || 'UnknownError',
      category: this.categorizeError(error, context),
      severity: this.determineSeverity(error, context),
      context: {
        operation: context.operation || 'unknown',
        studyUID: context.studyUID,
        seriesUID: context.seriesUID,
        component: context.component || 'virtual-series',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location?.href : 'unknown',
        ...context
      },
      retryCount: this.getRetryCount(errorId),
      isRecoverable: this.isRecoverable(error, context)
    };
  }

  /**
   * Categorize error based on error type and context
   */
  categorizeError(error, context) {
    const message = error?.message?.toLowerCase() || '';
    const operation = context.operation?.toLowerCase() || '';

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('timeout') || message.includes('connection')) {
      return ErrorCategory.NETWORK_REQUEST;
    }

    // Memory-related errors
    if (message.includes('memory') || message.includes('heap') || 
        message.includes('allocation')) {
      return ErrorCategory.MEMORY_MANAGEMENT;
    }

    // Cache-related errors
    if (message.includes('cache') || operation.includes('cache')) {
      return ErrorCategory.CACHE_OPERATION;
    }

    // Data loading errors
    if (operation.includes('load') || operation.includes('retrieve') || 
        operation.includes('fetch')) {
      return ErrorCategory.DATA_LOADING;
    }

    // Study mapping errors
    if (operation.includes('map') || operation.includes('study') || 
        operation.includes('series')) {
      return ErrorCategory.STUDY_MAPPING;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || 
        operation.includes('validate')) {
      return ErrorCategory.VALIDATION;
    }

    // Service initialization errors
    if (operation.includes('init') || operation.includes('service') || 
        message.includes('initialization')) {
      return ErrorCategory.SERVICE_INITIALIZATION;
    }

    // Display/rendering errors
    if (operation.includes('render') || operation.includes('display') || 
        message.includes('render')) {
      return ErrorCategory.DISPLAY_RENDERING;
    }

    return ErrorCategory.USER_INTERACTION;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, context) {
    const category = this.categorizeError(error, context);
    const message = error?.message?.toLowerCase() || '';

    // Critical errors
    if (category === ErrorCategory.SERVICE_INITIALIZATION ||
        message.includes('critical') ||
        message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (category === ErrorCategory.MEMORY_MANAGEMENT ||
        category === ErrorCategory.DATA_LOADING ||
        message.includes('corrupt') ||
        message.includes('security')) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (category === ErrorCategory.NETWORK_REQUEST ||
        category === ErrorCategory.CACHE_OPERATION ||
        category === ErrorCategory.STUDY_MAPPING) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Determine if error is recoverable
   */
  isRecoverable(error, context) {
    const category = this.categorizeError(error, context);
    const message = error?.message?.toLowerCase() || '';

    // Non-recoverable errors
    if (message.includes('security') ||
        message.includes('permission') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return false;
    }

    // Most virtual series errors are recoverable
    return true;
  }

  /**
   * Determine recovery strategy
   */
  determineRecoveryStrategy(normalizedError) {
    const { category, severity, retryCount, isRecoverable } = normalizedError;

    // Non-recoverable errors
    if (!isRecoverable) {
      return RecoveryStrategy.USER_ACTION;
    }

    // Critical errors - reload component
    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.RELOAD;
    }

    // Network errors - retry with backoff
    if (category === ErrorCategory.NETWORK_REQUEST && retryCount < this.options.maxRetryAttempts) {
      return RecoveryStrategy.RETRY;
    }

    // Cache errors - clear cache and retry
    if (category === ErrorCategory.CACHE_OPERATION) {
      return RecoveryStrategy.CACHE_CLEAR;
    }

    // Memory errors - graceful degradation
    if (category === ErrorCategory.MEMORY_MANAGEMENT) {
      return RecoveryStrategy.GRACEFUL_DEGRADATION;
    }

    // Data loading/mapping errors - fallback
    if (category === ErrorCategory.DATA_LOADING || 
        category === ErrorCategory.STUDY_MAPPING) {
      return RecoveryStrategy.FALLBACK;
    }

    // Default retry strategy
    if (retryCount < this.options.maxRetryAttempts) {
      return RecoveryStrategy.RETRY;
    }

    return RecoveryStrategy.GRACEFUL_DEGRADATION;
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(normalizedError, strategy) {
    const recoveryTiming = virtualSeriesProfiler.startTiming('errorRecovery');
    
    try {
      this.log(`Attempting recovery with strategy: ${strategy}`, normalizedError);

      // Get recovery handler
      const handler = this.recoveryHandlers.get(strategy);
      if (!handler) {
        throw new Error(`No recovery handler found for strategy: ${strategy}`);
      }

      // Attempt recovery
      const result = await handler(normalizedError);
      
      // Track recovery attempt
      this.trackRecoveryAttempt(normalizedError.id, strategy, result.success);
      
      virtualSeriesProfiler.endTiming(recoveryTiming, 'errorRecovery');
      return {
        success: result.success,
        strategy,
        message: result.message,
        data: result.data,
        originalError: normalizedError
      };
      
    } catch (recoveryError) {
      this.log('Recovery attempt failed', recoveryError);
      virtualSeriesProfiler.endTiming(recoveryTiming, 'errorRecovery');
      
      return {
        success: false,
        strategy,
        message: `Recovery failed: ${recoveryError.message}`,
        originalError: normalizedError,
        recoveryError
      };
    }
  }

  /**
   * Initialize default recovery handlers
   */
  initializeDefaultRecoveryHandlers() {
    // Retry handler
    this.recoveryHandlers.set(RecoveryStrategy.RETRY, async (error) => {
      await this.delay(this.options.retryDelayMs * (error.retryCount + 1));
      return {
        success: true,
        message: 'Retrying operation...',
        action: 'retry'
      };
    });

    // Fallback handler
    this.recoveryHandlers.set(RecoveryStrategy.FALLBACK, async (error) => {
      return {
        success: true,
        message: 'Using fallback implementation',
        action: 'fallback',
        data: { useFallback: true }
      };
    });

    // Graceful degradation handler
    this.recoveryHandlers.set(RecoveryStrategy.GRACEFUL_DEGRADATION, async (error) => {
      return {
        success: true,
        message: 'Continuing with reduced functionality',
        action: 'degrade',
        data: { 
          disableVirtualSeries: error.category === ErrorCategory.STUDY_MAPPING,
          reduceChunkSize: error.category === ErrorCategory.MEMORY_MANAGEMENT,
          disableCaching: error.category === ErrorCategory.CACHE_OPERATION
        }
      };
    });

    // Cache clear handler
    this.recoveryHandlers.set(RecoveryStrategy.CACHE_CLEAR, async (error) => {
      return {
        success: true,
        message: 'Clearing cache and retrying',
        action: 'clearCache'
      };
    });

    // Reload handler
    this.recoveryHandlers.set(RecoveryStrategy.RELOAD, async (error) => {
      return {
        success: true,
        message: 'Reloading component',
        action: 'reload'
      };
    });

    // User action handler
    this.recoveryHandlers.set(RecoveryStrategy.USER_ACTION, async (error) => {
      return {
        success: false,
        message: this.getUserFriendlyMessage(error),
        action: 'userAction'
      };
    });
  }

  /**
   * Generate user-friendly error messages
   */
  getUserFriendlyMessage(error) {
    const { category, severity } = error;

    switch (category) {
      case ErrorCategory.NETWORK_REQUEST:
        return 'Unable to load medical images. Please check your internet connection and try again.';
        
      case ErrorCategory.DATA_LOADING:
        return 'There was a problem loading the study data. The images may be corrupted or unavailable.';
        
      case ErrorCategory.MEMORY_MANAGEMENT:
        return 'The application is running low on memory. Try closing other applications or refreshing the page.';
        
      case ErrorCategory.CACHE_OPERATION:
        return 'There was a problem with the image cache. The application will continue without caching.';
        
      case ErrorCategory.STUDY_MAPPING:
        return 'Unable to process the study structure. Some advanced features may not be available.';
        
      case ErrorCategory.SERVICE_INITIALIZATION:
        return 'Failed to initialize the imaging service. Please refresh the application.';
        
      case ErrorCategory.VALIDATION:
        return 'The medical data format is not supported or may be corrupted.';
        
      case ErrorCategory.DISPLAY_RENDERING:
        return 'Unable to display the medical images. Your browser may not support the required features.';
        
      default:
        if (severity === ErrorSeverity.CRITICAL) {
          return 'A critical error occurred. Please refresh the application and contact support if the problem persists.';
        }
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Determine if user should be notified
   */
  shouldNotifyUser(error, recoveryResult) {
    if (!this.options.enableUserNotifications) {
      return false;
    }

    // Always notify for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      return true;
    }

    // Notify if recovery failed
    if (!recoveryResult.success) {
      return true;
    }

    // Notify for high severity errors even if recovered
    if (error.severity === ErrorSeverity.HIGH) {
      return true;
    }

    return false;
  }

  /**
   * Notify user about error
   */
  notifyUser(error, recoveryResult) {
    const notification = {
      type: recoveryResult.success ? 'warning' : 'error',
      title: this.getNotificationTitle(error, recoveryResult),
      message: recoveryResult.message,
      duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000, // Persistent for critical
      actions: this.getNotificationActions(error, recoveryResult)
    };

    // Call registered notification callbacks
    this.userNotificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (callbackError) {
        this.log('Error in notification callback', callbackError);
      }
    });
  }

  /**
   * Get notification title
   */
  getNotificationTitle(error, recoveryResult) {
    if (recoveryResult.success) {
      return 'Issue Resolved';
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      case ErrorSeverity.HIGH:
        return 'Error';
      case ErrorSeverity.MEDIUM:
        return 'Warning';
      default:
        return 'Notice';
    }
  }

  /**
   * Get notification actions
   */
  getNotificationActions(error, recoveryResult) {
    const actions = [];

    if (!recoveryResult.success) {
      actions.push({
        label: 'Retry',
        action: () => this.retryOperation(error)
      });

      if (error.category !== ErrorCategory.SERVICE_INITIALIZATION) {
        actions.push({
          label: 'Continue',
          action: () => this.continueWithDegradedMode(error)
        });
      }
    }

    if (error.severity === ErrorSeverity.CRITICAL) {
      actions.push({
        label: 'Refresh',
        action: () => window.location.reload()
      });
    }

    return actions;
  }

  /**
   * Utility methods
   */
  
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRetryCount(errorId) {
    return this.recoveryAttempts.get(errorId) || 0;
  }

  trackError(error) {
    // Update error counts
    const countKey = `${error.category}_${error.severity}`;
    this.errorCounts.set(countKey, (this.errorCounts.get(countKey) || 0) + 1);

    // Add to recent errors (keep last 100)
    this.recentErrors.push(error);
    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }
  }

  trackRecoveryAttempt(errorId, strategy, success) {
    const currentCount = this.recoveryAttempts.get(errorId) || 0;
    this.recoveryAttempts.set(errorId, currentCount + 1);
  }

  logError(error) {
    if (!this.options.enableLogging) return;

    const logLevel = this.getLogLevel(error.severity);
    
    if (logLevel === 'error') {
      console.error('[Virtual Series Error]', {
        id: error.id,
        message: error.message,
        category: error.category,
        severity: error.severity,
        context: error.context,
        stack: error.stack
      });
    } else if (logLevel === 'warn') {
      console.warn('[Virtual Series Warning]', {
        id: error.id,
        message: error.message,
        category: error.category,
        severity: error.severity
      });
    } else {
      console.log('[Virtual Series Info]', {
        id: error.id,
        message: error.message,
        category: error.category
      });
    }
  }

  getLogLevel(severity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'log';
    }
  }

  log(message, data = null) {
    if (this.options.enableLogging) {
      console.log(`[VirtualSeriesErrorHandler] ${message}`, data);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public API methods
   */

  // Register user notification callback
  onUserNotification(callback) {
    this.userNotificationCallbacks.push(callback);
  }

  // Remove user notification callback
  offUserNotification(callback) {
    const index = this.userNotificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.userNotificationCallbacks.splice(index, 1);
    }
  }

  // Register custom recovery handler
  registerRecoveryHandler(strategy, handler) {
    this.recoveryHandlers.set(strategy, handler);
  }

  // Get error statistics
  getErrorStatistics() {
    return {
      totalErrors: this.recentErrors.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.recentErrors.slice(-10), // Last 10 errors
      recoveryAttempts: Object.fromEntries(this.recoveryAttempts)
    };
  }

  // Clear error history
  clearErrorHistory() {
    this.recentErrors.length = 0;
    this.errorCounts.clear();
    this.recoveryAttempts.clear();
  }

  // Health check
  getHealthStatus() {
    const recentErrorCount = this.recentErrors.filter(
      error => Date.now() - new Date(error.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    const criticalErrors = this.recentErrors.filter(
      error => error.severity === ErrorSeverity.CRITICAL
    ).length;

    return {
      status: criticalErrors > 0 ? 'critical' : 
              recentErrorCount > 10 ? 'degraded' : 'healthy',
      recentErrorCount,
      criticalErrors,
      timestamp: new Date().toISOString()
    };
  }

  // Cleanup
  dispose() {
    this.userNotificationCallbacks.length = 0;
    this.recoveryHandlers.clear();
    this.clearErrorHistory();
  }
}

/**
 * Singleton instance for global error handling
 */
let globalErrorHandler = null;

export function getVirtualSeriesErrorHandler(options = {}) {
  if (!globalErrorHandler) {
    globalErrorHandler = new VirtualSeriesErrorHandler(options);
  }
  return globalErrorHandler;
}

export function resetVirtualSeriesErrorHandler() {
  if (globalErrorHandler) {
    globalErrorHandler.dispose();
    globalErrorHandler = null;
  }
}

/**
 * Convenience function for handling errors
 */
export async function handleVirtualSeriesError(error, context = {}) {
  const errorHandler = getVirtualSeriesErrorHandler();
  return await errorHandler.handleError(error, context);
}

/**
 * Error handling decorators and utilities
 */

// Wrapper function for automatic error handling
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const recoveryResult = await handleVirtualSeriesError(error, {
        ...context,
        operation: fn.name || 'anonymous',
        arguments: args
      });
      
      if (recoveryResult.success && recoveryResult.strategy === RecoveryStrategy.RETRY) {
        // Retry the operation
        return await fn(...args);
      }
      
      if (recoveryResult.success && recoveryResult.data?.useFallback) {
        // Indicate fallback should be used
        throw new Error('USE_FALLBACK');
      }
      
      throw error;
    }
  };
} 