/**
 * Enhanced Error Boundary Component - OHIF v3 Enhanced System
 * 
 * Task 10.4: Error Tracking and Logging Implementation
 * 
 * FEATURES IMPLEMENTED:
 * - React error boundary with recovery mechanisms
 * - Integration with ErrorTrackingService for centralized logging
 * - Graceful degradation with fallback UI components
 * - User-friendly error reporting and recovery options
 * - Component isolation to prevent cascade failures
 * - Development vs production error display modes
 * - Error context preservation for debugging
 */

import React from 'react';
import { getErrorTracker, ERROR_SEVERITY, ERROR_CATEGORIES, COMPONENT_TYPES } from '../services/ErrorTrackingService';

/**
 * Enhanced Error Boundary with comprehensive error handling
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false,
      retryCount: 0,
      lastErrorTime: null
    };

    this.errorTracker = null;
    this.maxRetries = props.maxRetries || 3;
    this.retryDelay = props.retryDelay || 1000;
    this.componentType = props.componentType || COMPONENT_TYPES.UNKNOWN;
    this.fallbackComponent = props.fallbackComponent;
    this.onError = props.onError;
    this.enableRecovery = props.enableRecovery !== false;
    this.isolateErrors = props.isolateErrors !== false;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Initialize error tracker if not already done
    if (!this.errorTracker) {
      try {
        this.errorTracker = getErrorTracker();
      } catch (err) {
        console.error('[ErrorBoundary] Failed to initialize error tracker:', err);
      }
    }

    // Capture error with enhanced context
    const errorId = this.captureErrorWithContext(error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId,
      hasError: true
    });

    // Call custom error handler if provided
    if (this.onError) {
      try {
        this.onError(error, errorInfo, errorId);
      } catch (handlerError) {
        console.error('[ErrorBoundary] Error in custom error handler:', handlerError);
      }
    }

    // Emit error event for parent components or global handlers
    this.emitErrorEvent(error, errorInfo, errorId);
  }

  /**
   * Capture error with comprehensive context
   */
  captureErrorWithContext(error, errorInfo) {
    if (!this.errorTracker) return null;

    const context = {
      componentStack: errorInfo.componentStack,
      componentType: this.componentType,
      props: this.sanitizeProps(this.props),
      state: this.sanitizeState(this.state),
      retryCount: this.state.retryCount,
      isolationEnabled: this.isolateErrors,
      recoveryEnabled: this.enableRecovery,
      parentComponent: this.props.parentComponent || 'unknown',
      timestamp: Date.now()
    };

    // Add component-specific context based on type
    switch (this.componentType) {
      case COMPONENT_TYPES.VIEWPORT:
        context.viewportInfo = this.extractViewportContext();
        break;
      case COMPONENT_TYPES.TOOLBAR:
        context.toolbarInfo = this.extractToolbarContext();
        break;
      case COMPONENT_TYPES.PANEL:
        context.panelInfo = this.extractPanelContext();
        break;
    }

    return this.errorTracker.captureError(error, {
      category: this.categorizeComponentError(error),
      severity: this.determineSeverity(error),
      component: this.componentType,
      context,
      tags: [`boundary-${this.componentType}`, `retry-${this.state.retryCount}`]
    });
  }

  /**
   * Categorize error based on component type and error message
   */
  categorizeComponentError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('render') || message.includes('hook')) {
      return ERROR_CATEGORIES.RENDERING;
    }
    
    if (message.includes('memory') || message.includes('maximum')) {
      return ERROR_CATEGORIES.MEMORY;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_CATEGORIES.NETWORK;
    }
    
    if (this.componentType === COMPONENT_TYPES.VIEWPORT) {
      return ERROR_CATEGORIES.RENDERING;
    }
    
    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Determine error severity based on component type and context
   */
  determineSeverity(error) {
    // Critical errors that should halt the application
    if (error.message?.includes('security') || error.message?.includes('unauthorized')) {
      return ERROR_SEVERITY.CRITICAL;
    }
    
    // High severity for core components
    if ([COMPONENT_TYPES.CORE, COMPONENT_TYPES.VIEWPORT].includes(this.componentType)) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // Medium severity for UI components
    if ([COMPONENT_TYPES.TOOLBAR, COMPONENT_TYPES.PANEL].includes(this.componentType)) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    // Low severity for non-critical components
    return ERROR_SEVERITY.LOW;
  }

  /**
   * Extract viewport-specific context
   */
  extractViewportContext() {
    return {
      viewportId: this.props.viewportId,
      displaySetInstanceUID: this.props.displaySetInstanceUID,
      studyInstanceUID: this.props.studyInstanceUID,
      seriesInstanceUID: this.props.seriesInstanceUID,
      imageIndex: this.props.imageIndex,
      renderingEngine: this.props.renderingEngine?.id,
      viewport: {
        element: this.props.element?.tagName,
        dimensions: this.props.element ? {
          width: this.props.element.clientWidth,
          height: this.props.element.clientHeight
        } : null
      }
    };
  }

  /**
   * Extract toolbar-specific context
   */
  extractToolbarContext() {
    return {
      toolbarId: this.props.toolbarId,
      activeTools: this.props.activeTools,
      availableTools: this.props.availableTools,
      toolGroups: this.props.toolGroups,
      mode: this.props.mode
    };
  }

  /**
   * Extract panel-specific context
   */
  extractPanelContext() {
    return {
      panelId: this.props.panelId,
      panelType: this.props.panelType,
      isOpen: this.props.isOpen,
      data: this.props.data ? Object.keys(this.props.data) : null
    };
  }

  /**
   * Sanitize props for safe logging
   */
  sanitizeProps(props) {
    const sanitized = { ...props };
    
    // Remove potentially sensitive or large data
    delete sanitized.children;
    delete sanitized.onError;
    delete sanitized.fallbackComponent;
    
    // Sanitize functions
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'function') {
        sanitized[key] = '[Function]';
      } else if (sanitized[key] && typeof sanitized[key] === 'object') {
        // Limit nested object depth
        sanitized[key] = '[Object]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize state for safe logging
   */
  sanitizeState(state) {
    const sanitized = { ...state };
    
    // Remove error object to prevent circular references
    if (sanitized.error) {
      sanitized.error = {
        name: sanitized.error.name,
        message: sanitized.error.message
      };
    }
    
    return sanitized;
  }

  /**
   * Emit error event for global handling
   */
  emitErrorEvent(error, errorInfo, errorId) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ohif-react-error', {
        detail: {
          error,
          componentStack: errorInfo.componentStack,
          errorBoundary: this.componentType,
          errorId,
          component: this.componentType,
          timestamp: Date.now()
        }
      }));
    }
  }

  /**
   * Attempt to recover from error
   */
  handleRecovery = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.warn(`[ErrorBoundary] Max retries (${this.maxRetries}) reached for ${this.componentType}`);
      return;
    }

    this.setState({ isRecovering: true });

    // Add recovery breadcrumb
    if (this.errorTracker) {
      this.errorTracker.addBreadcrumb({
        type: 'recovery',
        message: `Attempting recovery for ${this.componentType}`,
        context: {
          retryCount: retryCount + 1,
          errorId: this.state.errorId
        }
      });
    }

    // Delay recovery attempt
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false,
        retryCount: retryCount + 1
      });
    }, this.retryDelay);
  };

  /**
   * Report error to external service
   */
  handleReportError = () => {
    if (this.errorTracker && this.state.errorId) {
      const errorData = this.errorTracker.exportErrorData({
        fromTimestamp: this.state.lastErrorTime - 60000, // Include 1 minute of context
        toTimestamp: this.state.lastErrorTime + 5000
      });
      
      // Log the error report
      console.log('[ErrorBoundary] Error report generated:', errorData);
      
      // Add breadcrumb for error reporting
      this.errorTracker.addBreadcrumb({
        type: 'user-action',
        message: 'User reported error',
        context: {
          errorId: this.state.errorId,
          componentType: this.componentType
        }
      });
    }
  };

  /**
   * Render fallback UI based on error state
   */
  renderFallbackUI() {
    const { hasError, error, isRecovering, retryCount } = this.state;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Show loading state during recovery
    if (isRecovering) {
      return (
        <div className="error-boundary-recovery">
          <div className="error-boundary-spinner" />
          <p>Recovering component...</p>
        </div>
      );
    }

    // Use custom fallback component if provided
    if (this.fallbackComponent) {
      const FallbackComponent = this.fallbackComponent;
      return (
        <FallbackComponent
          error={error}
          errorInfo={this.state.errorInfo}
          retry={this.enableRecovery ? this.handleRecovery : null}
          canRetry={retryCount < this.maxRetries}
          retryCount={retryCount}
        />
      );
    }

    // Default fallback UI
    return (
      <div className="error-boundary-fallback">
        <div className="error-boundary-content">
          <h3 className="error-boundary-title">
            {this.componentType === COMPONENT_TYPES.VIEWPORT ? 
              'Viewport Error' : 
              'Component Error'
            }
          </h3>
          
          <p className="error-boundary-message">
            {isDevelopment ? 
              error?.message || 'An error occurred in this component' :
              'Something went wrong. The component failed to load properly.'
            }
          </p>

          {isDevelopment && (
            <details className="error-boundary-details">
              <summary>Error Details (Development)</summary>
              <pre className="error-boundary-stack">
                {error?.stack}
              </pre>
              {this.state.errorInfo && (
                <pre className="error-boundary-component-stack">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}

          <div className="error-boundary-actions">
            {this.enableRecovery && retryCount < this.maxRetries && (
              <button 
                className="error-boundary-retry"
                onClick={this.handleRecovery}
              >
                Try Again ({this.maxRetries - retryCount} attempts left)
              </button>
            )}
            
            <button 
              className="error-boundary-report"
              onClick={this.handleReportError}
            >
              Report Error
            </button>
          </div>

          {retryCount >= this.maxRetries && (
            <p className="error-boundary-max-retries">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </p>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    // Wrap children in error isolation if enabled
    if (this.isolateErrors) {
      return (
        <div className="error-boundary-isolation">
          {this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for easy error boundary wrapping
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const WithErrorBoundaryComponent = (props) => (
    <ErrorBoundary
      componentType={options.componentType || COMPONENT_TYPES.UNKNOWN}
      fallbackComponent={options.fallbackComponent}
      maxRetries={options.maxRetries}
      enableRecovery={options.enableRecovery}
      isolateErrors={options.isolateErrors}
      onError={options.onError}
      parentComponent={WrappedComponent.displayName || WrappedComponent.name}
      {...options.boundaryProps}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundaryComponent;
};

/**
 * Hook for error reporting within functional components
 */
export const useErrorReporting = (componentType = COMPONENT_TYPES.UNKNOWN) => {
  const errorTracker = React.useMemo(() => {
    try {
      return getErrorTracker();
    } catch (error) {
      console.warn('[useErrorReporting] Failed to initialize error tracker:', error);
      return null;
    }
  }, []);

  const reportError = React.useCallback((error, context = {}) => {
    if (!errorTracker) return null;

    return errorTracker.captureError(error, {
      category: ERROR_CATEGORIES.USER_ACTION,
      severity: ERROR_SEVERITY.MEDIUM,
      component: componentType,
      context: {
        ...context,
        source: 'useErrorReporting-hook',
        timestamp: Date.now()
      }
    });
  }, [errorTracker, componentType]);

  const addBreadcrumb = React.useCallback((breadcrumb) => {
    if (!errorTracker) return;
    errorTracker.addBreadcrumb(breadcrumb);
  }, [errorTracker]);

  const updateContext = React.useCallback((context) => {
    if (!errorTracker) return;
    errorTracker.updateUserContext(context);
  }, [errorTracker]);

  return {
    reportError,
    addBreadcrumb,
    updateContext,
    isEnabled: !!errorTracker
  };
};

/**
 * Specialized error boundaries for different component types
 */
export const ViewportErrorBoundary = (props) => (
  <ErrorBoundary
    componentType={COMPONENT_TYPES.VIEWPORT}
    enableRecovery={true}
    maxRetries={2}
    {...props}
  />
);

export const ToolbarErrorBoundary = (props) => (
  <ErrorBoundary
    componentType={COMPONENT_TYPES.TOOLBAR}
    enableRecovery={true}
    maxRetries={3}
    {...props}
  />
);

export const PanelErrorBoundary = (props) => (
  <ErrorBoundary
    componentType={COMPONENT_TYPES.PANEL}
    enableRecovery={true}
    maxRetries={5}
    isolateErrors={true}
    {...props}
  />
);

export const ServiceErrorBoundary = (props) => (
  <ErrorBoundary
    componentType={COMPONENT_TYPES.SERVICE}
    enableRecovery={false}
    maxRetries={1}
    {...props}
  />
);

export default ErrorBoundary; 