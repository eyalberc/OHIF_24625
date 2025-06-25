/**
 * Enhanced Features Regression Test Suite
 * 
 * Automated regression tests for OHIF Enhanced PRD Features
 * Ensures new changes don't break existing enhanced functionality
 * 
 * @jest-environment jsdom
 */

const { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const { chromium, firefox, webkit } = require('playwright');
const TestConfig = require('../../config/test-config');
const DicomUtils = require('../../utils/dicom-utils');
const TestHelpers = require('../../utils/test-helpers');

describe('Enhanced Features Regression Test Suite', () => {
  let browser;
  let context;
  let page;
  let testData;

  // Test suite setup
  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: process.env.DEBUG === 'true' ? 50 : 0
    });
    
    // Initialize test data
    testData = await DicomUtils.loadTestData();
    
    console.log('🚀 Enhanced Features Regression Test Suite - Starting');
    console.log(`📊 Test Data: ${testData.studies.length} DICOM studies loaded`);
  });

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: process.env.RECORD_VIDEO === 'true' ? { 
        dir: 'reports/videos/' 
      } : undefined
    });
    
    page = await context.newPage();
    
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.now(),
        measurements: []
      };
    });
    
    // Navigate to OHIF application
    await page.goto(TestConfig.baseUrl, { waitUntil: 'networkidle' });
    await TestHelpers.waitForOHIFToLoad(page);
  });

  afterEach(async () => {
    // Collect performance metrics
    const performanceMetrics = await page.evaluate(() => window.performanceMetrics);
    
    // Take screenshot on failure
    if (expect.getState().currentTestName && expect.getState().isExpectingAssertions) {
      await page.screenshot({ 
        path: `reports/screenshots/failure-${Date.now()}.png`,
        fullPage: true 
      });
    }
    
    await context.close();
  });

  afterAll(async () => {
    await browser.close();
    console.log('✅ Enhanced Features Regression Test Suite - Completed');
  });

  /**
   * Virtual Series "Scroll All" Feature Regression Tests
   */
  describe('Virtual Series "Scroll All" Regression Tests', () => {
    test('should load virtual series scroll functionality without regression', async () => {
      // Load a multi-series study
      const multiSeriesStudy = testData.studies.find(s => s.seriesCount > 3);
      await TestHelpers.loadStudy(page, multiSeriesStudy.studyId);
      
      // Wait for virtual series component to initialize
      await page.waitForSelector('[data-testid="virtual-series-component"]', { timeout: 10000 });
      
      // Verify virtual series scroll functionality
      const virtualSeriesComponent = await page.$('[data-testid="virtual-series-component"]');
      expect(virtualSeriesComponent).toBeTruthy();
      
      // Test scroll all functionality
      const scrollAllButton = await page.$('[data-testid="scroll-all-button"]');
      expect(scrollAllButton).toBeTruthy();
      
      // Measure performance of scroll all action
      const startTime = performance.now();
      await scrollAllButton.click();
      
      // Wait for scroll animation to complete
      await page.waitForFunction(() => {
        const component = document.querySelector('[data-testid="virtual-series-component"]');
        return component && !component.classList.contains('scrolling');
      }, { timeout: 5000 });
      
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      // Performance regression check
      expect(scrollTime).toBeLessThan(TestConfig.performance.virtualScroll.maxTime);
      
      // Verify all viewports are properly updated
      const viewports = await page.$$('[data-testid="viewport"]');
      expect(viewports.length).toBeGreaterThan(0);
      
      for (const viewport of viewports) {
        const isImageLoaded = await viewport.evaluate(el => {
          const canvas = el.querySelector('canvas');
          return canvas && canvas.getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0;
        });
        expect(isImageLoaded).toBe(true);
      }
    });

    test('should maintain frame rate during virtual series scrolling', async () => {
      const ctStudy = testData.studies.find(s => s.modality === 'CT' && s.imageCount > 100);
      await TestHelpers.loadStudy(page, ctStudy.studyId);
      
      await page.waitForSelector('[data-testid="virtual-series-component"]');
      
      // Monitor frame rate during scrolling
      const frameRateMonitor = await page.evaluate(() => {
        let frameCount = 0;
        let startTime = performance.now();
        
        const monitorFrameRate = () => {
          frameCount++;
          requestAnimationFrame(monitorFrameRate);
        };
        
        monitorFrameRate();
        
        return new Promise((resolve) => {
          setTimeout(() => {
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            const fps = frameCount / duration;
            resolve(fps);
          }, 2000);
        });
      });
      
      // Trigger continuous scrolling
      await page.keyboard.down('ArrowDown');
      await page.waitForTimeout(2000);
      await page.keyboard.up('ArrowDown');
      
      const actualFps = await frameRateMonitor;
      
      // Frame rate regression check
      expect(actualFps).toBeGreaterThanOrEqual(TestConfig.performance.frameRate.minimum);
    });

    test('should handle large dataset scrolling without memory leaks', async () => {
      const largeStudy = testData.studies.find(s => s.imageCount > 500);
      await TestHelpers.loadStudy(page, largeStudy.studyId);
      
      // Monitor memory usage before scrolling
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      // Perform extensive scrolling
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(50);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      // Monitor memory usage after scrolling
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      // Memory leak regression check
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        // Memory increase should be reasonable (less than 50% for large datasets)
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });
  });

  /**
   * Enhanced Patient Header Regression Tests
   */
  describe('Enhanced Patient Header Regression Tests', () => {
    test('should display enhanced patient information correctly', async () => {
      const studyWithPatientInfo = testData.studies.find(s => s.patientData);
      await TestHelpers.loadStudy(page, studyWithPatientInfo.studyId);
      
      // Wait for enhanced header to load
      await page.waitForSelector('[data-testid="enhanced-patient-header"]');
      
      // Verify all required patient information is displayed
      const patientInfo = await page.evaluate(() => {
        const header = document.querySelector('[data-testid="enhanced-patient-header"]');
        return {
          patientName: header.querySelector('[data-testid="patient-name"]')?.textContent,
          patientId: header.querySelector('[data-testid="patient-id"]')?.textContent,
          patientAge: header.querySelector('[data-testid="patient-age"]')?.textContent,
          patientSex: header.querySelector('[data-testid="patient-sex"]')?.textContent,
          studyDate: header.querySelector('[data-testid="study-date"]')?.textContent,
          modality: header.querySelector('[data-testid="modality"]')?.textContent
        };
      });
      
      // Regression checks for patient information display
      expect(patientInfo.patientName).toBeTruthy();
      expect(patientInfo.patientId).toBeTruthy();
      expect(patientInfo.studyDate).toBeTruthy();
      expect(patientInfo.modality).toBeTruthy();
      
      // Visual regression check - ensure header layout is correct
      const headerBounds = await page.locator('[data-testid="enhanced-patient-header"]').boundingBox();
      expect(headerBounds.height).toBeGreaterThan(60); // Minimum header height
      expect(headerBounds.width).toBeGreaterThan(300); // Minimum header width
    });

    test('should update patient header when switching studies', async () => {
      // Load first study
      const firstStudy = testData.studies[0];
      await TestHelpers.loadStudy(page, firstStudy.studyId);
      await page.waitForSelector('[data-testid="enhanced-patient-header"]');
      
      const firstPatientName = await page.textContent('[data-testid="patient-name"]');
      
      // Load second study
      const secondStudy = testData.studies[1];
      await TestHelpers.loadStudy(page, secondStudy.studyId);
      
      // Wait for header update
      await page.waitForFunction((expectedName) => {
        const nameElement = document.querySelector('[data-testid="patient-name"]');
        return nameElement && nameElement.textContent !== expectedName;
      }, firstPatientName, { timeout: 5000 });
      
      const secondPatientName = await page.textContent('[data-testid="patient-name"]');
      
      // Regression check - header should update correctly
      expect(secondPatientName).not.toBe(firstPatientName);
      expect(secondPatientName).toBeTruthy();
    });

    test('should maintain header responsiveness across viewport sizes', async () => {
      await TestHelpers.loadStudy(page, testData.studies[0].studyId);
      await page.waitForSelector('[data-testid="enhanced-patient-header"]');
      
      // Test different viewport sizes
      const viewportSizes = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1024, height: 768 },
        { width: 768, height: 1024 }
      ];
      
      for (const size of viewportSizes) {
        await page.setViewportSize(size);
        await page.waitForTimeout(500); // Allow layout to settle
        
        // Check header visibility and layout
        const header = await page.locator('[data-testid="enhanced-patient-header"]');
        const isVisible = await header.isVisible();
        const bounds = await header.boundingBox();
        
        expect(isVisible).toBe(true);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        
        // Check that header doesn't overflow
        expect(bounds.width).toBeLessThanOrEqual(size.width);
      }
    });
  });

  /**
   * Enhanced Toolbar Regression Tests
   */
  describe('Enhanced Toolbar Regression Tests', () => {
    test('should load all enhanced toolbar tools correctly', async () => {
      await TestHelpers.loadStudy(page, testData.studies[0].studyId);
      await page.waitForSelector('[data-testid="enhanced-toolbar"]');
      
      // Verify presence of enhanced toolbar tools
      const enhancedTools = [
        'enhanced-zoom-tool',
        'enhanced-pan-tool',
        'enhanced-windowing-tool',
        'enhanced-measurement-tool',
        'enhanced-annotation-tool'
      ];
      
      for (const toolId of enhancedTools) {
        const tool = await page.$(`[data-testid="${toolId}"]`);
        expect(tool).toBeTruthy();
        
        // Verify tool is interactive
        const isEnabled = await tool.evaluate(el => !el.disabled);
        expect(isEnabled).toBe(true);
      }
    });

    test('should maintain tool state across study switches', async () => {
      await TestHelpers.loadStudy(page, testData.studies[0].studyId);
      await page.waitForSelector('[data-testid="enhanced-toolbar"]');
      
      // Activate a specific tool
      await page.click('[data-testid="enhanced-measurement-tool"]');
      
      // Verify tool is active
      const isActive = await page.evaluate(() => {
        const tool = document.querySelector('[data-testid="enhanced-measurement-tool"]');
        return tool.classList.contains('active');
      });
      expect(isActive).toBe(true);
      
      // Switch to another study
      await TestHelpers.loadStudy(page, testData.studies[1].studyId);
      await page.waitForSelector('[data-testid="enhanced-toolbar"]');
      
      // Verify tool state is maintained
      const isStillActive = await page.evaluate(() => {
        const tool = document.querySelector('[data-testid="enhanced-measurement-tool"]');
        return tool.classList.contains('active');
      });
      expect(isStillActive).toBe(true);
    });

    test('should respond to tool interactions within performance thresholds', async () => {
      await TestHelpers.loadStudy(page, testData.studies[0].studyId);
      await page.waitForSelector('[data-testid="enhanced-toolbar"]');
      
      const tools = [
        'enhanced-zoom-tool',
        'enhanced-pan-tool',
        'enhanced-windowing-tool'
      ];
      
      for (const toolId of tools) {
        const startTime = performance.now();
        
        // Click tool and wait for activation
        await page.click(`[data-testid="${toolId}"]`);
        await page.waitForFunction((id) => {
          const tool = document.querySelector(`[data-testid="${id}"]`);
          return tool && tool.classList.contains('active');
        }, toolId, { timeout: 1000 });
        
        const endTime = performance.now();
        const activationTime = endTime - startTime;
        
        // Performance regression check
        expect(activationTime).toBeLessThan(TestConfig.performance.toolActivation.maxTime);
      }
    });
  });

  /**
   * Study Comparison and Highlighting Regression Tests
   */
  describe('Study Comparison and Highlighting Regression Tests', () => {
    test('should correctly highlight differences between studies', async () => {
      // Load base study
      const baseStudy = testData.studies.find(s => s.hasComparison);
      await TestHelpers.loadStudy(page, baseStudy.studyId);
      
      // Enable comparison mode
      await page.click('[data-testid="comparison-mode-button"]');
      await page.waitForSelector('[data-testid="study-comparison-panel"]');
      
      // Load comparison study
      await TestHelpers.loadComparisonStudy(page, baseStudy.comparisonStudyId);
      
      // Wait for highlighting to complete
      await page.waitForSelector('[data-testid="difference-highlights"]', { timeout: 10000 });
      
      // Verify highlights are present
      const highlights = await page.$$('[data-testid="difference-highlight"]');
      expect(highlights.length).toBeGreaterThan(0);
      
      // Verify highlighting performance
      const highlightingTime = await page.evaluate(() => {
        return window.comparisonMetrics ? window.comparisonMetrics.highlightingTime : 0;
      });
      
      expect(highlightingTime).toBeLessThan(TestConfig.performance.highlighting.maxTime);
    });

    test('should maintain comparison state during viewport manipulation', async () => {
      const comparisonStudy = testData.studies.find(s => s.hasComparison);
      await TestHelpers.loadStudy(page, comparisonStudy.studyId);
      
      // Enable comparison and load comparison study
      await page.click('[data-testid="comparison-mode-button"]');
      await TestHelpers.loadComparisonStudy(page, comparisonStudy.comparisonStudyId);
      await page.waitForSelector('[data-testid="difference-highlights"]');
      
      const initialHighlightCount = await page.$$eval('[data-testid="difference-highlight"]', 
        highlights => highlights.length);
      
      // Perform viewport manipulations
      await TestHelpers.performZoom(page, 2.0);
      await TestHelpers.performPan(page, 100, 100);
      await TestHelpers.performWindowLevel(page, 400, 40);
      
      // Verify highlights are still present and correct
      const finalHighlightCount = await page.$$eval('[data-testid="difference-highlight"]', 
        highlights => highlights.length);
      
      expect(finalHighlightCount).toBe(initialHighlightCount);
      
      // Verify highlights are still visible
      const visibleHighlights = await page.$$eval('[data-testid="difference-highlight"]',
        highlights => highlights.filter(h => h.offsetWidth > 0 && h.offsetHeight > 0).length);
      
      expect(visibleHighlights).toBeGreaterThan(0);
    });
  });

  /**
   * Hanging Protocol Enhancements Regression Tests
   */
  describe('Hanging Protocol Enhancements Regression Tests', () => {
    test('should apply enhanced hanging protocols correctly', async () => {
      const multiModalityStudy = testData.studies.find(s => 
        s.modalities && s.modalities.length > 1);
      
      await TestHelpers.loadStudy(page, multiModalityStudy.studyId);
      
      // Select enhanced hanging protocol
      await page.click('[data-testid="hanging-protocol-selector"]');
      await page.click('[data-testid="enhanced-hanging-protocol"]');
      
      // Wait for layout to apply
      await page.waitForFunction(() => {
        const viewports = document.querySelectorAll('[data-testid="viewport"]');
        return viewports.length > 1;
      }, { timeout: 5000 });
      
      // Verify layout is correct
      const viewports = await page.$$('[data-testid="viewport"]');
      expect(viewports.length).toBeGreaterThanOrEqual(2);
      
      // Verify each viewport has appropriate content
      for (const viewport of viewports) {
        const hasImage = await viewport.evaluate(el => {
          const canvas = el.querySelector('canvas');
          return canvas && canvas.width > 0 && canvas.height > 0;
        });
        expect(hasImage).toBe(true);
      }
    });

    test('should maintain hanging protocol performance standards', async () => {
      const hangingProtocolStudy = testData.studies.find(s => s.modalities?.length > 1);
      await TestHelpers.loadStudy(page, hangingProtocolStudy.studyId);
      
      const protocolNames = [
        'enhanced-hanging-protocol',
        'comparison-hanging-protocol',
        'multi-series-protocol'
      ];
      
      for (const protocolName of protocolNames) {
        const startTime = performance.now();
        
        // Apply hanging protocol
        await page.click('[data-testid="hanging-protocol-selector"]');
        await page.click(`[data-testid="${protocolName}"]`);
        
        // Wait for layout completion
        await page.waitForFunction(() => {
          const layouts = document.querySelectorAll('[data-testid="viewport"]');
          return layouts.length > 0 && 
                 Array.from(layouts).every(l => l.querySelector('canvas'));
        }, { timeout: 5000 });
        
        const endTime = performance.now();
        const layoutTime = endTime - startTime;
        
        // Performance regression check
        expect(layoutTime).toBeLessThan(TestConfig.performance.layoutChange.maxTime);
      }
    });
  });

  /**
   * Color-Coded Priority System Regression Tests
   */
  describe('Color-Coded Priority System Regression Tests', () => {
    test('should correctly apply priority color coding', async () => {
      const emergencyStudy = testData.studies.find(s => s.priority === 'emergency');
      const routineStudy = testData.studies.find(s => s.priority === 'routine');
      
      // Test emergency priority
      await TestHelpers.loadStudy(page, emergencyStudy.studyId);
      
      const emergencyColor = await page.evaluate(() => {
        const header = document.querySelector('[data-testid="enhanced-patient-header"]');
        return window.getComputedStyle(header).backgroundColor;
      });
      
      expect(emergencyColor).toMatch(/rgb\(255,\s*0,\s*0\)|#ff0000|red/i); // Red for emergency
      
      // Test routine priority
      await TestHelpers.loadStudy(page, routineStudy.studyId);
      
      const routineColor = await page.evaluate(() => {
        const header = document.querySelector('[data-testid="enhanced-patient-header"]');
        return window.getComputedStyle(header).backgroundColor;
      });
      
      expect(routineColor).not.toMatch(/rgb\(255,\s*0,\s*0\)|#ff0000|red/i); // Not red for routine
    });

    test('should maintain priority indicators across viewport changes', async () => {
      const urgentStudy = testData.studies.find(s => s.priority === 'urgent');
      await TestHelpers.loadStudy(page, urgentStudy.studyId);
      
      // Get initial priority indicator
      const initialIndicator = await page.evaluate(() => {
        const indicator = document.querySelector('[data-testid="priority-indicator"]');
        return {
          color: window.getComputedStyle(indicator).backgroundColor,
          visible: indicator.offsetWidth > 0 && indicator.offsetHeight > 0
        };
      });
      
      // Perform viewport changes
      await TestHelpers.performZoom(page, 1.5);
      await TestHelpers.performPan(page, 50, 50);
      
      // Verify priority indicator is maintained
      const finalIndicator = await page.evaluate(() => {
        const indicator = document.querySelector('[data-testid="priority-indicator"]');
        return {
          color: window.getComputedStyle(indicator).backgroundColor,
          visible: indicator.offsetWidth > 0 && indicator.offsetHeight > 0
        };
      });
      
      expect(finalIndicator.color).toBe(initialIndicator.color);
      expect(finalIndicator.visible).toBe(true);
    });
  });

  /**
   * Integration and Cross-Feature Regression Tests
   */
  describe('Integration and Cross-Feature Regression Tests', () => {
    test('should maintain feature integration when all features are active', async () => {
      const complexStudy = testData.studies.find(s => 
        s.imageCount > 100 && s.modalities?.length > 1);
      
      await TestHelpers.loadStudy(page, complexStudy.studyId);
      
      // Activate all enhanced features
      await page.click('[data-testid="virtual-series-toggle"]');
      await page.click('[data-testid="comparison-mode-button"]');
      await page.click('[data-testid="enhanced-hanging-protocol"]');
      
      // Wait for all features to initialize
      await page.waitForSelector('[data-testid="virtual-series-component"]');
      await page.waitForSelector('[data-testid="comparison-panel"]');
      await page.waitForSelector('[data-testid="enhanced-layout"]');
      
      // Test feature interactions
      await TestHelpers.performComplexWorkflow(page);
      
      // Verify all features remain functional
      const featureStates = await page.evaluate(() => ({
        virtualSeries: !!document.querySelector('[data-testid="virtual-series-component"]'),
        comparison: !!document.querySelector('[data-testid="comparison-panel"]'),
        enhancedLayout: !!document.querySelector('[data-testid="enhanced-layout"]'),
        prioritySystem: !!document.querySelector('[data-testid="priority-indicator"]')
      }));
      
      expect(featureStates.virtualSeries).toBe(true);
      expect(featureStates.comparison).toBe(true);
      expect(featureStates.enhancedLayout).toBe(true);
      expect(featureStates.prioritySystem).toBe(true);
    });

    test('should maintain system performance with all features active', async () => {
      const performanceStudy = testData.studies.find(s => s.imageCount > 200);
      
      const startTime = performance.now();
      
      await TestHelpers.loadStudy(page, performanceStudy.studyId);
      
      // Activate all features
      await page.click('[data-testid="virtual-series-toggle"]');
      await page.click('[data-testid="comparison-mode-button"]');
      await page.click('[data-testid="enhanced-hanging-protocol"]');
      
      // Wait for complete initialization
      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="virtual-series-component"]') &&
               document.querySelector('[data-testid="comparison-panel"]') &&
               document.querySelector('[data-testid="enhanced-layout"]');
      }, { timeout: 15000 });
      
      const endTime = performance.now();
      const totalLoadTime = endTime - startTime;
      
      // Performance regression check for full feature load
      expect(totalLoadTime).toBeLessThan(TestConfig.performance.fullFeatureLoad.maxTime);
      
      // Memory usage check
      const memoryUsage = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      if (memoryUsage > 0) {
        expect(memoryUsage).toBeLessThan(TestConfig.performance.memory.peak);
      }
    });
  });

  /**
   * Error Handling and Recovery Regression Tests
   */
  describe('Error Handling and Recovery Regression Tests', () => {
    test('should gracefully handle network errors', async () => {
      // Intercept network requests to simulate errors
      await page.route('**/api/studies/**', route => {
        if (Math.random() < 0.3) { // 30% chance of network error
          route.abort('internetdisconnected');
        } else {
          route.continue();
        }
      });
      
      const studyWithRetry = testData.studies[0];
      await TestHelpers.loadStudy(page, studyWithRetry.studyId);
      
      // Verify error handling UI is present
      const errorHandler = await page.waitForSelector('[data-testid="error-handler"]', { 
        timeout: 10000 
      });
      expect(errorHandler).toBeTruthy();
      
      // Verify retry functionality
      await page.click('[data-testid="retry-button"]');
      
      // Should eventually succeed
      await page.waitForSelector('[data-testid="enhanced-patient-header"]', { 
        timeout: 15000 
      });
    });

    test('should maintain feature stability during error recovery', async () => {
      // Simulate memory pressure
      await page.evaluate(() => {
        // Create memory pressure
        const arrays = [];
        for (let i = 0; i < 1000; i++) {
          arrays.push(new Array(10000).fill(Math.random()));
        }
        window.memoryPressureArrays = arrays;
      });
      
      await TestHelpers.loadStudy(page, testData.studies[0].studyId);
      
      // Activate features under memory pressure
      await page.click('[data-testid="virtual-series-toggle"]');
      await page.click('[data-testid="enhanced-toolbar-tool"]');
      
      // Clean up memory pressure
      await page.evaluate(() => {
        delete window.memoryPressureArrays;
        if (window.gc) window.gc();
      });
      
      // Verify features remain functional
      const virtualSeriesActive = await page.isVisible('[data-testid="virtual-series-component"]');
      const toolbarActive = await page.isVisible('[data-testid="enhanced-toolbar"]');
      
      expect(virtualSeriesActive).toBe(true);
      expect(toolbarActive).toBe(true);
    });
  });
});

/**
 * Test Utilities and Helpers
 */

// Performance monitoring utilities
function setupPerformanceMonitoring(page) {
  return page.addInitScript(() => {
    window.performanceMetrics = {
      startTime: performance.now(),
      measurements: [],
      
      mark(name) {
        const time = performance.now();
        this.measurements.push({ name, time, type: 'mark' });
        return time;
      },
      
      measure(name, startMark, endMark) {
        const start = this.measurements.find(m => m.name === startMark)?.time || this.startTime;
        const end = this.measurements.find(m => m.name === endMark)?.time || performance.now();
        const duration = end - start;
        this.measurements.push({ name, duration, type: 'measure' });
        return duration;
      }
    };
  });
}

// Error injection utilities
function setupErrorInjection(page) {
  return page.addInitScript(() => {
    window.injectError = (errorType, probability = 0.1) => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        if (Math.random() < probability) {
          return Promise.reject(new Error(`Injected ${errorType} error`));
        }
        return originalFetch.apply(this, args);
      };
    };
  });
}

// Memory leak detection utilities
function setupMemoryLeakDetection(page) {
  return page.addInitScript(() => {
    window.memoryLeakDetector = {
      initialMemory: performance.memory ? performance.memory.usedJSHeapSize : 0,
      snapshots: [],
      
      takeSnapshot(label) {
        if (performance.memory) {
          this.snapshots.push({
            label,
            memory: performance.memory.usedJSHeapSize,
            timestamp: performance.now()
          });
        }
      },
      
      detectLeaks() {
        if (this.snapshots.length < 2) return false;
        
        const trend = this.snapshots.slice(-5); // Last 5 snapshots
        const memoryIncreases = trend.slice(1).every((snapshot, index) => 
          snapshot.memory > trend[index].memory
        );
        
        return memoryIncreases;
      }
    };
  });
}

module.exports = {
  setupPerformanceMonitoring,
  setupErrorInjection,
  setupMemoryLeakDetection
}; 