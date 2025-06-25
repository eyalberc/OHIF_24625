/**
 * Performance Test Runner
 * 
 * Automated performance testing framework for OHIF Enhanced Features
 * Monitors and validates performance metrics across different scenarios
 */

const { chromium, firefox, webkit } = require('playwright');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');
const TestConfig = require('../../config/test-config');
const DicomUtils = require('../../utils/dicom-utils');
const ReportingUtils = require('../../utils/reporting-utils');

class PerformanceTestRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      startTime: Date.now(),
      tests: [],
      summary: {}
    };
    
    // Performance thresholds from config
    this.thresholds = TestConfig.performance;
    
    // Metrics collection
    this.metrics = {
      loadTimes: [],
      memoryUsage: [],
      networkActivity: [],
      frameRates: [],
      renderingTimes: []
    };
  }

  /**
   * Initialize the performance testing environment
   */
  async initialize() {
    console.log('🚀 Initializing Performance Test Runner...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--enable-memory-info',
        '--js-flags=--expose-gc'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: false, // Disable video recording for performance tests
      recordHar: path.join(__dirname, '../../reports/performance/network-activity.har')
    });

    this.page = await this.context.newPage();
    
    // Enable performance monitoring
    await this.setupPerformanceMonitoring();
    
    console.log('✅ Performance Test Runner initialized');
  }

  /**
   * Setup comprehensive performance monitoring
   */
  async setupPerformanceMonitoring() {
    // Enable CDP sessions for detailed metrics
    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send('Performance.enable');
    await cdp.send('Runtime.enable');
    
    // Monitor network activity
    await cdp.send('Network.enable');
    
    // Memory monitoring
    await cdp.send('HeapProfiler.enable');
    
    // Inject performance monitoring script
    await this.page.addInitScript(() => {
      window.performanceMonitor = {
        startTime: performance.now(),
        metrics: {
          loadTimes: [],
          renderTimes: [],
          interactionTimes: [],
          memorySnapshots: [],
          networkRequests: [],
          frameRates: []
        },
        
        // Mark important events
        mark(eventName) {
          const time = performance.now();
          performance.mark(eventName);
          this.metrics.loadTimes.push({
            event: eventName,
            time: time,
            relativeTime: time - this.startTime
          });
          return time;
        },
        
        // Measure duration between events
        measure(measureName, startMark, endMark) {
          performance.measure(measureName, startMark, endMark);
          const measure = performance.getEntriesByName(measureName)[0];
          return measure.duration;
        },
        
        // Memory snapshot
        takeMemorySnapshot(label) {
          if (performance.memory) {
            this.metrics.memorySnapshots.push({
              label,
              timestamp: performance.now(),
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            });
          }
        },
        
        // Frame rate monitoring
        startFrameRateMonitoring() {
          let frameCount = 0;
          let startTime = performance.now();
          
          const countFrames = () => {
            frameCount++;
            requestAnimationFrame(countFrames);
          };
          
          countFrames();
          
          // Calculate FPS every second
          const fpsInterval = setInterval(() => {
            const currentTime = performance.now();
            const elapsed = (currentTime - startTime) / 1000;
            const fps = frameCount / elapsed;
            
            this.metrics.frameRates.push({
              timestamp: currentTime,
              fps: fps
            });
            
            frameCount = 0;
            startTime = currentTime;
          }, 1000);
          
          return fpsInterval;
        },
        
        // Network request tracking
        trackNetworkRequest(url, method, startTime, endTime, size) {
          this.metrics.networkRequests.push({
            url,
            method,
            startTime,
            endTime,
            duration: endTime - startTime,
            size: size || 0
          });
        }
      };
    });
  }

  /**
   * Run comprehensive performance test suite
   */
  async runPerformanceTests() {
    console.log('📊 Starting Performance Test Suite...');
    
    try {
      // Load test data
      const testData = await DicomUtils.loadTestData();
      
      // Run different performance test categories
      await this.runLoadTimeTests(testData);
      await this.runMemoryUsageTests(testData);
      await this.runNetworkPerformanceTests(testData);
      await this.runRenderingPerformanceTests(testData);
      await this.runUserInteractionTests(testData);
      await this.runStressTests(testData);
      await this.runConcurrentUserTests();
      await this.runLighthouseAudit();
      
      // Generate performance report
      await this.generatePerformanceReport();
      
      console.log('✅ Performance Test Suite completed');
      
    } catch (error) {
      console.error('❌ Performance Test Suite failed:', error);
      throw error;
    }
  }

  /**
   * Test study loading performance across different sizes
   */
  async runLoadTimeTests(testData) {
    console.log('⏱️ Running Load Time Performance Tests...');
    
    const studyCategories = [
      { name: 'small', studies: testData.studies.filter(s => s.imageCount <= 50) },
      { name: 'medium', studies: testData.studies.filter(s => s.imageCount > 50 && s.imageCount <= 200) },
      { name: 'large', studies: testData.studies.filter(s => s.imageCount > 200 && s.imageCount <= 500) },
      { name: 'xlarge', studies: testData.studies.filter(s => s.imageCount > 500) }
    ];

    for (const category of studyCategories) {
      if (category.studies.length === 0) continue;
      
      console.log(`Testing ${category.name} studies (${category.studies.length} studies)...`);
      
      const categoryResults = [];
      
      for (const study of category.studies.slice(0, 5)) { // Test first 5 studies in each category
        const result = await this.measureStudyLoadTime(study);
        categoryResults.push(result);
      }
      
      // Calculate category statistics
      const avgLoadTime = categoryResults.reduce((sum, r) => sum + r.totalLoadTime, 0) / categoryResults.length;
      const maxLoadTime = Math.max(...categoryResults.map(r => r.totalLoadTime));
      const minLoadTime = Math.min(...categoryResults.map(r => r.totalLoadTime));
      
      const categoryResult = {
        category: category.name,
        studyCount: categoryResults.length,
        averageLoadTime: avgLoadTime,
        maxLoadTime: maxLoadTime,
        minLoadTime: minLoadTime,
        threshold: this.thresholds.loadTime[category.name],
        passed: avgLoadTime < this.thresholds.loadTime[category.name],
        studies: categoryResults
      };
      
      this.testResults.tests.push({
        name: `Load Time - ${category.name} studies`,
        category: 'performance',
        type: 'loadTime',
        result: categoryResult,
        passed: categoryResult.passed
      });
      
      console.log(`${category.name}: Avg ${avgLoadTime.toFixed(2)}ms (threshold: ${categoryResult.threshold}ms) - ${categoryResult.passed ? '✅' : '❌'}`);
    }
  }

  /**
   * Measure individual study load time with detailed breakdown
   */
  async measureStudyLoadTime(study) {
    await this.page.goto(TestConfig.baseUrl, { waitUntil: 'networkidle' });
    
    // Start timing
    await this.page.evaluate(() => {
      window.performanceMonitor.mark('study-load-start');
      window.performanceMonitor.takeMemorySnapshot('pre-study-load');
    });
    
    // Load study
    await this.page.evaluate((studyId) => {
      // Simulate study loading
      window.performanceMonitor.mark('study-request-start');
      return window.loadStudy(studyId);
    }, study.studyId);
    
    // Wait for study to load completely
    await this.page.waitForSelector('[data-testid="enhanced-patient-header"]', { timeout: 30000 });
    await this.page.waitForFunction(() => {
      const viewports = document.querySelectorAll('[data-testid="viewport"]');
      return Array.from(viewports).every(viewport => {
        const canvas = viewport.querySelector('canvas');
        return canvas && canvas.getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0;
      });
    }, { timeout: 30000 });
    
    // End timing and collect metrics
    const metrics = await this.page.evaluate(() => {
      window.performanceMonitor.mark('study-load-complete');
      window.performanceMonitor.takeMemorySnapshot('post-study-load');
      
      const totalLoadTime = window.performanceMonitor.measure(
        'total-study-load',
        'study-load-start',
        'study-load-complete'
      );
      
      return {
        totalLoadTime,
        metrics: window.performanceMonitor.metrics,
        navigationTiming: performance.getEntriesByType('navigation')[0],
        resourceTiming: performance.getEntriesByType('resource')
      };
    });
    
    return {
      studyId: study.studyId,
      imageCount: study.imageCount,
      modality: study.modality,
      totalLoadTime: metrics.totalLoadTime,
      navigationTiming: metrics.navigationTiming,
      resourceTiming: metrics.resourceTiming,
      memoryUsage: metrics.metrics.memorySnapshots
    };
  }

  /**
   * Test memory usage patterns and garbage collection
   */
  async runMemoryUsageTests(testData) {
    console.log('🧠 Running Memory Usage Tests...');
    
    const memoryTests = [
      {
        name: 'Sequential Study Loading',
        test: () => this.testSequentialStudyMemory(testData.studies.slice(0, 10))
      },
      {
        name: 'Large Study Memory Management',
        test: () => this.testLargeStudyMemory(testData.studies.filter(s => s.imageCount > 500).slice(0, 3))
      },
      {
        name: 'Virtual Series Memory Efficiency',
        test: () => this.testVirtualSeriesMemory(testData.studies.filter(s => s.seriesCount > 3).slice(0, 5))
      },
      {
        name: 'Study Comparison Memory Impact',
        test: () => this.testComparisonMemory(testData.studies.filter(s => s.hasComparison).slice(0, 3))
      }
    ];

    for (const memoryTest of memoryTests) {
      console.log(`Testing ${memoryTest.name}...`);
      
      try {
        const result = await memoryTest.test();
        
        this.testResults.tests.push({
          name: `Memory Usage - ${memoryTest.name}`,
          category: 'performance',
          type: 'memory',
          result: result,
          passed: result.passed
        });
        
        console.log(`${memoryTest.name}: Peak ${(result.peakMemory / 1024 / 1024).toFixed(2)}MB - ${result.passed ? '✅' : '❌'}`);
        
      } catch (error) {
        console.error(`Memory test failed: ${memoryTest.name}`, error);
      }
    }
  }

  /**
   * Test sequential study loading memory patterns
   */
  async testSequentialStudyMemory(studies) {
    await this.page.goto(TestConfig.baseUrl, { waitUntil: 'networkidle' });
    
    const memorySnapshots = [];
    let peakMemory = 0;
    
    for (const study of studies) {
      // Load study
      await this.page.evaluate((studyId) => {
        window.performanceMonitor.takeMemorySnapshot(`before-study-${studyId}`);
        return window.loadStudy(studyId);
      }, study.studyId);
      
      await this.page.waitForSelector('[data-testid="enhanced-patient-header"]', { timeout: 15000 });
      
      // Take memory snapshot after load
      const snapshot = await this.page.evaluate((studyId) => {
        window.performanceMonitor.takeMemorySnapshot(`after-study-${studyId}`);
        const snapshots = window.performanceMonitor.metrics.memorySnapshots;
        return snapshots[snapshots.length - 1];
      }, study.studyId);
      
      memorySnapshots.push(snapshot);
      peakMemory = Math.max(peakMemory, snapshot.usedJSHeapSize);
      
      // Force garbage collection if available
      await this.page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
    }
    
    return {
      testName: 'Sequential Study Loading',
      studiesLoaded: studies.length,
      memorySnapshots: memorySnapshots,
      peakMemory: peakMemory,
      threshold: this.thresholds.memory.peak,
      passed: peakMemory < this.thresholds.memory.peak
    };
  }

  /**
   * Test network performance and optimization
   */
  async runNetworkPerformanceTests(testData) {
    console.log('🌐 Running Network Performance Tests...');
    
    const networkTests = [
      {
        name: 'DICOM Request Optimization',
        test: () => this.testDicomRequestOptimization(testData.studies.slice(0, 5))
      },
      {
        name: 'Cache Efficiency',
        test: () => this.testCacheEfficiency(testData.studies.slice(0, 3))
      },
      {
        name: 'Concurrent Request Handling',
        test: () => this.testConcurrentRequestHandling(testData.studies.slice(0, 3))
      }
    ];

    for (const networkTest of networkTests) {
      console.log(`Testing ${networkTest.name}...`);
      
      try {
        const result = await networkTest.test();
        
        this.testResults.tests.push({
          name: `Network Performance - ${networkTest.name}`,
          category: 'performance',
          type: 'network',
          result: result,
          passed: result.passed
        });
        
        console.log(`${networkTest.name}: ${result.summary} - ${result.passed ? '✅' : '❌'}`);
        
      } catch (error) {
        console.error(`Network test failed: ${networkTest.name}`, error);
      }
    }
  }

  /**
   * Test DICOM request optimization
   */
  async testDicomRequestOptimization(studies) {
    await this.page.goto(TestConfig.baseUrl, { waitUntil: 'networkidle' });
    
    const networkActivity = [];
    
    // Monitor network requests
    await this.page.route('**/*', route => {
      const request = route.request();
      const startTime = Date.now();
      
      route.continue().then(() => {
        const endTime = Date.now();
        networkActivity.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          startTime: startTime,
          endTime: endTime,
          duration: endTime - startTime
        });
      });
    });
    
    // Load studies and monitor requests
    for (const study of studies) {
      await this.page.evaluate((studyId) => {
        return window.loadStudy(studyId);
      }, study.studyId);
      
      await this.page.waitForSelector('[data-testid="enhanced-patient-header"]', { timeout: 15000 });
    }
    
    // Analyze network activity
    const dicomRequests = networkActivity.filter(req => req.url.includes('dicom') || req.url.includes('wado'));
    const totalRequests = dicomRequests.length;
    const totalBytes = dicomRequests.reduce((sum, req) => sum + (req.size || 0), 0);
    const avgRequestTime = dicomRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests;
    
    // Calculate optimization metrics
    const requestsPerStudy = totalRequests / studies.length;
    const optimizationScore = requestsPerStudy < 50 ? 'Good' : requestsPerStudy < 100 ? 'Acceptable' : 'Poor';
    
    return {
      testName: 'DICOM Request Optimization',
      studiesLoaded: studies.length,
      totalRequests: totalRequests,
      requestsPerStudy: requestsPerStudy,
      averageRequestTime: avgRequestTime,
      totalBytes: totalBytes,
      optimizationScore: optimizationScore,
      summary: `${requestsPerStudy.toFixed(1)} requests/study, ${avgRequestTime.toFixed(2)}ms avg`,
      passed: requestsPerStudy < 100 && avgRequestTime < 500
    };
  }

  /**
   * Test rendering performance and frame rates
   */
  async runRenderingPerformanceTests(testData) {
    console.log('🎨 Running Rendering Performance Tests...');
    
    const renderingTests = [
      {
        name: 'Image Rendering Performance',
        test: () => this.testImageRenderingPerformance(testData.studies.slice(0, 5))
      },
      {
        name: 'Virtual Series Scrolling Frame Rate',
        test: () => this.testVirtualSeriesFrameRate(testData.studies.filter(s => s.imageCount > 100).slice(0, 3))
      },
      {
        name: 'Viewport Manipulation Performance',
        test: () => this.testViewportManipulationPerformance(testData.studies.slice(0, 3))
      }
    ];

    for (const renderingTest of renderingTests) {
      console.log(`Testing ${renderingTest.name}...`);
      
      try {
        const result = await renderingTest.test();
        
        this.testResults.tests.push({
          name: `Rendering Performance - ${renderingTest.name}`,
          category: 'performance',
          type: 'rendering',
          result: result,
          passed: result.passed
        });
        
        console.log(`${renderingTest.name}: ${result.summary} - ${result.passed ? '✅' : '❌'}`);
        
      } catch (error) {
        console.error(`Rendering test failed: ${renderingTest.name}`, error);
      }
    }
  }

  /**
   * Test virtual series scrolling frame rate
   */
  async testVirtualSeriesFrameRate(studies) {
    await this.page.goto(TestConfig.baseUrl, { waitUntil: 'networkidle' });
    
    const frameRateResults = [];
    
    for (const study of studies) {
      await this.page.evaluate((studyId) => {
        return window.loadStudy(studyId);
      }, study.studyId);
      
      await this.page.waitForSelector('[data-testid="virtual-series-component"]', { timeout: 15000 });
      
      // Start frame rate monitoring
      const frameRateData = await this.page.evaluate(() => {
        const fpsMonitor = window.performanceMonitor.startFrameRateMonitoring();
        
        return new Promise((resolve) => {
          // Simulate continuous scrolling
          let scrollCount = 0;
          const scrollInterval = setInterval(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            scrollCount++;
            
            if (scrollCount >= 60) { // 3 seconds of scrolling at 20fps
              clearInterval(scrollInterval);
              clearInterval(fpsMonitor);
              
              setTimeout(() => {
                resolve({
                  frameRates: window.performanceMonitor.metrics.frameRates,
                  scrollEvents: scrollCount
                });
              }, 500);
            }
          }, 50); // 20fps scrolling
        });
      });
      
      // Calculate average frame rate
      const avgFrameRate = frameRateData.frameRates.reduce((sum, frame) => sum + frame.fps, 0) / frameRateData.frameRates.length;
      const minFrameRate = Math.min(...frameRateData.frameRates.map(frame => frame.fps));
      
      frameRateResults.push({
        studyId: study.studyId,
        imageCount: study.imageCount,
        averageFrameRate: avgFrameRate,
        minimumFrameRate: minFrameRate,
        scrollEvents: frameRateData.scrollEvents
      });
    }
    
    // Calculate overall statistics
    const overallAvgFps = frameRateResults.reduce((sum, result) => sum + result.averageFrameRate, 0) / frameRateResults.length;
    const overallMinFps = Math.min(...frameRateResults.map(result => result.minimumFrameRate));
    
    return {
      testName: 'Virtual Series Scrolling Frame Rate',
      studiesCount: studies.length,
      results: frameRateResults,
      overallAverageFrameRate: overallAvgFps,
      overallMinimumFrameRate: overallMinFps,
      threshold: this.thresholds.frameRate.minimum,
      summary: `${overallAvgFps.toFixed(1)} avg fps, ${overallMinFps.toFixed(1)} min fps`,
      passed: overallMinFps >= this.thresholds.frameRate.minimum
    };
  }

  /**
   * Test user interaction responsiveness
   */
  async runUserInteractionTests(testData) {
    console.log('👆 Running User Interaction Performance Tests...');
    
    const interactionTests = [
      {
        name: 'Tool Activation Response Time',
        test: () => this.testToolActivationTime(testData.studies[0])
      },
      {
        name: 'Study Navigation Response Time',
        test: () => this.testStudyNavigationTime(testData.studies.slice(0, 3))
      },
      {
        name: 'Comparison Mode Activation',
        test: () => this.testComparisonModeActivation(testData.studies.filter(s => s.hasComparison)[0])
      }
    ];

    for (const interactionTest of interactionTests) {
      console.log(`Testing ${interactionTest.name}...`);
      
      try {
        const result = await interactionTest.test();
        
        this.testResults.tests.push({
          name: `User Interaction - ${interactionTest.name}`,
          category: 'performance',
          type: 'interaction',
          result: result,
          passed: result.passed
        });
        
        console.log(`${interactionTest.name}: ${result.summary} - ${result.passed ? '✅' : '❌'}`);
        
      } catch (error) {
        console.error(`Interaction test failed: ${interactionTest.name}`, error);
      }
    }
  }

  /**
   * Test tool activation response times
   */
  async testToolActivationTime(study) {
    await this.page.goto(TestConfig.baseUrl, { waitUntil: 'networkidle' });
    await this.page.evaluate((studyId) => window.loadStudy(studyId), study.studyId);
    await this.page.waitForSelector('[data-testid="enhanced-toolbar"]', { timeout: 15000 });
    
    const tools = [
      'enhanced-zoom-tool',
      'enhanced-pan-tool',
      'enhanced-windowing-tool',
      'enhanced-measurement-tool'
    ];
    
    const activationTimes = [];
    
    for (const toolId of tools) {
      const startTime = await this.page.evaluate(() => performance.now());
      
      await this.page.click(`[data-testid="${toolId}"]`);
      
      await this.page.waitForFunction((id) => {
        const tool = document.querySelector(`[data-testid="${id}"]`);
        return tool && tool.classList.contains('active');
      }, toolId, { timeout: 2000 });
      
      const endTime = await this.page.evaluate(() => performance.now());
      const activationTime = endTime - startTime;
      
      activationTimes.push({
        tool: toolId,
        activationTime: activationTime
      });
    }
    
    const avgActivationTime = activationTimes.reduce((sum, tool) => sum + tool.activationTime, 0) / activationTimes.length;
    const maxActivationTime = Math.max(...activationTimes.map(tool => tool.activationTime));
    
    return {
      testName: 'Tool Activation Response Time',
      tools: activationTimes,
      averageActivationTime: avgActivationTime,
      maxActivationTime: maxActivationTime,
      threshold: this.thresholds.toolActivation?.maxTime || 200,
      summary: `${avgActivationTime.toFixed(2)}ms avg, ${maxActivationTime.toFixed(2)}ms max`,
      passed: avgActivationTime < (this.thresholds.toolActivation?.maxTime || 200)
    };
  }

  /**
   * Run stress tests with high load scenarios
   */
  async runStressTests(testData) {
    console.log('🔥 Running Stress Tests...');
    
    const stressTests = [
      {
        name: 'Memory Pressure Test',
        test: () => this.testMemoryPressure(testData.studies.slice(0, 3))
      },
      {
        name: 'Rapid Study Switching',
        test: () => this.testRapidStudySwitching(testData.studies.slice(0, 10))
      },
      {
        name: 'Maximum Viewport Count',
        test: () => this.testMaximumViewports(testData.studies[0])
      }
    ];

    for (const stressTest of stressTests) {
      console.log(`Testing ${stressTest.name}...`);
      
      try {
        const result = await stressTest.test();
        
        this.testResults.tests.push({
          name: `Stress Test - ${stressTest.name}`,
          category: 'performance',
          type: 'stress',
          result: result,
          passed: result.passed
        });
        
        console.log(`${stressTest.name}: ${result.summary} - ${result.passed ? '✅' : '❌'}`);
        
      } catch (error) {
        console.error(`Stress test failed: ${stressTest.name}`, error);
      }
    }
  }

  /**
   * Run Lighthouse performance audit
   */
  async runLighthouseAudit() {
    console.log('🔍 Running Lighthouse Performance Audit...');
    
    try {
      // Navigate to application
      await this.page.goto(TestConfig.baseUrl);
      
      // Run Lighthouse audit
      const lighthouse = require('lighthouse');
      const lighthouseResult = await lighthouse(
        TestConfig.baseUrl,
        {
          port: new URL(this.browser.wsEndpoint()).port,
          output: 'json',
          logLevel: 'info',
          disableDeviceEmulation: true,
          chromeFlags: ['--disable-mobile-emulation']
        }
      );
      
      const performanceScore = lighthouseResult.lhr.categories.performance.score * 100;
      const metrics = lighthouseResult.lhr.audits;
      
      const auditResult = {
        performanceScore: performanceScore,
        firstContentfulPaint: metrics['first-contentful-paint'].numericValue,
        largestContentfulPaint: metrics['largest-contentful-paint'].numericValue,
        firstMeaningfulPaint: metrics['first-meaningful-paint'].numericValue,
        speedIndex: metrics['speed-index'].numericValue,
        interactive: metrics['interactive'].numericValue,
        cumulativeLayoutShift: metrics['cumulative-layout-shift'].numericValue,
        totalBlockingTime: metrics['total-blocking-time'].numericValue
      };
      
      this.testResults.tests.push({
        name: 'Lighthouse Performance Audit',
        category: 'performance',
        type: 'lighthouse',
        result: auditResult,
        passed: performanceScore >= 80
      });
      
      console.log(`Lighthouse Audit: Score ${performanceScore}/100 - ${performanceScore >= 80 ? '✅' : '❌'}`);
      
    } catch (error) {
      console.error('Lighthouse audit failed:', error);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    console.log('📊 Generating Performance Report...');
    
    const summary = this.calculateTestSummary();
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: summary,
      tests: this.testResults.tests,
      metrics: this.metrics,
      thresholds: this.thresholds,
      environment: {
        browser: 'chromium',
        viewport: '1920x1080',
        baseUrl: TestConfig.baseUrl
      }
    };
    
    // Save detailed JSON report
    const reportsDir = path.join(__dirname, '../../reports/performance');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const jsonReportPath = path.join(reportsDir, `performance-report-${Date.now()}.json`);
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReport = await ReportingUtils.generatePerformanceHTML(reportData);
    const htmlReportPath = path.join(reportsDir, `performance-report-${Date.now()}.html`);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    console.log(`📄 Performance reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return reportData;
  }

  /**
   * Calculate test summary statistics
   */
  calculateTestSummary() {
    const totalTests = this.testResults.tests.length;
    const passedTests = this.testResults.tests.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = (passedTests / totalTests) * 100;
    
    const categories = {};
    this.testResults.tests.forEach(test => {
      if (!categories[test.type]) {
        categories[test.type] = { total: 0, passed: 0 };
      }
      categories[test.type].total++;
      if (test.passed) categories[test.type].passed++;
    });
    
    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      categories,
      overallStatus: passRate >= 85 ? 'PASSED' : 'FAILED'
    };
  }

  /**
   * Cleanup and close browser
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Performance Test Runner cleanup completed');
  }
}

module.exports = PerformanceTestRunner; 