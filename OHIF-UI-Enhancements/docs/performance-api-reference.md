# Performance Monitoring API Reference

## Overview

This document provides detailed API reference for the OHIF v3 Performance Monitoring system components.

## Core Services APIs

### PerformanceMonitoringService

#### Methods

##### `getPerformanceMonitor(): PerformanceMonitoringService`
Returns the singleton instance of the performance monitoring service.

```typescript
import { getPerformanceMonitor } from './services/PerformanceMonitoringService';
const monitor = getPerformanceMonitor();
```

##### `startStudyLoadTracking(studyId: string): string`
Begins tracking study load performance. Returns a tracking ID.

**Parameters:**
- `studyId` (string): Unique identifier for the study

**Returns:** string - Tracking ID for the operation

##### `completeStudyLoadTracking(trackingId: string, context: StudyContext): void`
Completes study load tracking with additional context.

##### `getPerformanceSummary(): PerformanceSummary`
Returns current performance metrics summary.

##### `setPerformanceBudgets(budgets: PerformanceBudgets): void`
Configures performance budgets for different operations.

#### Interfaces

##### StudyContext
```typescript
interface StudyContext {
  studyInstanceUID: string;
  seriesCount: number;
  imageCount: number;
  totalSizeMB?: number;
  modality?: string;
}
```

##### PerformanceSummary
```typescript
interface PerformanceSummary {
  systemInfo: SystemInfo;
  metrics: {
    studyLoad: {
      averageTime: number;
      operationCount: number;
    };
    network: {
      averageLatency: number;
      errorRate: number;
    };
    performance: {
      averageFrameRate: number;
      memoryUsageMB: number;
    };
  };
}
```

### PerformanceBenchmarkService

#### Methods

##### `getPerformanceBenchmark(): PerformanceBenchmarkService`
Returns the singleton instance of the benchmark service.

##### `runBenchmark(scenario: string): Promise<BenchmarkResult>`
Executes a performance benchmark for the specified scenario.

**Parameters:**
- `scenario` (string): Benchmark scenario ('small', 'medium', 'large', 'extraLarge')

**Returns:** Promise<BenchmarkResult>

##### `detectHardwareProfile(): HardwareProfile`
Automatically detects the device hardware capabilities.

**Returns:** HardwareProfile ('low-end' | 'medium-end' | 'high-end')

#### Interfaces

##### BenchmarkResult
```typescript
interface BenchmarkResult {
  scenario: string;
  performanceScore: number;
  budgetCompliance: 'excellent' | 'good' | 'acceptable' | 'poor';
  metrics: {
    studyLoadTime: number;
    memoryUsageMB: number;
    frameRate: number;
    errorCount: number;
  };
  timestamp: number;
  duration: number;
}
```

### ErrorTrackingService

#### Methods

##### `getErrorTracker(): ErrorTrackingService`
Returns the singleton instance of the error tracking service.

##### `reportError(error: Error, context: ErrorContext): void`
Reports an error with contextual information.

**Parameters:**
- `error` (Error): The error object
- `context` (ErrorContext): Additional error context

##### `getErrorStatistics(): ErrorStatistics`
Returns error statistics and trends.

#### Interfaces

##### ErrorContext
```typescript
interface ErrorContext {
  category: 'network' | 'rendering' | 'tool' | 'study-loading' | 'memory';
  severity: 'critical' | 'high' | 'medium' | 'low';
  component?: string;
  context?: Record<string, any>;
}
```

##### ErrorStatistics
```typescript
interface ErrorStatistics {
  total: number;
  lastHour: number;
  last24Hours: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}
```

## React Hooks

### usePerformanceMonitoring

#### `useStudyLoadPerformance()`
Tracks study loading performance in React components.

```typescript
const { startTracking, completeTracking, metrics } = useStudyLoadPerformance();
```

#### `useToolPerformance(toolName: string)`
Tracks tool activation performance.

#### `useMemoryMonitoring()`
Monitors memory usage with alerts.

## Configuration Objects

### PerformanceBudgets
```typescript
interface PerformanceBudgets {
  studyLoad: number;      // milliseconds
  virtualSeries: number;  // milliseconds
  viewportRender: number; // milliseconds
  toolActivation: number; // milliseconds
  memoryLimit: number;    // MB
  frameRate: number;      // FPS
}
```

## Usage Examples

### Basic Monitoring
```typescript
import { getPerformanceMonitor } from './services/PerformanceMonitoringService';

const monitor = getPerformanceMonitor();
const trackingId = monitor.startStudyLoadTracking('study-123');

// Load study...
await loadStudy('study-123');

monitor.completeStudyLoadTracking(trackingId, {
  studyInstanceUID: 'study-123',
  seriesCount: 5,
  imageCount: 120
});
```

### Benchmarking
```typescript
import { getPerformanceBenchmark } from './services/PerformanceBenchmarkService';

const benchmark = getPerformanceBenchmark();
const results = await benchmark.runBenchmark('medium');

console.log('Performance Score:', results.performanceScore);
console.log('Budget Compliance:', results.budgetCompliance);
```

### Error Tracking
```typescript
import { getErrorTracker } from './services/ErrorTrackingService';

const errorTracker = getErrorTracker();

try {
  await loadDicomStudy(studyId);
} catch (error) {
  errorTracker.reportError(error, {
    category: 'study-loading',
    severity: 'critical',
    context: { studyInstanceUID: studyId }
  });
}
```

## Performance Thresholds

| Metric | Low-end Device | Medium-end Device | High-end Device |
|--------|----------------|-------------------|-----------------|
| Study Load Time | 8000ms | 5000ms | 2000ms |
| Virtual Series Load | 3000ms | 2000ms | 1000ms |
| Viewport Render | 500ms | 300ms | 150ms |
| Tool Activation | 800ms | 500ms | 200ms |
| Memory Limit | 512MB | 1024MB | 2048MB |
| Frame Rate Target | 20 FPS | 30 FPS | 60 FPS |

## Error Codes

### Performance Error Codes
- `PERF_001`: Study load timeout
- `PERF_002`: Memory limit exceeded
- `PERF_003`: Frame rate below threshold
- `PERF_004`: Tool activation timeout
- `PERF_005`: Network performance degraded

### Benchmark Error Codes
- `BENCH_001`: Benchmark initialization failed
- `BENCH_002`: Hardware detection failed
- `BENCH_003`: Test scenario not found
- `BENCH_004`: Quality gate violation

## Support

For additional API documentation:
- Check source code documentation
- Review test files for usage examples
- File issues for missing documentation
