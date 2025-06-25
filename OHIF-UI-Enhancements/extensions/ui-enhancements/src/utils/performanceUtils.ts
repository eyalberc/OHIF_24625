/**
 * Performance Utilities for Hanging Protocol Editor
 * 
 * Provides tools for monitoring, profiling, and optimizing component performance.
 * Task 5.7: Optimize Editor Performance
 */

import React, { useRef, useEffect, useMemo } from 'react';

// Performance tracking interface
interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  renderCount: number;
  lastRender: number;
  averageRenderTime: number;
}

// Global performance store
const performanceStore = new Map<string, PerformanceMetrics>();

/**
 * Hook for tracking component render performance
 * Measures render time and tracks render frequency
 */
export const usePerformanceTracker = (componentName: string) => {
  const renderStartTime = useRef<number>(performance.now());
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;
    totalRenderTime.current += renderTime;

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      renderCount: renderCount.current,
      lastRender: performance.now(),
      averageRenderTime: totalRenderTime.current / renderCount.current
    };

    performanceStore.set(componentName, metrics);

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  // Reset start time for next render
  renderStartTime.current = performance.now();

  return {
    getMetrics: () => performanceStore.get(componentName),
    getAllMetrics: () => Array.from(performanceStore.values())
  };
};

/**
 * Debounce hook for performance optimization
 * Delays execution of expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Memoized validation cache hook
 * Caches validation results to avoid expensive re-validation
 */
export const useValidationCache = <T, R>(
  data: T,
  validator: (data: T) => R,
  cacheKey?: string
) => {
  const cache = useRef(new Map<string, { data: T; result: R; timestamp: number }>());
  
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(data);
    const cached = cache.current.get(key);
    const now = Date.now();
    
    // Cache is valid for 5 seconds
    if (cached && (now - cached.timestamp) < 5000 && JSON.stringify(cached.data) === JSON.stringify(data)) {
      return cached.result;
    }
    
    const result = validator(data);
    cache.current.set(key, { data, result, timestamp: now });
    
    // Cleanup old cache entries (keep last 10)
    if (cache.current.size > 10) {
      const entries = Array.from(cache.current.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.current.clear();
      entries.slice(0, 10).forEach(([k, v]) => cache.current.set(k, v));
    }
    
    return result;
  }, [data, validator, cacheKey]);
};

/**
 * Virtual list hook for large datasets
 * Renders only visible items to improve performance
 */
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

/**
 * Efficient state updater hook
 * Batches state updates to reduce re-renders
 */
export const useBatchedState = <T>(
  initialState: T,
  batchDelay: number = 50
) => {
  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchedSetState = React.useCallback((updates: Partial<T>) => {
    pendingUpdates.current.push(updates);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const finalUpdate = pendingUpdates.current.reduce(
        (acc, update) => ({ ...acc, ...update }),
        {} as Partial<T>
      );

      setState(prevState => ({ ...prevState, ...finalUpdate }));
      pendingUpdates.current = [];
      timeoutRef.current = null;
    }, batchDelay);
  }, [batchDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState] as const;
};

/**
 * Memory leak detection hook for development
 * Monitors component mount/unmount cycles
 */
export const useMemoryLeakDetection = (componentName: string) => {
  const mountTime = useRef(Date.now());
  const eventListeners = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} mounted at ${new Date(mountTime.current).toISOString()}`);
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        const lifespan = Date.now() - mountTime.current;
        console.log(`${componentName} unmounted after ${lifespan}ms`);
        
        if (eventListeners.current.size > 0) {
          console.warn(`${componentName} has potential memory leaks:`, Array.from(eventListeners.current));
        }
      }
    };
  }, [componentName]);

  const addEventListener = React.useCallback((eventType: string) => {
    eventListeners.current.add(eventType);
  }, []);

  const removeEventListener = React.useCallback((eventType: string) => {
    eventListeners.current.delete(eventType);
  }, []);

  return { addEventListener, removeEventListener };
};

/**
 * Performance optimization wrapper component
 * Adds performance monitoring to any component
 */
export const withPerformanceMonitoring = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> => {
  const WrappedComponent = React.memo<P>((props) => {
    const { getMetrics } = usePerformanceTracker(componentName);
    
    if (process.env.NODE_ENV === 'development') {
      useMemoryLeakDetection(componentName);
    }

    return <Component {...props} />;
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
};

/**
 * Performance metrics reporter
 * Provides debugging information about component performance
 */
export const getPerformanceReport = (): string => {
  const metrics = Array.from(performanceStore.values());
  
  if (metrics.length === 0) {
    return 'No performance data available';
  }

  const report = metrics
    .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
    .map(metric => (
      `${metric.componentName}:\n` +
      `  Renders: ${metric.renderCount}\n` +
      `  Avg Time: ${metric.averageRenderTime.toFixed(2)}ms\n` +
      `  Last Render: ${metric.renderTime.toFixed(2)}ms\n`
    ))
    .join('\n');

  return `Performance Report:\n\n${report}`;
};

/**
 * Clear performance data
 * Useful for resetting metrics during testing
 */
export const clearPerformanceData = (): void => {
  performanceStore.clear();
}; 