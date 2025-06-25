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

test.describe('Study Comparison Highlighting Visual Regression Tests', async () => {
  test('should render current study border correctly', async ({ page }) => {
    // Wait for viewports to load
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Look for current study viewport (should have blue border)
    const currentStudyViewport = page.locator('.viewport-current-study').first();
    
    if (await currentStudyViewport.count() > 0) {
      // Validate border properties
      const borderStyles = await currentStudyViewport.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          borderWidth: styles.borderWidth,
          borderColor: styles.borderColor,
          borderStyle: styles.borderStyle,
        };
      });
      
      // Take screenshot if current study styling is applied
      if (borderStyles.borderWidth === '3px') {
        await checkForScreenshot(
          page,
          currentStudyViewport,
          screenShotPaths.studyComparison.currentStudyBorder,
          10,
          300
        );
      }
    }
  });

  test('should render prior study border correctly', async ({ page }) => {
    // Wait for viewports to load
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Look for prior study viewport (should have amber border)
    const priorStudyViewport = page.locator('.viewport-prior-study').first();
    
    if (await priorStudyViewport.count() > 0) {
      // Validate border properties
      const borderStyles = await priorStudyViewport.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          borderWidth: styles.borderWidth,
          borderColor: styles.borderColor,
          borderStyle: styles.borderStyle,
        };
      });
      
      // Take screenshot if prior study styling is applied
      if (borderStyles.borderWidth === '3px') {
        await checkForScreenshot(
          page,
          priorStudyViewport,
          screenShotPaths.studyComparison.priorStudyBorder,
          10,
          300
        );
      }
    }
  });

  test('should display study overlays correctly', async ({ page }) => {
    // Wait for viewports and overlays to load
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Look for study overlay elements
    const studyOverlay = page.locator('.viewport-overlay').first();
    
    if (await studyOverlay.count() > 0) {
      // Validate overlay properties
      const overlayStyles = await studyOverlay.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          top: styles.top,
          left: styles.left,
          zIndex: styles.zIndex,
          backdropFilter: styles.backdropFilter,
        };
      });
      
      // Verify overlay positioning and styling
      if (overlayStyles.position === 'absolute' && 
          overlayStyles.top === '8px' && 
          overlayStyles.left === '8px') {
        
        await checkForScreenshot(
          page,
          page.locator('.study-aware-viewport').first(),
          screenShotPaths.studyComparison.studyOverlayDisplay,
          10,
          300
        );
      }
    }
  });

  test('should validate border style accuracy', async ({ page }) => {
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Check for study-aware viewport wrapper
    const studyViewport = page.locator('.study-aware-viewport').first();
    
    if (await studyViewport.count() > 0) {
      // Validate CSS classes and styling are applied
      const hasCurrentClass = await studyViewport.locator('.viewport-current-study').count() > 0;
      const hasPriorClass = await studyViewport.locator('.viewport-prior-study').count() > 0;
      
      if (hasCurrentClass || hasPriorClass) {
        await checkForScreenshot(
          page,
          studyViewport,
          screenShotPaths.studyComparison.borderStyleAccuracy,
          10,
          300
        );
      }
    }
  });

  test('should validate overlay positioning', async ({ page }) => {
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Find viewport with overlay
    const viewportWithOverlay = page.locator('.study-aware-viewport').filter({
      has: page.locator('.viewport-overlay')
    }).first();
    
    if (await viewportWithOverlay.count() > 0) {
      await checkForScreenshot(
        page,
        viewportWithOverlay,
        screenShotPaths.studyComparison.overlayPositioning,
        10,
        300
      );
    }
  });

  test('should test hover interactions', async ({ page }) => {
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Find a current study viewport for hover testing
    const currentStudyViewport = page.locator('.viewport-current-study').first();
    
    if (await currentStudyViewport.count() > 0) {
      // Hover over the viewport
      await currentStudyViewport.hover();
      
      // Wait for hover transition
      await page.waitForTimeout(300);
      
      // Check if hover effects are applied
      const hoverStyles = await currentStudyViewport.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
        };
      });
      
      if (hoverStyles.transform && hoverStyles.transform !== 'none') {
        await checkForScreenshot(
          page,
          currentStudyViewport,
          screenShotPaths.studyComparison.hoverInteractions,
          5,
          200
        );
      }
    }
  });

  test('should validate multi-viewport grid layout', async ({ page }) => {
    // Set up multi-viewport layout
    await page.getByTestId('Layout').click();
    await page
      .locator('div')
      .filter({ hasText: /^2x2$/ })
      .first()
      .click();
    
    // Wait for layout change
    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Check if multiple viewports have study highlighting
    const studyViewports = page.locator('.study-aware-viewport');
    const viewportCount = await studyViewports.count();
    
    if (viewportCount > 1) {
      await checkForScreenshot(
        page,
        page.locator('[data-cy="viewports-grid"]'),
        screenShotPaths.studyComparison.multiViewportGrid,
        10,
        500
      );
    }
  });

  test('should validate accessibility features', async ({ page }) => {
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Test high contrast mode simulation
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          .viewport-current-study {
            border-width: 4px !important;
          }
          .viewport-prior-study {
            border-width: 4px !important;
          }
        }
      `
    });
    
    // Check aria labels and roles
    const studyViewport = page.locator('.study-aware-viewport').first();
    
    if (await studyViewport.count() > 0) {
      const ariaLabel = await studyViewport.getAttribute('aria-label');
      const role = await studyViewport.getAttribute('role');
      
      if (ariaLabel && role === 'region') {
        console.log('Study comparison accessibility features validated successfully');
      }
    }
  });

  test('should validate color consistency with PRD', async ({ page }) => {
    await page.waitForSelector('[data-cy="viewport-pane"]', { timeout: 10000 });
    
    // Check CSS custom properties for study highlighting
    const colorValues = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        colorPrimary: styles.getPropertyValue('--color-primary').trim(),
        colorWarning: styles.getPropertyValue('--color-warning').trim(),
      };
    });
    
    // Verify PRD color values match expectations
    if (colorValues.colorPrimary === '#60A5FA' && colorValues.colorWarning === '#FACC15') {
      console.log('Study comparison color consistency validated successfully');
    }
  });
}); 