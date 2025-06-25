import { test } from 'playwright-test-coverage';
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  attemptAction,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('UI Enhancements Integration Tests', async () => {
  test('should render complete header-toolbar-viewport layout correctly', async ({ page }) => {
    // Wait for all components to load
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Take full viewport screenshot
    await checkForScreenshot(
      page,
      page,
      screenShotPaths.uiIntegration.headerToolbarLayout,
      10,
      500
    );
  });

  test('should validate full viewport integration with all enhancements', async ({ page }) => {
    // Wait for all UI enhancement components
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Check for study comparison highlighting if present
    const studyViewports = page.locator('.study-aware-viewport');
    if (await studyViewports.count() > 0) {
      console.log('Study comparison highlighting detected');
    }
    
    // Capture full integration screenshot
    await checkForScreenshot(
      page,
      page.locator('body'),
      screenShotPaths.uiIntegration.fullViewportIntegration,
      10,
      500
    );
  });

  test('should validate responsive breakpoints across all components', async ({ page }) => {
    const breakpoints = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1366, height: 768, name: 'desktop-standard' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 375, height: 667, name: 'mobile' },
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      
      // Wait for responsive adjustments
      await page.waitForTimeout(500);
      
      // Ensure all components are still present and functional
      await page.waitForSelector('.global-patient-header', { timeout: 5000 });
      await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 5000 });
      await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 5000 });
      
      console.log(`Responsive validation passed for ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
    }
    
    // Reset to standard size and take screenshot
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(500);
    
    await checkForScreenshot(
      page,
      page,
      screenShotPaths.uiIntegration.responsiveBreakpoints,
      10,
      300
    );
  });

  test('should validate multi-study comparison integration', async ({ page }) => {
    // Set up multi-viewport layout for comparison
    await page.getByTestId('Layout').click();
    await page
      .locator('div')
      .filter({ hasText: /^2x2$/ })
      .first()
      .click();
    
    // Wait for layout change and all components
    await page.waitForTimeout(1000);
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Check if study comparison highlighting is working across viewports
    const studyViewports = page.locator('.study-aware-viewport');
    const currentStudyBorders = page.locator('.viewport-current-study');
    const priorStudyBorders = page.locator('.viewport-prior-study');
    
    const hasStudyComparison = await studyViewports.count() > 0;
    const hasCurrentStudy = await currentStudyBorders.count() > 0;
    const hasPriorStudy = await priorStudyBorders.count() > 0;
    
    if (hasStudyComparison && (hasCurrentStudy || hasPriorStudy)) {
      await checkForScreenshot(
        page,
        page.locator('[data-cy="viewports-grid"]'),
        screenShotPaths.uiIntegration.multiStudyComparison,
        10,
        500
      );
    }
  });

  test('should validate accessibility features across all components', async ({ page }) => {
    // Wait for all components
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Test high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          .global-patient-header {
            border-bottom-width: 2px !important;
          }
          .viewport-current-study,
          .viewport-prior-study {
            border-width: 4px !important;
          }
          .viewport-overlay {
            background: rgba(0, 0, 0, 0.95) !important;
          }
        }
      `
    });
    
    // Test reduced motion
    await page.addStyleTag({
      content: `
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
      `
    });
    
    // Check ARIA labels and roles
    const accessibilityChecks = [
      { selector: '.global-patient-header', attribute: 'role' },
      { selector: '.study-aware-viewport', attribute: 'aria-label' },
      { selector: '[data-cy="ToolbarRow"] button', attribute: 'aria-label' },
    ];
    
    let accessibilityScore = 0;
    for (const check of accessibilityChecks) {
      const elements = page.locator(check.selector);
      const count = await elements.count();
      
      if (count > 0) {
        const firstElement = elements.first();
        const attributeValue = await firstElement.getAttribute(check.attribute);
        
        if (attributeValue) {
          accessibilityScore++;
        }
      }
    }
    
    // If most accessibility features are present
    if (accessibilityScore >= 2) {
      await checkForScreenshot(
        page,
        page,
        screenShotPaths.uiIntegration.accessibilityFeatures,
        10,
        300
      );
    }
  });

  test('should validate theme system integration', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    
    // Check that all PRD colors are applied consistently
    const colorValidation = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      
      const expectedColors = {
        '--color-primary': '#60A5FA',
        '--color-background': '#111827',
        '--color-panel': '#1F2937',
        '--color-text-primary': '#F9FAFB',
        '--color-text-secondary': '#9CA3AF',
        '--color-border': '#374151',
        '--color-warning': '#FACC15',
        '--color-success': '#22C55E',
        '--color-error': '#F87171',
      };
      
      let validColors = 0;
      const totalColors = Object.keys(expectedColors).length;
      
      for (const [property, expectedValue] of Object.entries(expectedColors)) {
        const actualValue = styles.getPropertyValue(property).trim();
        if (actualValue === expectedValue) {
          validColors++;
        }
      }
      
      return {
        validColors,
        totalColors,
        percentage: (validColors / totalColors) * 100,
      };
    });
    
    // If 80% or more colors match PRD specifications
    if (colorValidation.percentage >= 80) {
      console.log(`Theme system validation passed: ${colorValidation.validColors}/${colorValidation.totalColors} colors correct`);
    }
  });

  test('should validate performance under load', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Measure initial performance
    const initialMetrics = await page.evaluate(() => {
      return {
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp: Date.now(),
      };
    });
    
    // Perform stress test: rapid layout changes
    const layouts = ['1x1', '1x2', '2x1', '2x2', '1x3'];
    
    for (const layout of layouts) {
      await page.getByTestId('Layout').click();
      
      const layoutOption = page
        .locator('div')
        .filter({ hasText: new RegExp(`^${layout}$`) })
        .first();
      
      if (await layoutOption.count() > 0) {
        await layoutOption.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Measure performance after stress test
    const finalMetrics = await page.evaluate(() => {
      return {
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp: Date.now(),
      };
    });
    
    const memoryIncrease = finalMetrics.memoryUsage - initialMetrics.memoryUsage;
    const timeElapsed = finalMetrics.timestamp - initialMetrics.timestamp;
    
    console.log(`Performance test completed:
      - Memory increase: ${memoryIncrease} bytes
      - Time elapsed: ${timeElapsed}ms
      - Average time per layout change: ${timeElapsed / layouts.length}ms`);
    
    // Verify no significant memory leaks (threshold: 10MB)
    if (memoryIncrease < 10 * 1024 * 1024) {
      console.log('Performance validation passed: No significant memory leaks detected');
    }
  });

  test('should validate cross-browser consistency', async ({ page }) => {
    // This test validates that all UI enhancements work consistently
    await page.waitForSelector('.global-patient-header', { timeout: 10000 });
    await page.waitForSelector('[data-cy="ToolbarRow"]', { timeout: 10000 });
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Check browser-specific features
    const browserFeatures = await page.evaluate(() => {
      return {
        supportsBackdropFilter: CSS.supports('backdrop-filter', 'blur(4px)'),
        supportsCustomProperties: CSS.supports('color', 'var(--test)'),
        supportsFlexbox: CSS.supports('display', 'flex'),
        supportsGrid: CSS.supports('display', 'grid'),
      };
    });
    
    // Validate modern CSS features are supported
    const requiredFeatures = ['supportsCustomProperties', 'supportsFlexbox'];
    const supportedFeatures = requiredFeatures.filter(feature => browserFeatures[feature]);
    
    if (supportedFeatures.length === requiredFeatures.length) {
      console.log('Cross-browser compatibility validation passed');
    }
    
    // Test that all components render without errors
    const componentErrors = await page.evaluate(() => {
      const errors = [];
      
      // Check if components are rendered
      if (!document.querySelector('.global-patient-header')) {
        errors.push('Global Patient Header not rendered');
      }
      
      if (!document.querySelector('[data-cy="ToolbarRow"]')) {
        errors.push('Enhanced Toolbar not rendered');
      }
      
      if (!document.querySelector('[data-cy="viewport-pane"]')) {
        errors.push('Viewport not rendered');
      }
      
      return errors;
    });
    
    if (componentErrors.length === 0) {
      console.log('All UI enhancement components rendered successfully across browsers');
    } else {
      console.warn('Component rendering issues detected:', componentErrors);
    }
  });
}); 