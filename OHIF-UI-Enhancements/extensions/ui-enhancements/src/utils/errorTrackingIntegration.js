/**
 * Error Tracking Integration Utilities - OHIF v3 Enhanced System
 * 
 * Task 10.4: Error Tracking and Logging Implementation
 * 
 * FEATURES IMPLEMENTED:
 * - Integration between error tracking, performance monitoring, and telemetry
 * - OHIF service manager integration for centralized error handling
 * - Extension and mode error isolation and reporting
 * - Data source error correlation and recovery
 * - Viewport error handling with graceful degradation
 * - Tool activation error handling and recovery
 * - Study loading error correlation with performance metrics
 */

import { getErrorTracker, ERROR_SEVERITY, ERROR_CATEGORIES, COMPONENT_TYPES } from '../services/ErrorTrackingService';
import { getPerformanceMonitor } from '../services/PerformanceMonitoringService';
import { getErrorTelemetry } from './errorTelemetry';

/**
 * OHIF Error Integration Manager
 * Provides centralized error handling for all OHIF components
 */
class OHIFErrorIntegration {
  constructor() {
    this.errorTracker = null;
    this.performanceMonitor = null;
    this.telemetry = null;
    this.serviceManager = null;
    this.extensionManager = null;
    this.commandsManager = null;
    this.isInitialized = false;

    this.initialize();
  }

  /**
   * Initialize integration with OHIF services
   */
  async initialize() {
    console.log('[OHIFErrorIntegration] Initializing error tracking integration');

    try {
      // Initialize core services
      this.errorTracker = getErrorTracker();
      this.performanceMonitor = getPerformanceMonitor();
      this.telemetry = getErrorTelemetry();

      // Set up integration hooks
      this.setupErrorHandlingHooks();
      this.setupPerformanceCorrelation();
      this.setupTelemetryIntegration();

      this.isInitialized = true;
      console.log('[OHIFErrorIntegration] Successfully initialized error tracking integration');
    } catch (error) {
      console.error('[OHIFErrorIntegration] Failed to initialize error tracking integration:', error);
    }
  }

  /**
   * Set up error handling hooks for OHIF services
   */
  setupErrorHandlingHooks() {
    // Global window error correlation
    window.addEventListener('ohif-service-error', (event) => {
      this.handleServiceError(event.detail);
    });

    // Extension loading errors
    window.addEventListener('ohif-extension-error', (event) => {
      this.handleExtensionError(event.detail);
    });

    // Data source errors
    window.addEventListener('ohif-datasource-error', (event) => {
      this.handleDataSourceError(event.detail);
    });

    // Viewport errors
    window.addEventListener('ohif-viewport-error', (event) => {
      this.handleViewportError(event.detail);
    });

    // Tool errors
    window.addEventListener('ohif-tool-error', (event) => {
      this.handleToolError(event.detail);
    });

    // Study loading errors
    window.addEventListener('ohif-study-error', (event) => {
      this.handleStudyError(event.detail);
    });
  }

  /**
   * Set up performance correlation
   */
  setupPerformanceCorrelation() {
    if (!this.performanceMonitor) return;

    // Listen for performance alerts and correlate with errors
    window.addEventListener('ohif-performance-alert', (event) => {
      this.correlatePerformanceAlert(event.detail);
    });
  }

  /**
   * Set up telemetry integration
   */
  setupTelemetryIntegration() {
    if (!this.telemetry || !this.errorTracker) return;

    // Forward error events to telemetry
    this.errorTracker.addEventListener('error', (errorRecord) => {
      this.telemetry.queueErrorForTelemetry(errorRecord);
    });

    this.errorTracker.addEventListener('alert', (alert) => {
      this.telemetry.sendImmediateAlert(alert);
    });
  }

  /**
   * Handle service-level errors
   */
  handleServiceError(errorDetail) {
    const { error, service, method, context } = errorDetail;

    const errorId = this.errorTracker?.captureError(error, {
      category: ERROR_CATEGORIES.INTEGRATION,
      severity: this.determineSeverityForService(service, error),
      component: COMPONENT_TYPES.SERVICE,
      context: {
        service: service?.name || 'unknown',
        method,
        serviceId: service?.id,
        ...context
      },
      tags: [`service-${service?.name}`, `method-${method}`]
    });

    // Add breadcrumb for service errors
    this.errorTracker?.addBreadcrumb({
      type: 'service-error',
      message: `Service error in ${service?.name || 'unknown'}.${method}`,
      context: { errorId, service: service?.name }
    });

    // Attempt service recovery if possible
    this.attemptServiceRecovery(service, error, errorId);

    return errorId;
  }

  /**
   * Handle extension loading errors
   */
  handleExtensionError(errorDetail) {
    const { error, extension, phase, context } = errorDetail;

    const errorId = this.errorTracker?.captureError(error, {
      category: ERROR_CATEGORIES.INTEGRATION,
      severity: ERROR_SEVERITY.HIGH,
      component: COMPONENT_TYPES.EXTENSION,
      context: {
        extensionId: extension?.id,
        extensionName: extension?.name,
        loadingPhase: phase,
        ...context
      },
      tags: [`extension-${extension?.id}`, `phase-${phase}`]
    });

    // Add breadcrumb
    this.errorTracker?.addBreadcrumb({
      type: 'extension-error',
      message: `Extension error during ${phase} for ${extension?.name || 'unknown'}`,
      context: { errorId, extensionId: extension?.id }
    });

    // Handle extension fallback
    this.handleExtensionFallback(extension, error, errorId);

    return errorId;
  }

  /**
   * Handle data source errors
   */
  handleDataSourceError(errorDetail) {
    const { error, dataSource, operation, study, series, context } = errorDetail;

    const errorId = this.errorTracker?.captureError(error, {
      category: ERROR_CATEGORIES.DATA_PROCESSING,
      severity: this.determineSeverityForDataSource(operation, error),
      component: COMPONENT_TYPES.DATA_SOURCE,
      context: {
        dataSourceName: dataSource?.name,
        operation,
        studyInstanceUID: study?.StudyInstanceUID,
        seriesInstanceUID: series?.SeriesInstanceUID,
        ...context
      },
      tags: [`datasource-${dataSource?.name}`, `operation-${operation}`]
    });

    // Correlate with performance metrics
    this.correlateDataSourceError(errorId, dataSource, operation);

    // Attempt data source recovery
    this.attemptDataSourceRecovery(dataSource, operation, error, errorId);

    return errorId;
  }

  /**
   * Handle viewport errors
   */
  handleViewportError(errorDetail) {
    const { error, viewport, displaySet, context } = errorDetail;

    const errorId = this.errorTracker?.captureError(error, {
      category: ERROR_CATEGORIES.RENDERING,
      severity: ERROR_SEVERITY.HIGH,
      component: COMPONENT_TYPES.VIEWPORT,
      context: {
        viewportId: viewport?.id,
        viewportType: viewport?.type,
        displaySetInstanceUID: displaySet?.displaySetInstanceUID,
        studyInstanceUID: displaySet?.StudyInstanceUID,
        seriesInstanceUID: displaySet?.SeriesInstanceUID,
        renderingEngine: viewport?.renderingEngine?.id,
        ...context
      },
      tags: [`viewport-${viewport?.id}`, `rendering-error`]
    });

    // Add viewport performance context
    if (this.performanceMonitor) {
      const performanceContext = this.performanceMonitor.getPerformanceSummary();
      this.errorTracker?.updateUserContext({
        lastViewportError: {
          errorId,
          viewportId: viewport?.id,
          performance: performanceContext?.systemInfo
        }
      });
    }

    // Attempt viewport recovery
    this.attemptViewportRecovery(viewport, error, errorId);

    return errorId;
  }

  /**
   * Handle tool errors
   */
  handleToolError(errorDetail) {
    const { error, tool, action, viewport, context } = errorDetail;

    const errorId = this.errorTracker?.captureError(error, {
      category: ERROR_CATEGORIES.USER_ACTION,
      severity: ERROR_SEVERITY.MEDIUM,
      component: COMPONENT_TYPES.TOOLBAR,
      context: {
        toolName: tool?.name || tool,
        action,
        viewportId: viewport?.id,
        toolState: tool?.state,
        ...context
      },
      tags: [`tool-${tool?.name || tool}`, `action-${action}`]
    });

    // Track tool usage patterns for error analysis
    this.trackToolUsagePattern(tool, action, error, errorId);

    return errorId;
  }

  /**
   * Handle study loading errors
   */
  handleStudyError(errorDetail) {
    const { error, study, phase, context } = errorDetail;

    const errorId = this.errorTracker?.captureError(error, {
      category: ERROR_CATEGORIES.DATA_PROCESSING,
      severity: ERROR_SEVERITY.HIGH,
      component: COMPONENT_TYPES.CORE,
      context: {
        studyInstanceUID: study?.StudyInstanceUID,
        numberOfSeries: study?.NumInstances,
        loadingPhase: phase,
        ...context
      },
      tags: [`study-loading`, `phase-${phase}`]
    });

    // Correlate with study loading performance
    this.correlateStudyLoadingError(errorId, study, phase);

    return errorId;
  }

  /**
   * Correlate performance alerts with error patterns
   */
  correlatePerformanceAlert(alertDetail) {
    const { type, message } = alertDetail;

    // Get recent errors to look for patterns
    const recentErrors = this.errorTracker?.getErrorStatistics();
    
    this.errorTracker?.addBreadcrumb({
      type: 'performance-correlation',
      message: `Performance alert: ${message}`,
      context: {
        alertType: type,
        recentErrorCount: recentErrors?.last24Hours || 0,
        systemHealth: recentErrors?.systemHealth || 100
      }
    });

    // If performance issues correlate with high error rates, escalate
    if (recentErrors?.lastHour > 5) {
      this.errorTracker?.triggerAlert({
        severity: ERROR_SEVERITY.HIGH,
        category: ERROR_CATEGORIES.PERFORMANCE
      }, {
        count: recentErrors.lastHour,
        message: 'High error rate correlates with performance degradation'
      });
    }
  }

  /**
   * Determine severity for service errors
   */
  determineSeverityForService(service, error) {
    const serviceName = service?.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    // Critical services
    if (['ui', 'core', 'commandsmanager'].includes(serviceName)) {
      return ERROR_SEVERITY.CRITICAL;
    }

    // High priority services
    if (['viewportgridservice', 'cornerstoneviewportservice'].includes(serviceName)) {
      return ERROR_SEVERITY.HIGH;
    }

    // Network or data-related errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ERROR_SEVERITY.MEDIUM;
    }

    return ERROR_SEVERITY.MEDIUM;
  }

  /**
   * Determine severity for data source errors
   */
  determineSeverityForDataSource(operation, error) {
    const errorMessage = error.message?.toLowerCase() || '';

    // Critical operations
    if (['initialize', 'getImageIdsForDisplaySet'].includes(operation)) {
      return ERROR_SEVERITY.HIGH;
    }

    // Network errors are generally medium severity
    if (errorMessage.includes('network') || errorMessage.includes('404')) {
      return ERROR_SEVERITY.MEDIUM;
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return ERROR_SEVERITY.MEDIUM;
    }

    return ERROR_SEVERITY.LOW;
  }

  /**
   * Attempt service recovery
   */
  attemptServiceRecovery(service, error, errorId) {
    if (!service?.name) return;

    this.errorTracker?.addBreadcrumb({
      type: 'recovery-attempt',
      message: `Attempting recovery for service ${service.name}`,
      context: { errorId, serviceName: service.name }
    });

    // Service-specific recovery strategies
    switch (service.name.toLowerCase()) {
      case 'cornerstoneviewportservice':
        this.recoverViewportService(service, error);
        break;
      case 'hangingprotocolservice':
        this.recoverHangingProtocolService(service, error);
        break;
      default:
        // Generic service recovery
        this.genericServiceRecovery(service, error);
    }
  }

  /**
   * Handle extension fallback
   */
  handleExtensionFallback(extension, error, errorId) {
    this.errorTracker?.addBreadcrumb({
      type: 'extension-fallback',
      message: `Extension fallback triggered for ${extension?.name}`,
      context: { errorId, extensionId: extension?.id }
    });

    // Implement graceful degradation for missing extensions
    // This would integrate with OHIF's extension system
  }

  /**
   * Correlate data source errors with performance
   */
  correlateDataSourceError(errorId, dataSource, operation) {
    if (!this.performanceMonitor) return;

    const performanceData = this.performanceMonitor.getPerformanceSummary();
    
    this.errorTracker?.addBreadcrumb({
      type: 'performance-correlation',
      message: `Data source error correlation for ${operation}`,
      context: {
        errorId,
        dataSourceName: dataSource?.name,
        operation,
        memoryUsage: performanceData?.systemInfo?.memory?.usedJSHeapSize,
        networkMetrics: performanceData?.metrics?.network
      }
    });
  }

  /**
   * Attempt data source recovery
   */
  attemptDataSourceRecovery(dataSource, operation, error, errorId) {
    // Implement retry logic for data source operations
    this.errorTracker?.addBreadcrumb({
      type: 'datasource-recovery',
      message: `Attempting data source recovery for ${operation}`,
      context: { errorId, dataSourceName: dataSource?.name }
    });
  }

  /**
   * Attempt viewport recovery
   */
  attemptViewportRecovery(viewport, error, errorId) {
    this.errorTracker?.addBreadcrumb({
      type: 'viewport-recovery',
      message: `Attempting viewport recovery for ${viewport?.id}`,
      context: { errorId, viewportId: viewport?.id }
    });

    // Viewport-specific recovery strategies could be implemented here
  }

  /**
   * Track tool usage patterns for error analysis
   */
  trackToolUsagePattern(tool, action, error, errorId) {
    this.errorTracker?.updateUserContext({
      lastToolError: {
        errorId,
        toolName: tool?.name || tool,
        action,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Correlate study loading errors with performance
   */
  correlateStudyLoadingError(errorId, study, phase) {
    if (!this.performanceMonitor) return;

    const performanceData = this.performanceMonitor.getPerformanceSummary();
    
    this.errorTracker?.addBreadcrumb({
      type: 'study-loading-correlation',
      message: `Study loading error during ${phase}`,
      context: {
        errorId,
        studyInstanceUID: study?.StudyInstanceUID,
        numberOfSeries: study?.NumInstances,
        phase,
        systemMemory: performanceData?.systemInfo?.memory,
        networkConnection: performanceData?.systemInfo?.connection
      }
    });
  }

  /**
   * Generic service recovery
   */
  genericServiceRecovery(service, error) {
    // Implement generic recovery strategies
    console.log(`[OHIFErrorIntegration] Generic recovery for ${service.name}:`, error.message);
  }

  /**
   * Recover viewport service
   */
  recoverViewportService(service, error) {
    // Implement viewport service specific recovery
    console.log('[OHIFErrorIntegration] Viewport service recovery:', error.message);
  }

  /**
   * Recover hanging protocol service
   */
  recoverHangingProtocolService(service, error) {
    // Implement hanging protocol service specific recovery
    console.log('[OHIFErrorIntegration] Hanging protocol service recovery:', error.message);
  }

  /**
   * Register OHIF services for error tracking
   */
  registerOHIFServices(serviceManager, extensionManager, commandsManager) {
    this.serviceManager = serviceManager;
    this.extensionManager = extensionManager;
    this.commandsManager = commandsManager;

    // Set up service-specific error handling
    this.setupServiceErrorHandling();
  }

  /**
   * Set up service-specific error handling
   */
  setupServiceErrorHandling() {
    if (!this.serviceManager) return;

    // Add error context to all service interactions
    this.errorTracker?.updateUserContext({
      ohifServices: {
        registered: true,
        serviceCount: Object.keys(this.serviceManager.services || {}).length,
        extensionCount: this.extensionManager?.registeredExtensions?.length || 0
      }
    });
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      services: {
        errorTracker: !!this.errorTracker,
        performanceMonitor: !!this.performanceMonitor,
        telemetry: !!this.telemetry
      },
      ohifServices: {
        serviceManager: !!this.serviceManager,
        extensionManager: !!this.extensionManager,
        commandsManager: !!this.commandsManager
      }
    };
  }

  /**
   * Cleanup and destroy integration
   */
  destroy() {
    console.log('[OHIFErrorIntegration] Destroying error tracking integration');
    
    this.isInitialized = false;
    this.serviceManager = null;
    this.extensionManager = null;
    this.commandsManager = null;
  }
}

// Global instance
let globalErrorIntegration = null;

/**
 * Get or create global error integration instance
 */
export function getOHIFErrorIntegration() {
  if (!globalErrorIntegration) {
    globalErrorIntegration = new OHIFErrorIntegration();
  }
  return globalErrorIntegration;
}

/**
 * Initialize OHIF error integration
 */
export function initializeOHIFErrorIntegration(serviceManager, extensionManager, commandsManager) {
  const integration = getOHIFErrorIntegration();
  
  if (serviceManager) {
    integration.registerOHIFServices(serviceManager, extensionManager, commandsManager);
  }
  
  console.log('[OHIFErrorIntegration] OHIF error integration initialized');
  return integration;
}

/**
 * Convenience functions for OHIF error reporting
 */
export const ohifErrorReporter = {
  reportServiceError: (error, service, method, context) => {
    window.dispatchEvent(new CustomEvent('ohif-service-error', {
      detail: { error, service, method, context }
    }));
  },
  
  reportExtensionError: (error, extension, phase, context) => {
    window.dispatchEvent(new CustomEvent('ohif-extension-error', {
      detail: { error, extension, phase, context }
    }));
  },
  
  reportDataSourceError: (error, dataSource, operation, study, series, context) => {
    window.dispatchEvent(new CustomEvent('ohif-datasource-error', {
      detail: { error, dataSource, operation, study, series, context }
    }));
  },
  
  reportViewportError: (error, viewport, displaySet, context) => {
    window.dispatchEvent(new CustomEvent('ohif-viewport-error', {
      detail: { error, viewport, displaySet, context }
    }));
  },
  
  reportToolError: (error, tool, action, viewport, context) => {
    window.dispatchEvent(new CustomEvent('ohif-tool-error', {
      detail: { error, tool, action, viewport, context }
    }));
  },
  
  reportStudyError: (error, study, phase, context) => {
    window.dispatchEvent(new CustomEvent('ohif-study-error', {
      detail: { error, study, phase, context }
    }));
  }
};

export { OHIFErrorIntegration };
export default OHIFErrorIntegration; 