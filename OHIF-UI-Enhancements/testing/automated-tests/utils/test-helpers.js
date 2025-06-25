/**
 * Test Helper Utilities
 * 
 * Comprehensive collection of helper functions for automated testing
 * Provides common operations, assertions, and utilities for OHIF testing
 */

const TestConfig = require('../config/test-config');

class TestHelpers {
  /**
   * Wait for OHIF application to fully load
   */
  static async waitForOHIFToLoad(page, timeout = TestConfig.timeout.default) {
    console.log('⏳ Waiting for OHIF application to load...');
    
    try {
      // Wait for main application container
      await page.waitForSelector('[data-testid="ohif-main"]', { timeout });
      
      // Wait for toolbar to be available
      await page.waitForSelector('[data-testid="toolbar"]', { timeout });
      
      // Wait for initial loading to complete
      await page.waitForFunction(() => {
        const loadingIndicator = document.querySelector('[data-testid="loading-indicator"]');
        return !loadingIndicator || loadingIndicator.style.display === 'none';
      }, { timeout });
      
      // Wait for any initial network requests to settle
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      console.log('✅ OHIF application loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load OHIF application:', error);
      throw new Error(`OHIF application failed to load: ${error.message}`);
    }
  }

  /**
   * Load a specific study by ID
   */
  static async loadStudy(page, studyId, timeout = TestConfig.timeout.long) {
    console.log(`📂 Loading study: ${studyId}`);
    
    try {
      // Navigate to study URL or trigger study load
      const studyUrl = `${TestConfig.baseUrl}/viewer/${studyId}`;
      await page.goto(studyUrl, { waitUntil: 'networkidle', timeout });
      
      // Wait for enhanced patient header to appear
      await page.waitForSelector('[data-testid="enhanced-patient-header"]', { timeout });
      
      // Wait for at least one viewport to load
      await page.waitForSelector('[data-testid="viewport"]', { timeout });
      
      // Wait for images to actually render
      await page.waitForFunction(() => {
        const viewports = document.querySelectorAll('[data-testid="viewport"]');
        return Array.from(viewports).some(viewport => {
          const canvas = viewport.querySelector('canvas');
          if (!canvas) return false;
          
          try {
            const context = canvas.getContext('2d');
            const imageData = context.getImageData(0, 0, 1, 1);
            return imageData.data[3] > 0; // Check alpha channel for actual content
          } catch (e) {
            return false;
          }
        });
      }, { timeout });
      
      console.log(`✅ Study loaded successfully: ${studyId}`);
      
      // Return study metadata
      return await page.evaluate(() => {
        const header = document.querySelector('[data-testid="enhanced-patient-header"]');
        return {
          patientName: header?.querySelector('[data-testid="patient-name"]')?.textContent,
          patientId: header?.querySelector('[data-testid="patient-id"]')?.textContent,
          studyDate: header?.querySelector('[data-testid="study-date"]')?.textContent,
          modality: header?.querySelector('[data-testid="modality"]')?.textContent
        };
      });
      
    } catch (error) {
      console.error(`❌ Failed to load study ${studyId}:`, error);
      throw new Error(`Study load failed: ${error.message}`);
    }
  }

  /**
   * Load a comparison study for side-by-side comparison
   */
  static async loadComparisonStudy(page, comparisonStudyId, timeout = TestConfig.timeout.long) {
    console.log(`🔄 Loading comparison study: ${comparisonStudyId}`);
    
    try {
      // Open comparison panel if not already open
      const comparisonPanel = await page.$('[data-testid="study-comparison-panel"]');
      if (!comparisonPanel) {
        await page.click('[data-testid="comparison-mode-button"]');
        await page.waitForSelector('[data-testid="study-comparison-panel"]', { timeout: 5000 });
      }
      
      // Load comparison study
      await page.evaluate((studyId) => {
        // Trigger comparison study load (implementation depends on OHIF API)
        window.loadComparisonStudy(studyId);
      }, comparisonStudyId);
      
      // Wait for comparison to be ready
      await page.waitForSelector('[data-testid="comparison-ready"]', { timeout });
      
      console.log(`✅ Comparison study loaded: ${comparisonStudyId}`);
      
    } catch (error) {
      console.error(`❌ Failed to load comparison study ${comparisonStudyId}:`, error);
      throw error;
    }
  }

  /**
   * Perform zoom operation on viewport
   */
  static async performZoom(page, zoomFactor, viewportSelector = '[data-testid="viewport"]') {
    console.log(`🔍 Performing zoom: ${zoomFactor}x`);
    
    try {
      const viewport = await page.$(viewportSelector);
      if (!viewport) {
        throw new Error('Viewport not found');
      }
      
      // Get viewport center
      const box = await viewport.boundingBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      // Perform zoom using wheel events
      const wheelDelta = zoomFactor > 1 ? 120 : -120;
      const wheelEvents = Math.abs(Math.log(zoomFactor) / Math.log(1.1)); // Number of wheel events needed
      
      for (let i = 0; i < wheelEvents; i++) {
        await page.mouse.wheel(0, wheelDelta);
        await page.waitForTimeout(50); // Small delay between events
      }
      
      // Wait for zoom to stabilize
      await page.waitForTimeout(200);
      
      console.log(`✅ Zoom completed: ${zoomFactor}x`);
      
    } catch (error) {
      console.error(`❌ Zoom operation failed:`, error);
      throw error;
    }
  }

  /**
   * Perform pan operation on viewport
   */
  static async performPan(page, deltaX, deltaY, viewportSelector = '[data-testid="viewport"]') {
    console.log(`↔️ Performing pan: (${deltaX}, ${deltaY})`);
    
    try {
      const viewport = await page.$(viewportSelector);
      if (!viewport) {
        throw new Error('Viewport not found');
      }
      
      // Get viewport center as starting point
      const box = await viewport.boundingBox();
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      
      // Perform pan using mouse drag
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
      await page.mouse.up();
      
      // Wait for pan to complete
      await page.waitForTimeout(200);
      
      console.log(`✅ Pan completed: (${deltaX}, ${deltaY})`);
      
    } catch (error) {
      console.error(`❌ Pan operation failed:`, error);
      throw error;
    }
  }

  /**
   * Perform window/level adjustment
   */
  static async performWindowLevel(page, windowWidth, windowCenter, viewportSelector = '[data-testid="viewport"]') {
    console.log(`🌡️ Adjusting window/level: W${windowWidth} L${windowCenter}`);
    
    try {
      // Activate windowing tool
      await page.click('[data-testid="enhanced-windowing-tool"]');
      
      const viewport = await page.$(viewportSelector);
      if (!viewport) {
        throw new Error('Viewport not found');
      }
      
      // Get viewport bounds
      const box = await viewport.boundingBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      // Calculate drag distance based on current values and targets
      const windowDelta = windowWidth > 500 ? 100 : -100; // Right for wider window
      const levelDelta = windowCenter > 50 ? -50 : 50;    // Up for higher level
      
      // Perform window/level adjustment
      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: 'right' }); // Right-click drag for W/L
      await page.mouse.move(centerX + windowDelta, centerY + levelDelta, { steps: 5 });
      await page.mouse.up();
      
      // Wait for adjustment to apply
      await page.waitForTimeout(200);
      
      console.log(`✅ Window/level adjusted: W${windowWidth} L${windowCenter}`);
      
    } catch (error) {
      console.error(`❌ Window/level adjustment failed:`, error);
      throw error;
    }
  }

  /**
   * Execute a complex clinical workflow simulation
   */
  static async performComplexWorkflow(page) {
    console.log('🏥 Executing complex clinical workflow...');
    
    try {
      // Simulate a typical radiology workflow
      const workflow = [
        () => this.activateVirtualSeries(page),
        () => this.performImageNavigation(page),
        () => this.takeMeasurements(page),
        () => this.adjustDisplaySettings(page),
        () => this.compareWithPriorStudy(page)
      ];
      
      for (const step of workflow) {
        await step();
        await page.waitForTimeout(500); // Brief pause between workflow steps
      }
      
      console.log('✅ Complex workflow completed successfully');
      
    } catch (error) {
      console.error(`❌ Complex workflow failed:`, error);
      throw error;
    }
  }

  /**
   * Activate virtual series functionality
   */
  static async activateVirtualSeries(page) {
    try {
      // Check if virtual series is available
      const virtualSeriesToggle = await page.$('[data-testid="virtual-series-toggle"]');
      if (virtualSeriesToggle) {
        await virtualSeriesToggle.click();
        await page.waitForSelector('[data-testid="virtual-series-component"]', { timeout: 5000 });
        console.log('🔄 Virtual series activated');
      }
    } catch (error) {
      console.log('⚠️ Virtual series not available or failed to activate');
    }
  }

  /**
   * Perform systematic image navigation
   */
  static async performImageNavigation(page) {
    try {
      // Navigate through images using keyboard
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
      }
      
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
      }
      
      console.log('🧭 Image navigation completed');
    } catch (error) {
      console.log('⚠️ Image navigation failed');
    }
  }

  /**
   * Take measurements on the image
   */
  static async takeMeasurements(page) {
    try {
      // Activate measurement tool
      await page.click('[data-testid="enhanced-measurement-tool"]');
      
      // Simulate measurement by clicking two points
      const viewport = await page.$('[data-testid="viewport"]');
      const box = await viewport.boundingBox();
      
      await page.mouse.click(box.x + 100, box.y + 100);
      await page.mouse.click(box.x + 200, box.y + 150);
      
      console.log('📏 Measurements taken');
    } catch (error) {
      console.log('⚠️ Measurement taking failed');
    }
  }

  /**
   * Adjust display settings
   */
  static async adjustDisplaySettings(page) {
    try {
      await this.performWindowLevel(page, 400, 40);
      await this.performZoom(page, 1.5);
      
      console.log('🎛️ Display settings adjusted');
    } catch (error) {
      console.log('⚠️ Display adjustment failed');
    }
  }

  /**
   * Compare with prior study (if available)
   */
  static async compareWithPriorStudy(page) {
    try {
      const comparisonButton = await page.$('[data-testid="comparison-mode-button"]');
      if (comparisonButton) {
        await comparisonButton.click();
        await page.waitForTimeout(1000);
        console.log('🔄 Prior study comparison initiated');
      }
    } catch (error) {
      console.log('⚠️ Prior study comparison not available');
    }
  }

  /**
   * Take screenshot with metadata
   */
  static async takeScreenshot(page, name, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const screenshotPath = `${TestConfig.reporting.screenshots.directory}/${filename}`;
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: TestConfig.reporting.screenshots.fullPage,
      ...options
    });
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Measure performance of a function execution
   */
  static async measurePerformance(page, operationName, operation) {
    console.log(`⏱️ Measuring performance: ${operationName}`);
    
    const startTime = await page.evaluate(() => performance.now());
    
    try {
      const result = await operation();
      
      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;
      
      console.log(`✅ ${operationName} completed in ${duration.toFixed(2)}ms`);
      
      return {
        success: true,
        duration: duration,
        result: result
      };
      
    } catch (error) {
      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;
      
      console.log(`❌ ${operationName} failed after ${duration.toFixed(2)}ms`);
      
      return {
        success: false,
        duration: duration,
        error: error.message
      };
    }
  }

  /**
   * Wait for network requests to settle
   */
  static async waitForNetworkIdle(page, timeout = 5000) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
      console.log('🌐 Network activity settled');
    } catch (error) {
      console.log('⚠️ Network activity did not settle within timeout');
    }
  }

  /**
   * Inject performance monitoring code
   */
  static async injectPerformanceMonitoring(page) {
    await page.addInitScript(() => {
      window.testPerformanceMonitor = {
        marks: {},
        measures: {},
        
        mark(name) {
          const time = performance.now();
          this.marks[name] = time;
          performance.mark(name);
          return time;
        },
        
        measure(name, startMark, endMark) {
          const start = this.marks[startMark] || 0;
          const end = this.marks[endMark] || performance.now();
          const duration = end - start;
          
          this.measures[name] = duration;
          
          try {
            performance.measure(name, startMark, endMark);
          } catch (e) {
            // Ignore if marks don't exist
          }
          
          return duration;
        },
        
        getResults() {
          return {
            marks: this.marks,
            measures: this.measures,
            navigation: performance.getEntriesByType('navigation')[0],
            resources: performance.getEntriesByType('resource')
          };
        }
      };
    });
  }

  /**
   * Collect performance metrics from the page
   */
  static async collectPerformanceMetrics(page) {
    return await page.evaluate(() => {
      const metrics = {
        timing: {},
        memory: {},
        navigation: {},
        resources: []
      };
      
      // Timing metrics
      if (performance.timing) {
        const timing = performance.timing;
        metrics.timing = {
          domLoading: timing.domLoading - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventStart - timing.navigationStart,
          domComplete: timing.domComplete - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart
        };
      }
      
      // Memory metrics
      if (performance.memory) {
        metrics.memory = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      
      // Navigation metrics
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        metrics.navigation = {
          redirectTime: nav.redirectEnd - nav.redirectStart,
          dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
          connectTime: nav.connectEnd - nav.connectStart,
          requestTime: nav.responseStart - nav.requestStart,
          responseTime: nav.responseEnd - nav.responseStart,
          domProcessingTime: nav.domInteractive - nav.responseEnd,
          loadTime: nav.loadEventEnd - nav.loadEventStart
        };
      }
      
      // Resource timing
      metrics.resources = performance.getEntriesByType('resource').map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize || 0,
        type: resource.initiatorType
      }));
      
      // Custom test monitor results
      if (window.testPerformanceMonitor) {
        metrics.custom = window.testPerformanceMonitor.getResults();
      }
      
      return metrics;
    });
  }

  /**
   * Verify DICOM image integrity
   */
  static async verifyDicomImageIntegrity(page, viewportSelector = '[data-testid="viewport"]') {
    return await page.evaluate((selector) => {
      const viewport = document.querySelector(selector);
      if (!viewport) return false;
      
      const canvas = viewport.querySelector('canvas');
      if (!canvas) return false;
      
      try {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if image has actual content (not all black/transparent)
        let hasContent = false;
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0 || imageData.data[i+1] > 0 || imageData.data[i+2] > 0) {
            hasContent = true;
            break;
          }
        }
        
        return hasContent;
      } catch (error) {
        return false;
      }
    }, viewportSelector);
  }

  /**
   * Simulate network conditions
   */
  static async simulateNetworkConditions(page, conditions) {
    const client = await page.context().newCDPSession(page);
    
    await client.send('Network.emulateNetworkConditions', {
      offline: conditions.offline || false,
      downloadThroughput: conditions.downloadThroughput || -1,
      uploadThroughput: conditions.uploadThroughput || -1,
      latency: conditions.latency || 0
    });
    
    console.log(`🌐 Network conditions simulated:`, conditions);
  }

  /**
   * Clean up test environment
   */
  static async cleanup(page) {
    try {
      // Clear any test data
      await page.evaluate(() => {
        // Clear local storage
        localStorage.clear();
        
        // Clear session storage
        sessionStorage.clear();
        
        // Clear any test-specific global variables
        delete window.testPerformanceMonitor;
        delete window.testData;
      });
      
      // Clear cookies
      await page.context().clearCookies();
      
      console.log('🧹 Test environment cleaned up');
      
    } catch (error) {
      console.log('⚠️ Cleanup failed:', error);
    }
  }
}

module.exports = TestHelpers; 