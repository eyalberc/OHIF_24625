import { useEffect, useRef, useCallback } from 'react';
import { getPerformanceMonitor } from '../services/PerformanceMonitoringService';

/**
 * Performance Monitoring React Hooks - OHIF v3 Enhanced System
 * 
 * Task 10.2: Performance Monitoring Infrastructure Setup
 * 
 * HOOKS PROVIDED:
 * - usePerformanceMonitoring: Main hook for performance monitoring
 * - useStudyLoadPerformance: Hook for monitoring study loading performance
 * - useToolPerformance: Hook for monitoring tool activation performance
 * - useViewportPerformance: Hook for monitoring viewport manipulation performance
 * - useComponentPerformance: Generic hook for component performance tracking
 */

/**
 * Main performance monitoring hook
 */
export function usePerformanceMonitoring(enabled = true) {
  const performanceMonitor = useRef(null);

  useEffect(() => {
    if (enabled) {
      performanceMonitor.current = getPerformanceMonitor();
    }
  }, [enabled]);

  const createMark = useCallback((name, detail = {}) => {
    if (performanceMonitor.current) {
      performanceMonitor.current.createPerformanceMark(name, detail);
    }
  }, []);

  const createMeasure = useCallback((name, startMark, endMark = null) => {
    if (performanceMonitor.current) {
      return performanceMonitor.current.createPerformanceMeasure(name, startMark, endMark);
    }
    return null;
  }, []);

  const recordMetric = useCallback((category, data) => {
    if (performanceMonitor.current) {
      performanceMonitor.current.recordMetric(category, data);
    }
  }, []);

  const recordUserInteraction = useCallback((type, data) => {
    if (performanceMonitor.current) {
      performanceMonitor.current.recordUserInteraction(type, data);
    }
  }, []);

  const getPerformanceSummary = useCallback(() => {
    if (performanceMonitor.current) {
      return performanceMonitor.current.getPerformanceSummary();
    }
    return {};
  }, []);

  return {
    createMark,
    createMeasure,
    recordMetric,
    recordUserInteraction,
    getPerformanceSummary,
    monitor: performanceMonitor.current
  };
}

/**
 * Hook for monitoring study loading performance
 */
export function useStudyLoadPerformance() {
  const { monitor } = usePerformanceMonitoring();

  const startStudyLoad = useCallback((studyInstanceUID) => {
    if (monitor) {
      return monitor.instrumentStudyLoading(studyInstanceUID);
    }
    return { start: () => {}, end: () => {} };
  }, [monitor]);

  return { startStudyLoad };
}

/**
 * Hook for monitoring tool activation performance
 */
export function useToolPerformance() {
  const { monitor } = usePerformanceMonitoring();

  const startToolActivation = useCallback((toolName) => {
    if (monitor) {
      return monitor.instrumentToolActivation(toolName);
    }
    return { start: () => {}, end: () => {} };
  }, [monitor]);

  return { startToolActivation };
}

/**
 * Hook for monitoring viewport manipulation performance
 */
export function useViewportPerformance() {
  const { monitor } = usePerformanceMonitoring();

  const startViewportOperation = useCallback((viewportId, operation) => {
    if (monitor) {
      return monitor.instrumentViewportManipulation(viewportId, operation);
    }
    return { start: () => {}, end: () => {} };
  }, [monitor]);

  return { startViewportOperation };
}

/**
 * Generic hook for component performance tracking
 */
export function useComponentPerformance(componentName, enabled = true) {
  const { createMark, createMeasure, recordMetric } = usePerformanceMonitoring(enabled);
  const renderStartTime = useRef(null);
  const mountStartTime = useRef(null);

  useEffect(() => {
    if (enabled) {
      // Component mount tracking
      mountStartTime.current = performance.now();
      createMark(${componentName}-mount-start);
      
      return () => {
        // Component unmount tracking
        createMark(${componentName}-mount-end);
        const mountDuration = createMeasure(
          ${componentName}-mount,
          ohif--mount-start,
          ohif--mount-end
        );
        
        if (mountDuration) {
          recordMetric('component-lifecycle', {
            component: componentName,
            type: 'mount',
            duration: mountDuration,
            timestamp: Date.now()
          });
        }
      };
    }
  }, [componentName, enabled, createMark, createMeasure, recordMetric]);

  const startRender = useCallback(() => {
    if (enabled) {
      renderStartTime.current = performance.now();
      createMark(${componentName}-render-start);
    }
  }, [componentName, enabled, createMark]);

  const endRender = useCallback(() => {
    if (enabled && renderStartTime.current) {
      createMark(${componentName}-render-end);
      const renderDuration = createMeasure(
        ${componentName}-render,
        ohif--render-start,
        ohif--render-end
      );
      
      if (renderDuration) {
        recordMetric('component-render', {
          component: componentName,
          duration: renderDuration,
          timestamp: Date.now()
        });
      }
      
      renderStartTime.current = null;
    }
  }, [componentName, enabled, createMark, createMeasure, recordMetric]);

  const trackInteraction = useCallback((interactionType, data = {}) => {
    if (enabled) {
      recordMetric('component-interaction', {
        component: componentName,
        interactionType,
        ...data,
        timestamp: Date.now()
      });
    }
  }, [componentName, enabled, recordMetric]);

  return {
    startRender,
    endRender,
    trackInteraction
  };
}

/**
 * Hook for tracking async operation performance
 */
export function useAsyncOperationPerformance() {
  const { createMark, createMeasure, recordMetric } = usePerformanceMonitoring();

  const trackAsyncOperation = useCallback(async (operationName, asyncFn, category = 'async-operation') => {
    const startTime = performance.now();
    createMark(${operationName}-start);
    
    try {
      const result = await asyncFn();
      
      createMark(${operationName}-end);
      const duration = createMeasure(
        operationName,
        ohif--start,
        ohif--end
      );
      
      if (duration) {
        recordMetric(category, {
          operation: operationName,
          duration,
          success: true,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      createMark(${operationName}-error);
      const duration = performance.now() - startTime;
      
      recordMetric(category, {
        operation: operationName,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }, [createMark, createMeasure, recordMetric]);

  return { trackAsyncOperation };
}

/**
 * Hook for monitoring network requests performance
 */
export function useNetworkPerformance() {
  const { recordMetric } = usePerformanceMonitoring();

  const trackNetworkRequest = useCallback((url, options = {}) => {
    const startTime = performance.now();
    
    return {
      onResponse: (response) => {
        const duration = performance.now() - startTime;
        recordMetric('network-request', {
          url,
          method: options.method || 'GET',
          status: response.status,
          duration,
          success: response.ok,
          timestamp: Date.now()
        });
      },
      onError: (error) => {
        const duration = performance.now() - startTime;
        recordMetric('network-request', {
          url,
          method: options.method || 'GET',
          duration,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    };
  }, [recordMetric]);

  return { trackNetworkRequest };
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitoring(intervalMs = 5000) {
  const { recordMetric } = usePerformanceMonitoring();

  useEffect(() => {
    if (!performance.memory) return;

    const interval = setInterval(() => {
      const memoryInfo = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      recordMetric('memory-usage', memoryInfo);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, recordMetric]);
}

/**
 * Higher-order component for automatic performance tracking
 */
export function withPerformanceTracking(WrappedComponent, componentName) {
  return function PerformanceTrackedComponent(props) {
    const { startRender, endRender, trackInteraction } = useComponentPerformance(componentName);

    useEffect(() => {
      startRender();
      endRender();
    });

    const enhancedProps = {
      ...props,
      trackInteraction
    };

    return React.createElement(WrappedComponent, enhancedProps);
  };
}

export default {
  usePerformanceMonitoring,
  useStudyLoadPerformance,
  useToolPerformance,
  useViewportPerformance,
  useComponentPerformance,
  useAsyncOperationPerformance,
  useNetworkPerformance,
  useMemoryMonitoring,
  withPerformanceTracking
};
