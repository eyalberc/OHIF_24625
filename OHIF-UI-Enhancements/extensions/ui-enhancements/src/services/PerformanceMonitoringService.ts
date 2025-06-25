/**
 * Performance Monitoring Service for Hanging Protocol Editor
 * 
 * Provides comprehensive performance tracking, monitoring, and reporting
 * for development and production environments.
 * 
 * Task 5.7: Optimize Editor Performance
 */

import { getPerformanceReport, clearPerformanceData } from '../utils/performanceUtils';

// Performance metrics interfaces
interface ComponentMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  peakRenderTime: number;
  totalRenderTime: number;
  memoryUsage?: number;
  warnings: string[];
}

interface SystemMetrics {
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timestamp: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error';
  componentName: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: Map<string, ComponentMetrics> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  private constructor() {
    // Initialize monitoring in development mode
    if (process.env.NODE_ENV === 'development') {
      this.startMonitoring();
    }
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.collectSystemMetrics();
      this.analyzePerformance();
    }, interval);

    console.log('🔍 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Record component performance metrics
   */
  public recordComponentMetrics(
    componentName: string,
    renderTime: number,
    renderCount: number
  ): void {
    const existing = this.metrics.get(componentName);
    
    if (existing) {
      // Update existing metrics
      const totalTime = existing.totalRenderTime + renderTime;
      const newCount = renderCount;
      
      existing.renderCount = newCount;
      existing.averageRenderTime = totalTime / newCount;
      existing.lastRenderTime = renderTime;
      existing.peakRenderTime = Math.max(existing.peakRenderTime, renderTime);
      existing.totalRenderTime = totalTime;
      
      // Check for performance warnings
      this.checkPerformanceThresholds(componentName, renderTime, existing);
    } else {
      // Create new metrics entry
      this.metrics.set(componentName, {
        componentName,
        renderCount,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        peakRenderTime: renderTime,
        totalRenderTime: renderTime,
        warnings: []
      });
    }
  }

  /**
   * Collect system-level performance metrics
   */
  private collectSystemMetrics(): void {
    if (!('performance' in window) || !('memory' in (performance as any))) {
      return;
    }

    const memory = (performance as any).memory;
    const systemMetric: SystemMetrics = {
      memoryUsage: {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.systemMetrics.push(systemMetric);

    // Keep only last 100 system metrics
    if (this.systemMetrics.length > 100) {
      this.systemMetrics = this.systemMetrics.slice(-100);
    }

    // Update component memory usage
    this.updateComponentMemoryUsage(memory.usedJSHeapSize);
  }

  /**
   * Update memory usage for components
   */
  private updateComponentMemoryUsage(totalMemory: number): void {
    const componentCount = this.metrics.size;
    if (componentCount === 0) return;

    // Rough estimation of memory per component
    const memoryPerComponent = totalMemory / componentCount;

    this.metrics.forEach((metrics) => {
      metrics.memoryUsage = memoryPerComponent;
    });
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkPerformanceThresholds(
    componentName: string,
    renderTime: number,
    metrics: ComponentMetrics
  ): void {
    const alerts: PerformanceAlert[] = [];

    // Slow render threshold (16ms = 60fps)
    if (renderTime > 16) {
      alerts.push({
        id: `slow-render-${componentName}-${Date.now()}`,
        type: 'warning',
        componentName,
        message: `Slow render detected: ${renderTime.toFixed(2)}ms (>16ms)`,
        timestamp: Date.now(),
        severity: renderTime > 32 ? 'high' : 'medium',
        suggestions: [
          'Consider using React.memo for component memoization',
          'Check for expensive computations in render method',
          'Use useMemo for expensive calculations',
          'Implement virtual scrolling for large lists'
        ]
      });
    }

    // Frequent re-render threshold
    if (metrics.renderCount > 50 && metrics.averageRenderTime > 10) {
      alerts.push({
        id: `frequent-renders-${componentName}-${Date.now()}`,
        type: 'warning',
        componentName,
        message: `High render frequency: ${metrics.renderCount} renders, avg ${metrics.averageRenderTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        severity: 'medium',
        suggestions: [
          'Check for unnecessary re-renders caused by prop changes',
          'Use useCallback for event handlers',
          'Consider lifting state up or using context',
          'Implement proper dependency arrays in useEffect'
        ]
      });
    }

    // Add alerts to the collection
    alerts.forEach(alert => {
      this.alerts.push(alert);
      metrics.warnings.push(alert.message);
      
      // Notify subscribers
      this.alertCallbacks.forEach(callback => callback(alert));
    });

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * Analyze overall performance and generate insights
   */
  private analyzePerformance(): void {
    const components = Array.from(this.metrics.values());
    
    // Find slowest components
    const slowComponents = components
      .filter(c => c.averageRenderTime > 10)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);

    if (slowComponents.length > 0 && process.env.NODE_ENV === 'development') {
      console.group('⚠️ Performance Analysis');
      console.log('Slow components detected:');
      slowComponents.forEach(component => {
        console.log(`- ${component.componentName}: ${component.averageRenderTime.toFixed(2)}ms avg`);
      });
      console.groupEnd();
    }
  }

  /**
   * Subscribe to performance alerts
   */
  public onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get performance summary for a specific component
   */
  public getComponentSummary(componentName: string): ComponentMetrics | null {
    return this.metrics.get(componentName) || null;
  }

  /**
   * Get performance summary for all components
   */
  public getAllComponentSummaries(): ComponentMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get system performance metrics
   */
  public getSystemMetrics(): SystemMetrics[] {
    return [...this.systemMetrics];
  }

  /**
   * Get recent performance alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear all alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Generate comprehensive performance report
   */
  public generateReport(): string {
    const components = this.getAllComponentSummaries();
    const systemMetrics = this.getSystemMetrics();
    const alerts = this.getAlerts();

    let report = '📊 HANGING PROTOCOL EDITOR PERFORMANCE REPORT\n';
    report += '=' .repeat(60) + '\n\n';

    // Component Performance
    report += '🔧 COMPONENT PERFORMANCE:\n';
    if (components.length === 0) {
      report += 'No component metrics available\n\n';
    } else {
      const sortedComponents = components.sort((a, b) => b.averageRenderTime - a.averageRenderTime);
      
      sortedComponents.forEach(component => {
        report += `\n📦 ${component.componentName}:\n`;
        report += `   Renders: ${component.renderCount}\n`;
        report += `   Avg Time: ${component.averageRenderTime.toFixed(2)}ms\n`;
        report += `   Peak Time: ${component.peakRenderTime.toFixed(2)}ms\n`;
        report += `   Last Render: ${component.lastRenderTime.toFixed(2)}ms\n`;
        
        if (component.memoryUsage) {
          report += `   Memory: ${(component.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
        }
        
        if (component.warnings.length > 0) {
          report += `   ⚠️ Warnings: ${component.warnings.length}\n`;
        }
      });
      
      report += '\n';
    }

    // System Performance
    if (systemMetrics.length > 0) {
      const latestMetrics = systemMetrics[systemMetrics.length - 1];
      report += '💻 SYSTEM PERFORMANCE:\n';
      report += `   Memory Used: ${(latestMetrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB\n`;
      report += `   Memory Total: ${(latestMetrics.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB\n`;
      report += `   Memory Limit: ${(latestMetrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB\n`;
      report += `   Viewport: ${latestMetrics.viewport.width}x${latestMetrics.viewport.height}\n\n`;
    }

    // Performance Alerts
    if (alerts.length > 0) {
      report += '🚨 PERFORMANCE ALERTS:\n';
      const recentAlerts = alerts.slice(-10); // Show last 10 alerts
      
      recentAlerts.forEach(alert => {
        const time = new Date(alert.timestamp).toLocaleTimeString();
        report += `\n${alert.severity.toUpperCase()} [${time}] ${alert.componentName}:\n`;
        report += `   ${alert.message}\n`;
        
        if (alert.suggestions.length > 0) {
          report += '   Suggestions:\n';
          alert.suggestions.forEach(suggestion => {
            report += `   - ${suggestion}\n`;
          });
        }
      });
      
      report += '\n';
    }

    // Performance Tips
    report += '💡 OPTIMIZATION TIPS:\n';
    report += '- Use React.memo for components that don\'t change often\n';
    report += '- Implement useCallback for event handlers\n';
    report += '- Use useMemo for expensive calculations\n';
    report += '- Consider virtual scrolling for large lists\n';
    report += '- Monitor component re-render frequency\n';
    report += '- Profile memory usage regularly\n\n';

    report += `Report generated: ${new Date().toLocaleString()}\n`;
    
    return report;
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    components: ComponentMetrics[];
    systemMetrics: SystemMetrics[];
    alerts: PerformanceAlert[];
    timestamp: number;
  } {
    return {
      components: this.getAllComponentSummaries(),
      systemMetrics: this.getSystemMetrics(),
      alerts: this.getAlerts(),
      timestamp: Date.now()
    };
  }

  /**
   * Reset all performance data
   */
  public reset(): void {
    this.metrics.clear();
    this.systemMetrics = [];
    this.alerts = [];
    clearPerformanceData();
    
    console.log('🔄 Performance data reset');
  }

  /**
   * Get performance optimization suggestions based on current data
   */
  public getOptimizationSuggestions(): string[] {
    const components = this.getAllComponentSummaries();
    const suggestions: string[] = [];

    // Analyze component performance
    components.forEach(component => {
      if (component.averageRenderTime > 16) {
        suggestions.push(`Consider optimizing ${component.componentName} - slow renders detected`);
      }
      
      if (component.renderCount > 100 && component.averageRenderTime > 5) {
        suggestions.push(`${component.componentName} renders frequently - check for unnecessary re-renders`);
      }
    });

    // Memory suggestions
    const latestSystemMetrics = this.systemMetrics[this.systemMetrics.length - 1];
    if (latestSystemMetrics) {
      const memoryUsagePercent = 
        (latestSystemMetrics.memoryUsage.usedJSHeapSize / latestSystemMetrics.memoryUsage.jsHeapSizeLimit) * 100;
      
      if (memoryUsagePercent > 70) {
        suggestions.push('High memory usage detected - consider implementing memory optimizations');
      }
    }

    // General suggestions
    if (suggestions.length === 0) {
      suggestions.push('Performance looks good! Consider implementing virtual scrolling for future scalability');
    }

    return suggestions;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();

// Global performance debugging helpers for development
if (process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
  (window as any).getPerformanceReport = () => performanceMonitor.generateReport();
  (window as any).logPerformanceData = () => console.log(performanceMonitor.exportData());
} 