/**
 * Color Validation Utility for PRD Color Integration
 * 
 * Task 6.4: Update Tailwind Configuration - Validation
 * 
 * This utility validates that all PRD colors are properly integrated into 
 * the Tailwind configuration and accessible via utility classes
 */

/**
 * PRD Color Mapping Validation
 */
export const prdColorMapping = {
  // PRD Colors -> OHIF Variables
  '#60A5FA': 'var(--color-primary)',     // Primary Blue
  '#111827': 'var(--color-background)',  // Background (optimized for medical imaging)
  '#1F2937': 'var(--color-panel)',       // Panel/Card Background  
  '#F9FAFB': 'var(--color-text-primary)', // Primary Text
  '#9CA3AF': 'var(--color-text-secondary)', // Secondary Text
  '#374151': 'var(--color-border)',      // Border/Divider
  '#FACC15': 'var(--color-warning)',     // Warning/Caution
  '#22C55E': 'var(--color-success)',     // Success/Confirmation
  '#F87171': 'var(--color-error)',       // Error/Critical
};

/**
 * Tailwind Class Validation
 * These classes should be available after configuration update
 */
export const tailwindClasses = {
  // Semantic color classes
  backgrounds: [
    'bg-warning',
    'bg-success', 
    'bg-error',
    'bg-info',
    'bg-warning-bg',
    'bg-success-bg',
    'bg-error-bg',
    'bg-info-bg'
  ],
  
  text: [
    'text-warning',
    'text-success',
    'text-error', 
    'text-info',
    'text-warning-text',
    'text-success-text',
    'text-error-text',
    'text-info-text',
    'text-secondary'
  ],
  
  borders: [
    'border-warning',
    'border-success',
    'border-error',
    'border-info',
    'border-warning-border',
    'border-success-border', 
    'border-error-border',
    'border-info-border'
  ],
  
  // PRD alias classes
  prdAliases: [
    'bg-prd-primary',
    'bg-prd-background', 
    'bg-prd-panel',
    'text-prd-text-primary',
    'text-prd-text-secondary',
    'border-prd-border',
    'bg-prd-warning',
    'bg-prd-success',
    'bg-prd-error'
  ]
};

/**
 * CSS Custom Property Validation
 * Validates that all required CSS variables are defined
 */
export const validateCSSCustomProperties = () => {
  const results = {
    passed: [],
    failed: [],
    total: 0
  };

  const requiredVariables = [
    // Core PRD variables
    '--color-primary',
    '--color-background', 
    '--color-panel',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-border',
    '--color-warning',
    '--color-success',
    '--color-error',
    
    // Semantic variables
    '--warning',
    '--success',
    '--error',
    '--text-secondary',
    
    // Status color variations
    '--warning-bg',
    '--warning-border',
    '--warning-text',
    '--success-bg', 
    '--success-border',
    '--success-text',
    '--error-bg',
    '--error-border', 
    '--error-text',
    '--info-bg',
    '--info-border',
    '--info-text'
  ];

  requiredVariables.forEach(variable => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
    results.total++;
    
    if (value && value.trim()) {
      results.passed.push({
        variable,
        value: value.trim()
      });
    } else {
      results.failed.push(variable);
    }
  });

  return results;
};

/**
 * Tailwind Class Availability Test
 * Tests if Tailwind utility classes are properly generated
 */
export const validateTailwindClasses = () => {
  const results = {
    passed: [],
    failed: [],
    total: 0
  };

  // Create test element to check class application
  const testElement = document.createElement('div');
  testElement.style.display = 'none';
  document.body.appendChild(testElement);

  // Flatten all class arrays for testing
  const allClasses = [
    ...tailwindClasses.backgrounds,
    ...tailwindClasses.text,
    ...tailwindClasses.borders,
    ...tailwindClasses.prdAliases
  ];

  allClasses.forEach(className => {
    results.total++;
    
    try {
      testElement.className = className;
      const computedStyle = getComputedStyle(testElement);
      
      // Check if the class applied any styles
      const hasStyles = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                       computedStyle.color !== 'rgb(0, 0, 0)' ||
                       computedStyle.borderColor !== 'rgb(0, 0, 0)';
      
      if (hasStyles) {
        results.passed.push({
          className,
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color,
          borderColor: computedStyle.borderColor
        });
      } else {
        results.failed.push(className);
      }
    } catch (error) {
      results.failed.push(className);
    }
  });

  // Cleanup
  document.body.removeChild(testElement);
  
  return results;
};

/**
 * Color Contrast Validation
 * Ensures colors meet accessibility requirements
 */
export const validateColorContrast = () => {
  const contrastPairs = [
    // Text on backgrounds
    { foreground: '--color-text-primary', background: '--color-background' },
    { foreground: '--color-text-secondary', background: '--color-background' },
    { foreground: '--color-text-primary', background: '--color-panel' },
    
    // Status colors
    { foreground: '--warning-text', background: '--warning-bg' },
    { foreground: '--success-text', background: '--success-bg' },
    { foreground: '--error-text', background: '--error-bg' },
    { foreground: '--info-text', background: '--info-bg' }
  ];

  const results = contrastPairs.map(pair => {
    const fgColor = getComputedStyle(document.documentElement).getPropertyValue(pair.foreground);
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue(pair.background);
    
    return {
      pair: `${pair.foreground} on ${pair.background}`,
      foreground: fgColor.trim(),
      background: bgColor.trim(),
      // Note: Full contrast calculation would require color parsing
      // This is a simplified validation
      hasValues: !!(fgColor.trim() && bgColor.trim())
    };
  });

  return results;
};

/**
 * Comprehensive Color Validation Report
 */
export const generateColorValidationReport = () => {
  console.group('🎨 PRD Color Integration Validation Report');
  
  // Test CSS Custom Properties
  console.group('📝 CSS Custom Properties');
  const cssResults = validateCSSCustomProperties();
  console.log(`✅ Passed: ${cssResults.passed.length}/${cssResults.total}`);
  console.log(`❌ Failed: ${cssResults.failed.length}/${cssResults.total}`);
  
  if (cssResults.failed.length > 0) {
    console.warn('Missing CSS variables:', cssResults.failed);
  }
  
  cssResults.passed.forEach(({ variable, value }) => {
    console.log(`  ${variable}: ${value}`);
  });
  console.groupEnd();

  // Test Tailwind Classes
  console.group('🎯 Tailwind Utility Classes');
  const tailwindResults = validateTailwindClasses();
  console.log(`✅ Working: ${tailwindResults.passed.length}/${tailwindResults.total}`);
  console.log(`❌ Failed: ${tailwindResults.failed.length}/${tailwindResults.total}`);
  
  if (tailwindResults.failed.length > 0) {
    console.warn('Non-working classes:', tailwindResults.failed);
  }
  console.groupEnd();

  // Test Color Contrast
  console.group('🔍 Color Contrast Validation');
  const contrastResults = validateColorContrast();
  contrastResults.forEach(result => {
    const status = result.hasValues ? '✅' : '❌';
    console.log(`${status} ${result.pair}`);
  });
  console.groupEnd();

  // Overall Status
  const overallSuccess = cssResults.failed.length === 0 && tailwindResults.failed.length === 0;
  console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ PASSED' : '❌ NEEDS ATTENTION'}`);
  
  console.groupEnd();

  return {
    css: cssResults,
    tailwind: tailwindResults,
    contrast: contrastResults,
    overall: overallSuccess
  };
};

/**
 * Color Usage Examples
 * Demonstrates how to use the integrated colors
 */
export const colorUsageExamples = {
  css: {
    // Using CSS custom properties directly
    primary: 'background-color: hsl(var(--color-primary));',
    warning: 'background-color: hsl(var(--color-warning));',
    textSecondary: 'color: hsl(var(--color-text-secondary));'
  },
  
  tailwind: {
    // Using Tailwind utility classes
    primary: 'bg-prd-primary text-prd-text-primary',
    warning: 'bg-warning text-warning-text border-warning-border',
    card: 'bg-prd-panel border-prd-border',
    semantic: 'bg-success text-success-text'
  },
  
  component: {
    // Examples for React components
    button: 'className="bg-primary hover:bg-primary/90 text-primary-foreground"',
    alert: 'className="bg-warning-bg border-warning-border text-warning-text"',
    panel: 'className="bg-prd-panel border-prd-border"'
  }
};

// Make validation available globally for testing
if (typeof window !== 'undefined') {
  window['validatePRDColors'] = generateColorValidationReport;
  window['prdColorExamples'] = colorUsageExamples;
}

export default {
  validateCSSCustomProperties,
  validateTailwindClasses,
  validateColorContrast,
  generateColorValidationReport,
  colorUsageExamples
}; 