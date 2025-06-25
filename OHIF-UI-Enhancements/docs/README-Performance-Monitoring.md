# OHIF v3 Performance Monitoring System

## Quick Start

The OHIF v3 Performance Monitoring System provides comprehensive real-time performance tracking, automated benchmarking, and CI/CD integration for medical imaging workflows.

## Features

✅ **Real-time Performance Monitoring**
- Study load time tracking
- Memory usage monitoring
- Frame rate measurement
- Network performance analysis

✅ **Automated Benchmarking**
- Hardware-aware performance testing
- Multiple test scenarios (small to extra-large studies)
- Performance scoring and compliance checking
- Regression detection

✅ **Error Tracking & Analytics**
- Centralized error collection
- Contextual error reporting
- Error trend analysis
- Automated alerting

✅ **Interactive Dashboard**
- Real-time metrics visualization
- System health monitoring
- Performance trends
- Export capabilities

✅ **CI/CD Integration**
- Quality gates for performance validation
- Multi-platform support (GitHub Actions, GitLab CI, Jenkins)
- Automated reporting
- Performance regression alerts

✅ **Medical Imaging Optimizations**
- Virtual series loading optimization
- GPU-accelerated study comparison
- Memory-efficient caching
- Progressive loading strategies

## Installation

The performance monitoring system is integrated into the OHIF v3 UI enhancements extension:

```bash
cd OHIF-UI-Enhancements/extensions/ui-enhancements
npm install
```

## Basic Usage

### 1. Performance Monitoring

```javascript
import { getPerformanceMonitor } from './services/PerformanceMonitoringService';

const monitor = getPerformanceMonitor();

// Track study loading
const trackingId = monitor.startStudyLoadTracking('study-123');
await loadStudy('study-123');
monitor.completeStudyLoadTracking(trackingId, {
  studyInstanceUID: 'study-123',
  seriesCount: 5,
  imageCount: 120
});

// Get performance summary
const summary = monitor.getPerformanceSummary();
console.log('Performance Summary:', summary);
```

### 2. Benchmarking

```javascript
import { getPerformanceBenchmark } from './services/PerformanceBenchmarkService';

const benchmark = getPerformanceBenchmark();

// Run performance benchmark
const results = await benchmark.runBenchmark('medium');
console.log('Performance Score:', results.performanceScore);
console.log('Budget Compliance:', results.budgetCompliance);

// Get hardware profile
const profile = benchmark.detectHardwareProfile();
console.log('Hardware Profile:', profile); // 'low-end', 'medium-end', or 'high-end'
```

### 3. Error Tracking

```javascript
import { getErrorTracker } from './services/ErrorTrackingService';

const errorTracker = getErrorTracker();

try {
  await loadDicomStudy(studyId);
} catch (error) {
  errorTracker.reportError(error, {
    category: 'study-loading',
    severity: 'critical',
    context: {
      studyInstanceUID: studyId,
      memoryUsage: performance.memory.usedJSHeapSize
    }
  });
}
```

### 4. Monitoring Dashboard

```javascript
import MonitoringDashboard from './components/MonitoringDashboard';

function App() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setDashboardOpen(true)}>
        Open Performance Dashboard
      </button>
      
      <MonitoringDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />
    </div>
  );
}
```

## Performance Thresholds

The system includes hardware-aware performance budgets:

| Metric | Low-end | Medium-end | High-end |
|--------|---------|------------|----------|
| Study Load | 8000ms | 5000ms | 2000ms |
| Virtual Series | 3000ms | 2000ms | 1000ms |
| Viewport Render | 500ms | 300ms | 150ms |
| Tool Activation | 800ms | 500ms | 200ms |
| Memory Limit | 512MB | 1024MB | 2048MB |
| Frame Rate | 20 FPS | 30 FPS | 60 FPS |

## CI/CD Integration

### GitHub Actions

Add performance testing to your workflow:

```yaml
- name: Run Performance Tests
  run: |
    cd OHIF-UI-Enhancements
    npm run test:performance
  env:
    PERF_QUALITY_GATES: true
    PERF_FAIL_ON_VIOLATION: true
    PERF_SCORE_THRESHOLD: 75

- name: Upload Performance Reports
  uses: actions/upload-artifact@v4
  with:
    name: performance-reports
    path: OHIF-UI-Enhancements/performance-reports/
```

### Environment Variables

Configure performance testing via environment variables:

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

## React Hooks

Use performance monitoring hooks in React components:

```javascript
import { 
  useStudyLoadPerformance,
  useToolPerformance,
  useMemoryMonitoring 
} from './hooks/usePerformanceMonitoring';

function StudyViewer({ studyId }) {
  const { startTracking, completeTracking } = useStudyLoadPerformance();
  const { memoryUsage, isWarning } = useMemoryMonitoring();
  
  useEffect(() => {
    const trackingId = startTracking(studyId);
    
    loadStudy(studyId).then(() => {
      completeTracking(trackingId, { studyId });
    });
  }, [studyId]);

  return (
    <div>
      {isWarning && (
        <div className="memory-warning">
          High memory usage: {memoryUsage}MB
        </div>
      )}
      {/* Study viewer content */}
    </div>
  );
}
```

## Optimization Features

### Virtual Series Loading

Optimized data loading with intelligent caching:

```javascript
import VirtualSeriesDataSource from './utils/VirtualSeriesDataSource.optimized';

const dataSource = new VirtualSeriesDataSource({
  cacheSize: {
    metadata: 50,   // 50MB
    instances: 200, // 200MB
    thumbnails: 100 // 100MB
  },
  progressiveLoading: {
    enabled: true,
    networkAdaptive: true
  }
});

const seriesData = await dataSource.loadSeries(seriesInstanceUID);
```

### Study Comparison Optimization

GPU-accelerated study comparison:

```javascript
import StudyComparisonOptimizer from './utils/StudyComparisonOptimizer';

const optimizer = new StudyComparisonOptimizer({
  gpu: { enabled: true },
  workers: { maxWorkers: 4 },
  cache: { maxSizeMB: 100 }
});

const comparisonResult = await optimizer.compareStudies(study1, study2);
```

## Configuration

### Performance Budgets

```javascript
import { getPerformanceMonitor } from './services/PerformanceMonitoringService';

const monitor = getPerformanceMonitor();
monitor.setPerformanceBudgets({
  studyLoad: 5000,      // 5 seconds
  virtualSeries: 2000,  // 2 seconds
  viewportRender: 300,  // 300ms
  toolActivation: 500,  // 500ms
  memoryLimit: 1024,    // 1GB
  frameRate: 30         // 30 FPS
});
```

### Hardware Detection

```javascript
import { getPerformanceBenchmark } from './services/PerformanceBenchmarkService';

const benchmark = getPerformanceBenchmark();
const profile = benchmark.detectHardwareProfile();

// Automatically applies appropriate performance budgets
// based on detected hardware capabilities
```

## Testing

### Performance Tests

Run performance benchmarks:

```bash
npm run test:performance
```

### Specific Scenarios

```bash
npm run test:performance -- --scenarios="small,medium"
npm run test:performance -- --browser="chrome"
npm run test:performance -- --update-baseline
```

## Monitoring Dashboard

The interactive dashboard provides:

- **Overview**: System health and key metrics
- **Performance**: Real-time metrics and trends
- **Errors**: Error tracking and analysis
- **Benchmarks**: Performance test results

Access the dashboard through the OHIF interface or embed it in your application.

## File Structure

```
extensions/ui-enhancements/src/
├── services/
│   ├── PerformanceMonitoringService.js
│   ├── PerformanceBenchmarkService.js
│   └── ErrorTrackingService.js
├── components/
│   └── MonitoringDashboard.jsx
├── hooks/
│   └── usePerformanceMonitoring.js
├── utils/
│   ├── VirtualSeriesDataSource.optimized.js
│   ├── StudyComparisonOptimizer.js
│   └── cicdIntegration.js
└── docs/
    ├── performance-monitoring-guide.md
    └── performance-api-reference.md
```

## Documentation

- **[Performance Monitoring Guide](./performance-monitoring-guide.md)**: Comprehensive guide
- **[API Reference](./performance-api-reference.md)**: Detailed API documentation
- **CI/CD Configurations**: Example workflows for GitHub Actions and GitLab CI

## Best Practices

### 1. Performance First Design
- Design with performance budgets in mind
- Use progressive loading for large datasets
- Implement efficient caching strategies

### 2. Monitoring Integration
- Add performance tracking to critical operations
- Include context in error reports
- Monitor memory usage in data-heavy operations

### 3. Medical Imaging Considerations
- Stream large DICOM datasets progressively
- Cache frequently accessed images
- Optimize viewport rendering for medical displays

### 4. Production Deployment
- Enable real-time monitoring
- Configure alerting thresholds
- Set up performance dashboards

## Troubleshooting

### Common Issues

**High Memory Usage**
```javascript
// Monitor memory and trigger cleanup
const memoryInfo = performance.memory;
if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8) {
  // Trigger cache cleanup or garbage collection
}
```

**Slow Study Loading**
- Check network connectivity
- Verify DICOM server response times
- Monitor image decoding performance

**Frame Rate Issues**
- Verify GPU acceleration is available
- Check WebGL context status
- Monitor viewport optimization settings

### Debug Mode

Enable detailed logging:

```javascript
window.OHIF_PERFORMANCE_DEBUG = true;
```

## Support

- **Issues**: Report bugs and feature requests in the project repository
- **Documentation**: Check the docs directory for detailed guides
- **Community**: Join the OHIF community for support and discussions

## License

This performance monitoring system is part of the OHIF v3 UI enhancements and follows the same licensing terms as the main OHIF project.

---

**Ready to get started?** Check out the [Performance Monitoring Guide](./performance-monitoring-guide.md) for detailed implementation instructions. 