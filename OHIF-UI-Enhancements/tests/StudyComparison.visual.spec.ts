/**
 * Study Comparison Visual Verification Tests
 * 
 * Comprehensive visual testing for study comparison highlighting
 * covering all viewport layouts, study scenarios, and edge cases.
 * 
 * Task 3.6: Conduct Visual Verification
 */

import { test, expect, Page } from '@playwright/test';
import { checkForScreenshot, setStudyData, loadTestStudies } from './utils';

const VISUAL_TEST_CONFIG = {
  threshold: 0.04, // 4% tolerance for visual differences
  animations: 'disabled' as const,
  mode: 'dark' as const,
  clip: undefined // Full screen captures
};

/**
 * Visual Test Scenarios for Study Comparison Highlighting
 */
const STUDY_SCENARIOS = {
  singleStudy: {
    name: 'Single Current Study',
    studies: [{ uid: 'study1', date: '20231201', type: 'current' }],
    expectedHighlight: 'current'
  },
  currentAndPrior: {
    name: 'Current and Prior Studies',
    studies: [
      { uid: 'study1', date: '20231201', type: 'current' },
      { uid: 'study2', date: '20231115', type: 'prior' }
    ],
    expectedHighlight: 'mixed'
  },
  multiplePriors: {
    name: 'Multiple Prior Studies',
    studies: [
      { uid: 'study1', date: '20231201', type: 'current' },
      { uid: 'study2', date: '20231115', type: 'prior' },
      { uid: 'study3', date: '20231101', type: 'prior' }
    ],
    expectedHighlight: 'mixed'
  },
  sameDayStudies: {
    name: 'Same Day Studies',
    studies: [
      { uid: 'study1', date: '20231201', type: 'current' },
      { uid: 'study2', date: '20231201', type: 'current' }
    ],
    expectedHighlight: 'ambiguous'
  }
};

const VIEWPORT_LAYOUTS = {
  single: { rows: 1, columns: 1, name: '1x1 Single Viewport' },
  twoByOne: { rows: 1, columns: 2, name: '1x2 Side by Side' },
  twoByTwo: { rows: 2, columns: 2, name: '2x2 Quad View' },
  threeByThree: { rows: 3, columns: 3, name: '3x3 Multi View' }
};

test.describe('Study Comparison Visual Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configure for consistent visual testing
    await page.addInitScript(() => {
      // Disable animations for consistent screenshots
      const css = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    });
  });

  Object.entries(STUDY_SCENARIOS).forEach(([scenarioKey, scenario]) => {
    Object.entries(VIEWPORT_LAYOUTS).forEach(([layoutKey, layout]) => {
      
      test(`Visual: ${scenario.name} - ${layout.name}`, async ({ page }) => {
        // Setup test environment
        await setupTestEnvironment(page, scenario, layout);
        
        // Wait for study comparison to load and process
        await page.waitForSelector('.study-aware-viewport', { timeout: 10000 });
        await page.waitForTimeout(1000); // Allow highlighting to settle
        
        // Take initial screenshot
        const screenshotPath = `study-comparison-${scenarioKey}-${layoutKey}`;
        await checkForScreenshot(page, screenshotPath, VISUAL_TEST_CONFIG);
        
        // Validate highlighting visual elements
        await validateStudyHighlighting(page, scenario, layout);
        
        // Test hover states if multiple viewports
        if (layout.rows * layout.columns > 1) {
          await testHoverStates(page, screenshotPath, layout);
        }
        
        // Test overlay visibility and content
        await testStudyOverlays(page, scenario, screenshotPath);
        
        // Test responsive behavior
        await testResponsiveBehavior(page, scenario, layout, screenshotPath);
      });
    });
  });

  test.describe('Edge Cases Visual Testing', () => {
    
    test('Visual: Missing Study Data', async ({ page }) => {
      await setupTestEnvironment(page, {
        name: 'Missing Study Data',
        studies: [{ uid: 'invalid', date: null, type: 'default' }],
        expectedHighlight: 'default'
      }, VIEWPORT_LAYOUTS.single);
      
      await page.waitForSelector('.study-aware-viewport');
      await checkForScreenshot(page, 'study-comparison-missing-data', VISUAL_TEST_CONFIG);
      
      // Verify no highlighting appears for invalid data
      const currentBorder = await page.locator('.viewport-current-study').count();
      const priorBorder = await page.locator('.viewport-prior-study').count();
      expect(currentBorder + priorBorder).toBe(0);
    });

    test('Visual: Study Loading States', async ({ page }) => {
      await setupTestEnvironment(page, STUDY_SCENARIOS.currentAndPrior, VIEWPORT_LAYOUTS.twoByOne);
      
      // Capture loading state
      await checkForScreenshot(page, 'study-comparison-loading', VISUAL_TEST_CONFIG);
      
      // Wait for completion and capture final state
      await page.waitForSelector('.viewport-current-study', { timeout: 10000 });
      await checkForScreenshot(page, 'study-comparison-loaded', VISUAL_TEST_CONFIG);
    });

    test('Visual: Accessibility High Contrast Mode', async ({ page }) => {
      // Enable high contrast mode
      await page.addInitScript(() => {
        document.documentElement.style.setProperty('forced-colors', 'active');
      });
      
      await setupTestEnvironment(page, STUDY_SCENARIOS.currentAndPrior, VIEWPORT_LAYOUTS.twoByTwo);
      await page.waitForSelector('.study-aware-viewport');
      
      await checkForScreenshot(page, 'study-comparison-high-contrast', VISUAL_TEST_CONFIG);
    });
  });

  test.describe('Animation and Transition Testing', () => {
    
    test('Visual: Study Type Transitions', async ({ page }) => {
      // Enable animations for transition testing
      await page.addInitScript(() => {
        const style = document.querySelector('style[data-test-disable-animations]');
        if (style) style.remove();
      });
      
      await setupTestEnvironment(page, STUDY_SCENARIOS.singleStudy, VIEWPORT_LAYOUTS.single);
      await page.waitForSelector('.viewport-current-study');
      
      // Capture initial state
      await checkForScreenshot(page, 'study-transition-before', VISUAL_TEST_CONFIG);
      
      // Simulate study data change
      await changeStudyData(page, STUDY_SCENARIOS.currentAndPrior);
      
      // Wait for transition to complete
      await page.waitForTimeout(500);
      await checkForScreenshot(page, 'study-transition-after', VISUAL_TEST_CONFIG);
    });
  });
});

/**
 * Test Utilities
 */

async function setupTestEnvironment(page: Page, scenario: any, layout: any) {
  // Navigate to OHIF viewer
  await page.goto('/viewer?StudyInstanceUIDs=' + scenario.studies.map(s => s.uid).join(','));
  
  // Configure viewport layout
  await page.click(`[data-cy="layout-${layout.rows}x${layout.columns}"]`);
  
  // Load test studies
  await loadTestStudies(page, scenario.studies);
  
  // Wait for StudyAwareViewport components to initialize
  await page.waitForFunction(() => {
    return document.querySelectorAll('.study-aware-viewport').length > 0;
  });
}

async function validateStudyHighlighting(page: Page, scenario: any, layout: any) {
  const viewportCount = layout.rows * layout.columns;
  const currentViewports = await page.locator('.viewport-current-study').count();
  const priorViewports = await page.locator('.viewport-prior-study').count();
  
  // Validate highlighting appears correctly
  expect(currentViewports + priorViewports).toBeGreaterThan(0);
  
  if (scenario.expectedHighlight === 'current') {
    expect(currentViewports).toBe(viewportCount);
    expect(priorViewports).toBe(0);
  } else if (scenario.expectedHighlight === 'mixed') {
    expect(currentViewports).toBeGreaterThan(0);
    expect(priorViewports).toBeGreaterThan(0);
  }
  
  // Validate border colors are correct
  const currentBorderColor = await page.locator('.viewport-current-study').first().evaluate(el => {
    return getComputedStyle(el).borderColor;
  });
  const priorBorderColor = await page.locator('.viewport-prior-study').first().evaluate(el => {
    return getComputedStyle(el).borderColor;
  });
  
  // Verify PRD-compliant colors (approximate RGB values)
  if (currentViewports > 0) {
    expect(currentBorderColor).toContain('96, 165, 250'); // Primary blue
  }
  if (priorViewports > 0) {
    expect(priorBorderColor).toContain('251, 191, 36'); // Warning amber
  }
}

async function testHoverStates(page: Page, baseScreenshotPath: string, layout: any) {
  const viewports = page.locator('.study-aware-viewport');
  const viewportCount = await viewports.count();
  
  for (let i = 0; i < Math.min(viewportCount, 4); i++) { // Test first 4 viewports
    await viewports.nth(i).hover();
    await page.waitForTimeout(200); // Allow hover effects to apply
    
    await checkForScreenshot(
      page, 
      `${baseScreenshotPath}-hover-${i}`, 
      VISUAL_TEST_CONFIG
    );
  }
}

async function testStudyOverlays(page: Page, scenario: any, baseScreenshotPath: string) {
  // Verify overlay content is visible and correct
  const overlays = page.locator('.viewport-overlay');
  const overlayCount = await overlays.count();
  
  expect(overlayCount).toBeGreaterThan(0);
  
  // Check overlay text content
  for (let i = 0; i < overlayCount; i++) {
    const overlay = overlays.nth(i);
    const text = await overlay.textContent();
    
    expect(text).toMatch(/(Current|Prior) Study/);
    expect(text).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Date format MM/DD/YYYY
  }
  
  // Take screenshot with overlays visible
  await checkForScreenshot(page, `${baseScreenshotPath}-overlays`, VISUAL_TEST_CONFIG);
}

async function testResponsiveBehavior(page: Page, scenario: any, layout: any, baseScreenshotPath: string) {
  const viewportSizes = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1366, height: 768, name: 'laptop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ];
  
  for (const size of viewportSizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.waitForTimeout(500); // Allow responsive layout to settle
    
    await checkForScreenshot(
      page, 
      `${baseScreenshotPath}-${size.name}`, 
      VISUAL_TEST_CONFIG
    );
    
    // Verify highlighting is still visible at different sizes
    const highlightedViewports = await page.locator('.viewport-current-study, .viewport-prior-study').count();
    expect(highlightedViewports).toBeGreaterThan(0);
  }
}

async function changeStudyData(page: Page, newScenario: any) {
  // Simulate study data change by updating DicomMetadataStore
  await page.evaluate((studies) => {
    const store = window.ohif?.services?.DicomMetadataStore;
    if (store) {
      studies.forEach(study => {
        store.addStudy({
          StudyInstanceUID: study.uid,
          StudyDate: study.date,
          PatientName: 'Test Patient'
        });
      });
    }
  }, newScenario.studies);
}

test.describe('Performance Visual Testing', () => {
  
  test('Visual: Large Dataset Performance', async ({ page }) => {
    // Test with many studies to verify highlighting performance
    const manyStudies = Array.from({ length: 20 }, (_, i) => ({
      uid: `study${i}`,
      date: `202312${(i + 1).toString().padStart(2, '0')}`,
      type: i === 19 ? 'current' : 'prior'
    }));
    
    await setupTestEnvironment(page, {
      name: 'Large Dataset',
      studies: manyStudies,
      expectedHighlight: 'mixed'
    }, VIEWPORT_LAYOUTS.threeByThree);
    
    // Measure performance while taking screenshot
    const startTime = Date.now();
    await checkForScreenshot(page, 'study-comparison-large-dataset', VISUAL_TEST_CONFIG);
    const endTime = Date.now();
    
    // Verify performance is acceptable (< 2 seconds for visual updates)
    expect(endTime - startTime).toBeLessThan(2000);
  });
}); 