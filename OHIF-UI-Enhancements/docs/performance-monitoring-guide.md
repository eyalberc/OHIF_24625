# OHIF v3 Performance Monitoring Guide

## Overview

This guide documents the comprehensive performance monitoring system implemented for OHIF v3 Viewer UI/UX enhancements. The system provides real-time performance tracking, automated benchmarking, quality gates, and CI/CD integration to ensure optimal performance for medical imaging workflows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Performance Monitoring Services](#performance-monitoring-services)
3. [Benchmarking System](#benchmarking-system)
4. [Error Tracking](#error-tracking)
5. [Monitoring Dashboard](#monitoring-dashboard)
6. [CI/CD Integration](#cicd-integration)
7. [Configuration Guide](#configuration-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The performance monitoring system consists of several interconnected components:

### Core Services

- **PerformanceMonitoringService**: Real-time system monitoring and metrics collection
- **PerformanceBenchmarkService**: Automated performance testing and scoring
- **ErrorTrackingService**: Centralized error collection and analysis
- **CICDPerformanceIntegration**: Automated CI/CD pipeline integration

### Optimization Components

- **VirtualSeriesDataSource**: Optimized data loading with caching and progressive loading
- **StudyComparisonOptimizer**: GPU-accelerated study comparison with parallel processing

## Performance Monitoring Services

### Key Metrics Tracked

#### System Metrics
- **Memory Usage**: Heap size, memory pressure, garbage collection
- **Frame Rate**: Rendering performance, viewport updates  
- **Network Performance**: Latency, throughput, connection quality
- **CPU Usage**: Processing load, worker utilization

#### Medical Imaging Specific Metrics
- **Study Load Time**: DICOM parsing, image decoding, viewport rendering
- **Tool Activation**: Measurement tools, annotations, window/level
- **Viewport Operations**: Pan, zoom, scroll, layout changes
- **Series Navigation**: Virtual series loading, thumbnail generation

### Performance Thresholds

| Metric | Low-end Device | Medium-end Device | High-end Device |
|--------|----------------|-------------------|-----------------|
| Study Load Time | 8000ms | 5000ms | 2000ms |
| Virtual Series Load | 3000ms | 2000ms | 1000ms |
| Viewport Render | 500ms | 300ms | 150ms |
| Tool Activation | 800ms | 500ms | 200ms |
| Memory Limit | 512MB | 1024MB | 2048MB |
| Frame Rate Target | 20 FPS | 30 FPS | 60 FPS |

## Benchmarking System

### Test Scenarios

1. **Small Study**: 1 series, 20-50 images
   - Target: Basic functionality validation
   - Duration: ~30 seconds
   - Memory: <256MB

2. **Medium Study**: 2-3 series, 100-200 images
   - Target: Typical clinical workflow
   - Duration: ~60 seconds
   - Memory: <512MB

3. **Large Study**: 5-10 series, 500-1000 images
   - Target: Complex cases (CT, MR with multiple series)
   - Duration: ~120 seconds
   - Memory: <1024MB

4. **Extra Large Study**: 15+ series, 2000+ images
   - Target: Stress testing (whole body scans)
   - Duration: ~300 seconds
   - Memory: <2048MB

### Performance Scoring

Performance score (0-100) calculated based on:

- **Study Load Performance** (30%): Time to load and display study
- **Interaction Responsiveness** (25%): Tool activation, viewport updates
- **Memory Efficiency** (20%): Peak memory usage, garbage collection
- **Error Rate** (15%): Failed operations, error frequency
- **Frame Rate Consistency** (10%): Smooth rendering performance

## Error Tracking

### Error Categories
- **Network Errors**: DICOM server connectivity, image loading failures
- **Rendering Errors**: Viewport initialization, WebGL issues
- **Tool Errors**: Measurement tool failures, annotation errors
- **Study Loading Errors**: DICOM parsing, metadata extraction
- **Memory Errors**: Out of memory, allocation failures

### Error Severity Levels
- **Critical**: System unusable, data loss risk
- **High**: Major functionality broken
- **Medium**: Feature degradation
- **Low**: Minor issues, cosmetic problems

## Monitoring Dashboard

### Dashboard Features

#### Overview Tab
- **System Health Score**: Overall system performance indicator
- **Key Metrics**: Memory usage, error rate, performance score
- **Quick Stats**: Active studies, tool usage, error summaries

#### Performance Tab
- **Real-time Metrics**: Memory, CPU, network, frame rate
- **Historical Trends**: Performance over time
- **Threshold Monitoring**: Alert indicators for violations

#### Errors Tab
- **Error Timeline**: Recent errors with filtering
- **Error Categories**: Distribution by type and severity
- **Error Trends**: Error rate over time

#### Benchmarks Tab
- **Benchmark Results**: Historical performance scores
- **Scenario Comparison**: Performance across different test scenarios
- **Hardware Profiles**: Performance by device capability

## CI/CD Integration

### Quality Gates
- **Study Load Performance**: Must meet time thresholds
- **Memory Usage**: Must stay within limits
- **Error Rate**: Must remain below threshold
- **Performance Score**: Must meet minimum score
- **Frame Rate**: Must maintain smooth rendering

### Supported Platforms
- **GitHub Actions**: Complete workflow with matrix testing
- **GitLab CI**: Multi-stage pipeline with artifact publishing
- **Jenkins**: Declarative pipeline with quality gates
- **Azure DevOps**: Build pipeline with test publishing

### Environment Variables

```bash
# Quality Gates
PERF_QUALITY_GATES=true
PERF_FAIL_ON_VIOLATION=true
PERF_REGRESSION_THRESHOLD=0.15

# Thresholds
PERF_STUDY_LOAD_THRESHOLD=8000
PERF_MEMORY_THRESHOLD=1024
PERF_ERROR_RATE_THRESHOLD=0.01
PERF_SCORE_THRESHOLD=75

# Reporting
PERF_REPORTING=true
PERF_REPORT_FORMATS=json,junit,html
PERF_REPORT_DIR=./performance-reports
```

## Configuration Guide

### Hardware Profile Detection

The system automatically detects hardware capabilities based on:
- Available memory (RAM)
- CPU cores and architecture
- GPU capabilities (WebGL support)
- Network connection quality

### Performance Budgets

Configure performance budgets per hardware profile for optimal user experience across different device capabilities.

## Best Practices

### Development Guidelines

1. **Performance First Design**
   - Design with performance budgets in mind
   - Use progressive loading for large datasets
   - Implement efficient caching strategies

2. **Monitoring Integration**
   - Add performance tracking to critical operations
   - Include context in error reports
   - Monitor memory usage in data-heavy operations

3. **Testing Strategy**
   - Run performance tests on different hardware profiles
   - Test with realistic medical imaging data
   - Validate performance under load

### Medical Imaging Considerations

1. **DICOM Data Handling**
   - Stream large datasets progressively
   - Cache frequently accessed images
   - Optimize viewport rendering for medical displays

2. **Clinical Workflow Integration**
   - Minimize disruption during critical operations
   - Provide performance feedback to users
   - Ensure consistent performance across modalities

## Usage Examples

### Basic Monitoring

```javascript
import { getPerformanceMonitor } from './services/PerformanceMonitoringService';

const monitor = getPerformanceMonitor();
const studyLoadId = monitor.startStudyLoadTracking('study-123');

// Load study...
await loadStudy('study-123');

monitor.completeStudyLoadTracking(studyLoadId, {
  studyInstanceUID: 'study-123',
  seriesCount: 5,
  imageCount: 120
});
```

### Benchmarking

```javascript
import { getPerformanceBenchmark } from './services/PerformanceBenchmarkService';

const benchmark = getPerformanceBenchmark();
const results = await benchmark.runBenchmark('medium');

console.log('Performance Score:', results.performanceScore);
console.log('Budget Compliance:', results.budgetCompliance);
```

### Error Tracking

```javascript
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

## Troubleshooting

### Common Performance Issues

#### High Memory Usage
Monitor memory usage and implement cleanup strategies when approaching limits.

#### Slow Study Loading
- Check network connectivity and DICOM server response
- Verify image decoding performance
- Monitor viewport rendering time

#### Low Frame Rate
- Check GPU acceleration availability
- Monitor WebGL context status
- Verify viewport optimization settings

### Debug Mode

Enable debug logging for detailed performance insights:

```javascript
window.OHIF_PERFORMANCE_DEBUG = true;
```

## Conclusion

The OHIF v3 Performance Monitoring system provides comprehensive tools for ensuring optimal performance in medical imaging workflows. By combining real-time monitoring, automated benchmarking, error tracking, and CI/CD integration, teams can maintain high-quality performance standards throughout development and production deployment.
