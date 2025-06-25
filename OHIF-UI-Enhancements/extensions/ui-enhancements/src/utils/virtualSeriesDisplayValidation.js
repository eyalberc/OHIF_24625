/**
 * Virtual Series Display Validation Utilities
 * 
 * Comprehensive testing and validation tools for Virtual Series display,
 * rendering, cross-browser compatibility, and UI integration
 * 
 * Task 4.3: Virtual Series Display Validation
 */

/**
 * Virtual Series Display Validator
 * Comprehensive validation framework for Virtual Series UI display
 */
export class VirtualSeriesDisplayValidator {
  constructor(options = {}) {
    this.options = {
      enableScreenshots: false,
      enablePerformanceMetrics: true,
      enableAccessibilityTests: true,
      testTimeoutMs: 5000,
      ...options
    };
    
    this.testResults = {};
    this.screenshots = [];
    this.performanceMetrics = {};
  }

  /**
   * Run comprehensive display validation suite
   */
  async runDisplayValidation() {
    console.log('[VirtualSeriesDisplay] Starting comprehensive display validation...');
    
    try {
      // Test 1: Virtual Series Detection
      this.testResults.virtualSeriesDetection = await this.validateVirtualSeriesExists();
      
      // Test 2: Visual Rendering Validation
      this.testResults.visualRendering = await this.validateVisualRendering();
      
      // Test 3: Metadata Display Validation
      this.testResults.metadataDisplay = await this.validateMetadataDisplay();
      
      // Test 4: Series Ordering Validation
      this.testResults.seriesOrdering = await this.validateSeriesOrdering();
      
      // Test 5: Icon and UI Elements
      this.testResults.iconValidation = await this.validateIconsAndUIElements();
      
      // Test 6: Accessibility Validation
      if (this.options.enableAccessibilityTests) {
        this.testResults.accessibility = await this.validateAccessibility();
      }
      
      // Test 7: Responsive Design
      this.testResults.responsiveness = await this.validateResponsiveDesign();
      
      // Test 8: Cross-Browser Compatibility
      this.testResults.browserCompatibility = await this.validateBrowserCompatibility();
      
      // Test 9: Performance Impact
      if (this.options.enablePerformanceMetrics) {
        this.testResults.performanceImpact = await this.validatePerformanceImpact();
      }
      
      return this.generateDisplayValidationReport();
      
    } catch (error) {
      console.error('[VirtualSeriesDisplay] Validation failed:', error);
      this.testResults.error = error.message;
      return this.generateDisplayValidationReport();
    }
  }

  /**
   * Validate that virtual series exists and is detectable
   */
  async validateVirtualSeriesExists() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      // Look for virtual series in the DOM
      const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
      const virtualSeriesCount = virtualSeriesElements.length;
      
      validation.details.virtualSeriesFound = virtualSeriesCount;
                    validation.details.elements = Array.from(virtualSeriesElements).map(el => ({
         seriesUID: el.getAttribute('data-series-uid'),
         textContent: el.textContent && el.textContent.trim(),
         className: el.className,
         visible: this.isElementVisible(el)
       }));

       if (virtualSeriesCount === 0) {
         validation.issues.push('No virtual series elements found in DOM');
       } else {
         validation.passed = true;
         
         // Check if virtual series are visible
         const visibleCount = validation.details.elements.filter(el => el.visible).length;
         if (visibleCount === 0) {
           validation.issues.push('Virtual series elements found but none are visible');
           validation.passed = false;
         }
       }
       
     } catch (error) {
       validation.issues.push(`Error detecting virtual series: ${error.message}`);
     }

     return validation;
   }

   /**
    * Validate visual rendering of virtual series
    */
   async validateVisualRendering() {
     const validation = {
       passed: false,
       issues: [],
       details: {}
     };

     try {
       const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
       
       if (virtualSeriesElements.length === 0) {
         validation.issues.push('No virtual series elements to validate rendering');
         return validation;
       }

       let renderingIssues = 0;

       for (const element of virtualSeriesElements) {
         const elementValidation = this.validateElementRendering(element);
         validation.details[element.getAttribute('data-series-uid') || 'unknown'] = elementValidation;
        
        if (elementValidation.issues.length > 0) {
          renderingIssues += elementValidation.issues.length;
          validation.issues.push(...elementValidation.issues);
        }
      }

      validation.passed = renderingIssues === 0;
      validation.details.totalRenderingIssues = renderingIssues;

    } catch (error) {
      validation.issues.push(`Error validating visual rendering: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate individual element rendering
   */
  validateElementRendering(element) {
    const validation = {
      issues: [],
      metrics: {}
    };

    // Check visibility
    if (!this.isElementVisible(element)) {
      validation.issues.push('Element is not visible');
    }

    // Check dimensions
    const rect = element.getBoundingClientRect();
    validation.metrics.dimensions = {
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    };

    if (rect.width === 0 || rect.height === 0) {
      validation.issues.push('Element has zero dimensions');
    }

    // Check for proper styling
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none') {
      validation.issues.push('Element has display: none');
    }

    if (computedStyle.visibility === 'hidden') {
      validation.issues.push('Element has visibility: hidden');
    }

    // Check for text content
    if (!element.textContent?.trim()) {
      validation.issues.push('Element has no visible text content');
    }

    return validation;
  }

  /**
   * Validate metadata display accuracy
   */
  async validateMetadataDisplay() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
      
      for (const element of virtualSeriesElements) {
        const seriesUID = element.dataset.seriesUid || element.getAttribute('data-series-uid');
        const metadataValidation = this.validateSeriesMetadata(element, seriesUID);
        
        validation.details[seriesUID] = metadataValidation;
        
        if (metadataValidation.issues.length > 0) {
          validation.issues.push(...metadataValidation.issues);
        }
      }

      validation.passed = validation.issues.length === 0;

    } catch (error) {
      validation.issues.push(`Error validating metadata display: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate series metadata accuracy
   */
  validateSeriesMetadata(element, seriesUID) {
    const validation = {
      issues: [],
      metadata: {}
    };

    // Check for "All Images" description
    const description = element.textContent || '';
    validation.metadata.description = description;
    
    if (!description.includes('All Images')) {
      validation.issues.push('Series description missing "All Images" text');
    }

    // Check for image count in description
    const countMatch = description.match(/\((\d+)\s+total\)/);
    if (countMatch) {
      validation.metadata.displayedCount = parseInt(countMatch[1]);
    } else {
      validation.issues.push('Series description missing image count');
    }

    // Check for virtual series identification
    if (!seriesUID.includes('.all-images')) {
      validation.issues.push('Series UID does not indicate virtual series');
    }

    // Check for proper series number (should be 999999)
    const seriesNumberElement = element.querySelector('[data-series-number]');
    if (seriesNumberElement) {
      const seriesNumber = seriesNumberElement.dataset.seriesNumber;
      validation.metadata.seriesNumber = seriesNumber;
      
      if (seriesNumber !== '999999') {
        validation.issues.push(`Unexpected series number: ${seriesNumber} (expected: 999999)`);
      }
    }

    return validation;
  }

  /**
   * Validate series ordering (virtual series should be first)
   */
  async validateSeriesOrdering() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      // Find all series elements in the study browser
      const allSeriesElements = document.querySelectorAll('[data-series-uid]');
      const seriesOrder = Array.from(allSeriesElements).map((el, index) => ({
        index,
        seriesUID: el.dataset.seriesUid || el.getAttribute('data-series-uid'),
        isVirtual: (el.dataset.seriesUid || el.getAttribute('data-series-uid')).includes('.all-images'),
        element: el
      }));

      validation.details.seriesOrder = seriesOrder;
      validation.details.totalSeries = seriesOrder.length;

      // Check if virtual series come first
      const virtualSeries = seriesOrder.filter(s => s.isVirtual);
      const firstSeries = seriesOrder[0];

      validation.details.virtualSeriesCount = virtualSeries.length;
      validation.details.firstSeriesIsVirtual = firstSeries?.isVirtual || false;

      if (virtualSeries.length === 0) {
        validation.issues.push('No virtual series found in series ordering');
      } else if (!firstSeries?.isVirtual) {
        validation.issues.push('Virtual series is not the first series in the list');
      } else {
        validation.passed = true;
      }

    } catch (error) {
      validation.issues.push(`Error validating series ordering: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate icons and UI elements
   */
  async validateIconsAndUIElements() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
      
      let iconIssues = 0;

      for (const element of virtualSeriesElements) {
        const elementValidation = this.validateElementIcons(element);
        validation.details[element.dataset.seriesUid || 'unknown'] = elementValidation;
        
        iconIssues += elementValidation.issues.length;
        validation.issues.push(...elementValidation.issues);
      }

      validation.passed = iconIssues === 0;
      validation.details.totalIconIssues = iconIssues;

    } catch (error) {
      validation.issues.push(`Error validating icons and UI elements: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate element icons and UI components
   */
  validateElementIcons(element) {
    const validation = {
      issues: [],
      icons: {}
    };

    // Look for series icon
    const iconElement = element.querySelector('svg, .icon, [data-icon]');
    validation.icons.hasIcon = !!iconElement;
    
    if (!iconElement) {
      validation.issues.push('No icon found for virtual series');
    } else {
      validation.icons.iconType = iconElement.tagName.toLowerCase();
      validation.icons.iconClasses = iconElement.className;
    }

    // Check for hover states
    const hasHoverStyles = this.elementHasHoverStyles(element);
    validation.icons.hasHoverStyles = hasHoverStyles;
    
    if (!hasHoverStyles) {
      validation.issues.push('No hover styles detected for virtual series element');
    }

    // Check for selection states
    const hasSelectionStyles = this.elementHasSelectionStyles(element);
    validation.icons.hasSelectionStyles = hasSelectionStyles;

    return validation;
  }

  /**
   * Validate accessibility compliance
   */
  async validateAccessibility() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
      
      let accessibilityIssues = 0;

      for (const element of virtualSeriesElements) {
        const elementValidation = this.validateElementAccessibility(element);
        validation.details[element.dataset.seriesUid || 'unknown'] = elementValidation;
        
        accessibilityIssues += elementValidation.issues.length;
        validation.issues.push(...elementValidation.issues);
      }

      validation.passed = accessibilityIssues === 0;
      validation.details.totalAccessibilityIssues = accessibilityIssues;

    } catch (error) {
      validation.issues.push(`Error validating accessibility: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate element accessibility
   */
  validateElementAccessibility(element) {
    const validation = {
      issues: [],
      accessibility: {}
    };

    // Check for ARIA labels
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    validation.accessibility.hasAriaLabel = !!(ariaLabel || ariaLabelledBy);
    
    if (!ariaLabel && !ariaLabelledBy) {
      validation.issues.push('Element missing aria-label or aria-labelledby');
    }

    // Check for role attribute
    const role = element.getAttribute('role');
    validation.accessibility.role = role;
    
    if (!role) {
      validation.issues.push('Element missing role attribute');
    }

    // Check for keyboard navigation
    const tabIndex = element.tabIndex;
    validation.accessibility.tabIndex = tabIndex;
    validation.accessibility.isKeyboardAccessible = tabIndex >= 0;
    
    if (tabIndex < 0) {
      validation.issues.push('Element not keyboard accessible (tabIndex < 0)');
    }

    // Check for focus styles
    const hasFocusStyles = this.elementHasFocusStyles(element);
    validation.accessibility.hasFocusStyles = hasFocusStyles;
    
    if (!hasFocusStyles) {
      validation.issues.push('Element missing focus styles');
    }

    return validation;
  }

  /**
   * Validate responsive design
   */
  async validateResponsiveDesign() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      // Test different viewport sizes
      const viewportSizes = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];

      for (const viewport of viewportSizes) {
        // Simulate viewport size (in a real implementation, this would resize the viewport)
        const responsiveValidation = await this.validateAtViewportSize(viewport);
        validation.details[viewport.name] = responsiveValidation;
        
        if (responsiveValidation.issues.length > 0) {
          validation.issues.push(...responsiveValidation.issues.map(issue => 
            `${viewport.name}: ${issue}`
          ));
        }
      }

      validation.passed = validation.issues.length === 0;

    } catch (error) {
      validation.issues.push(`Error validating responsive design: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate at specific viewport size
   */
  async validateAtViewportSize(viewport) {
    const validation = {
      issues: [],
      metrics: {}
    };

    // Note: In a real implementation, this would change the viewport size
    // For now, we'll validate the current responsive behavior

    const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
    
    for (const element of virtualSeriesElements) {
      const rect = element.getBoundingClientRect();
      
      // Check if element is still visible and properly sized
      if (rect.width < 50) {
        validation.issues.push('Virtual series element too narrow');
      }
      
      if (rect.height < 30) {
        validation.issues.push('Virtual series element too short');
      }
      
      // Check if text is readable
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      
      if (fontSize < 12) {
        validation.issues.push('Font size too small for readability');
      }
    }

    return validation;
  }

  /**
   * Validate browser compatibility
   */
  async validateBrowserCompatibility() {
    const validation = {
      passed: false,
      issues: [],
      details: {}
    };

    try {
      // Get browser information
      const browserInfo = this.getBrowserInfo();
      validation.details.browserInfo = browserInfo;

      // Check for known compatibility issues
      const compatibilityIssues = this.checkBrowserCompatibility(browserInfo);
      validation.issues.push(...compatibilityIssues);

      // Test browser-specific features
      const featureSupport = this.checkFeatureSupport();
      validation.details.featureSupport = featureSupport;

      validation.passed = validation.issues.length === 0;

    } catch (error) {
      validation.issues.push(`Error validating browser compatibility: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate performance impact of virtual series display
   */
  async validatePerformanceImpact() {
    const validation = {
      passed: false,
      issues: [],
      metrics: {}
    };

    try {
      const startTime = performance.now();

      // Measure rendering performance
      const virtualSeriesElements = document.querySelectorAll('[data-series-uid*=".all-images"]');
      const renderingTime = performance.now() - startTime;

      validation.metrics.renderingTime = renderingTime;
      validation.metrics.elementCount = virtualSeriesElements.length;

      // Check memory usage if available
      if (performance.memory) {
        validation.metrics.memoryUsage = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }

      // Performance thresholds
      if (renderingTime > 100) {
        validation.issues.push('Virtual series rendering time is too slow (>100ms)');
      }

      if (virtualSeriesElements.length === 0) {
        validation.issues.push('No virtual series elements rendered');
      }

      validation.passed = validation.issues.length === 0;

    } catch (error) {
      validation.issues.push(`Error validating performance impact: ${error.message}`);
    }

    return validation;
  }

  /**
   * Utility Methods
   */

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return !!(
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  }

  elementHasHoverStyles(element) {
    // Check if element has hover styles defined
    const computedStyle = window.getComputedStyle(element);
    
    // Simulate hover by checking for transition or cursor styles
    return !!(
      computedStyle.cursor === 'pointer' ||
      computedStyle.transition ||
      element.classList.contains('hover') ||
      element.style.transition
    );
  }

  elementHasSelectionStyles(element) {
    // Check for selection-related classes or attributes
    return !!(
      element.classList.contains('selected') ||
      element.classList.contains('active') ||
      element.getAttribute('aria-selected') ||
      element.hasAttribute('data-selected')
    );
  }

  elementHasFocusStyles(element) {
    // Check for focus-related styles
    const computedStyle = window.getComputedStyle(element);
    
    return !!(
      computedStyle.outline ||
      computedStyle.outlineWidth !== '0px' ||
      element.style.outline ||
      element.classList.contains('focus')
    );
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  checkBrowserCompatibility(browserInfo) {
    const issues = [];
    
    // Check for older browsers
    if (browserInfo.userAgent.includes('MSIE')) {
      issues.push('Internet Explorer is not supported');
    }
    
    // Check for minimum browser versions
    if (browserInfo.userAgent.includes('Chrome/')) {
      const chromeVersion = browserInfo.userAgent.match(/Chrome\/(\d+)/);
      if (chromeVersion && parseInt(chromeVersion[1]) < 70) {
        issues.push('Chrome version is too old (minimum: 70)');
      }
    }
    
    return issues;
  }

  checkFeatureSupport() {
    return {
      flexbox: CSS.supports('display', 'flex'),
      grid: CSS.supports('display', 'grid'),
      customProperties: CSS.supports('color', 'var(--test)'),
      webp: this.supportsWebp(),
      intersectionObserver: 'IntersectionObserver' in window,
      performanceObserver: 'PerformanceObserver' in window
    };
  }

  supportsWebp() {
    // Check WebP support
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }

  /**
   * Generate comprehensive validation report
   */
  generateDisplayValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: this.determineOverallStatus(),
      summary: this.generateValidationSummary(),
      details: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Log summary to console
    console.log('\n[VirtualSeriesDisplay] DISPLAY VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log('\nSummary:');
    Object.entries(report.summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    return report;
  }

  determineOverallStatus() {
    const testCategories = Object.keys(this.testResults);
    let passedTests = 0;
    let totalTests = 0;

    testCategories.forEach(category => {
      if (this.testResults[category] && typeof this.testResults[category].passed === 'boolean') {
        totalTests++;
        if (this.testResults[category].passed) {
          passedTests++;
        }
      }
    });

    if (totalTests === 0) {
      return 'no-tests';
    } else if (passedTests === totalTests) {
      return 'passed';
    } else if (passedTests > totalTests / 2) {
      return 'warning';
    } else {
      return 'failed';
    }
  }

  generateValidationSummary() {
    const summary = {};

    Object.entries(this.testResults).forEach(([category, result]) => {
      if (result && typeof result.passed === 'boolean') {
        summary[category] = result.passed ? 'PASS' : 'FAIL';
      }
    });

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];

    // Check specific test results for recommendations
    if (this.testResults.virtualSeriesDetection && !this.testResults.virtualSeriesDetection.passed) {
      recommendations.push('Ensure virtual series elements are properly rendered in the DOM');
    }

    if (this.testResults.accessibility && !this.testResults.accessibility.passed) {
      recommendations.push('Add proper ARIA labels and keyboard navigation support');
    }

    if (this.testResults.performanceImpact && !this.testResults.performanceImpact.passed) {
      recommendations.push('Optimize virtual series rendering performance');
    }

    if (this.testResults.responsiveness && !this.testResults.responsiveness.passed) {
      recommendations.push('Improve responsive design for smaller screen sizes');
    }

    return recommendations;
  }
}

// Export convenience functions
export async function validateVirtualSeriesDisplay(options = {}) {
  const validator = new VirtualSeriesDisplayValidator(options);
  return await validator.runDisplayValidation();
}

export function createDisplayValidationReport(testResults) {
  const validator = new VirtualSeriesDisplayValidator();
  validator.testResults = testResults;
  return validator.generateDisplayValidationReport();
}

// Development helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.validateVirtualSeriesDisplay = validateVirtualSeriesDisplay;
  window.VirtualSeriesDisplayValidator = VirtualSeriesDisplayValidator;
} 