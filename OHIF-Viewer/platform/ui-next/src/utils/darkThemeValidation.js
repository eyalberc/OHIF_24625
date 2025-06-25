/**
 * Dark Theme Validation Utility for OHIF PRD Color Integration
 * 
 * Task 6.5: Implement Dark Theme Compatibility
 * 
 * This utility validates that all PRD colors work properly in both light and dark themes,
 * with special attention to medical imaging requirements and accessibility compliance
 */

/**
 * Medical Imaging Color Requirements for Dark Themes
 */
export const medicalImagingRequirements = {
  // Background colors should be dark enough to provide proper contrast for medical images
  backgroundLuminance: {
    max: 0.1, // Maximum 10% luminance for backgrounds
    recommended: 0.05 // Recommended 5% luminance
  },
  
  // Text contrast ratios must meet WCAG AA standards (4.5:1) and preferably AAA (7:1)
  textContrast: {
    minimum: 4.5, // WCAG AA requirement
    preferred: 7.0, // WCAG AAA preferred for medical applications
    critical: 4.5   // Minimum for critical medical information
  },
  
  // Colors that should be avoided or used carefully in medical imaging environments
  problematicColors: {
    red: 'Can interfere with pathology highlighting',
    green: 'May conflict with overlay annotations',
    blue: 'Should not be too saturated near image areas'
  },
  
  // Recommended color characteristics for medical imaging
  recommendations: {
    background: 'Very dark (< 5% luminance) to provide image contrast',
    text: 'High contrast (> 7:1 ratio) for readability',
    ui: 'Medium contrast (4.5-7:1) for interface elements',
    status: 'Clear differentiation without medical color conflicts'
  }
};

/**
 * Color Theme Validation Class
 */
export class DarkThemeValidator {
  constructor(options = {}) {
    this.options = {
      enableAccessibilityTesting: true,
      enableMedicalImagingValidation: true,
      enablePerformanceTesting: false,
      contrastThreshold: 4.5,
      ...options
    };
    
    this.results = {
      lightTheme: {},
      darkTheme: {},
      comparison: {},
      accessibility: {},
      medicalCompliance: {},
      overall: { passed: false, issues: [], recommendations: [] }
    };
  }

  /**
   * Get color values from CSS custom properties
   */
  getColorValues(theme = 'light') {
    const root = document.documentElement;
    
    // Apply theme class for testing
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const colorVariables = [
      // Core PRD colors
      '--color-primary',
      '--color-background', 
      '--color-panel',
      '--color-text-primary',
      '--color-text-secondary',
      '--color-border',
      '--color-warning',
      '--color-success',
      '--color-error',
      
      // OHIF theme colors
      '--background',
      '--foreground',
      '--card',
      '--primary',
      '--secondary',
      '--border',
      '--warning',
      '--success',
      '--error'
    ];

    const colors = {};
    colorVariables.forEach(variable => {
      const value = getComputedStyle(root).getPropertyValue(variable).trim();
      if (value) {
        colors[variable] = value;
      }
    });

    return colors;
  }

  /**
   * Convert HSL to RGB for contrast calculations
   */
  hslToRgb(hslString) {
    const hslMatch = hslString.match(/(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)%\s*[,\s]\s*(\d+(?:\.\d+)?)%/);
    if (!hslMatch) return null;

    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Calculate relative luminance (WCAG formula)
   */
  getRelativeLuminance(rgb) {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1, color2) {
    const rgb1 = this.hslToRgb(color1);
    const rgb2 = this.hslToRgb(color2);
    
    if (!rgb1 || !rgb2) return null;

    const lum1 = this.getRelativeLuminance(rgb1);
    const lum2 = this.getRelativeLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Validate accessibility compliance for a theme
   */
  validateAccessibility(colors, themeName) {
    const accessibility = {
      passed: [],
      failed: [],
      warnings: [],
      total: 0
    };

    // Critical text/background combinations
    const criticalPairs = [
      { fg: '--color-text-primary', bg: '--color-background', label: 'Primary text on background' },
      { fg: '--color-text-secondary', bg: '--color-background', label: 'Secondary text on background' },
      { fg: '--color-text-primary', bg: '--color-panel', label: 'Primary text on panel' },
      { fg: '--foreground', bg: '--background', label: 'OHIF foreground on background' }
    ];

    criticalPairs.forEach(pair => {
      accessibility.total++;
      
      const fgColor = colors[pair.fg];
      const bgColor = colors[pair.bg];
      
      if (!fgColor || !bgColor) {
        accessibility.failed.push({
          ...pair,
          issue: 'Missing color values',
          foreground: fgColor || 'undefined',
          background: bgColor || 'undefined'
        });
        return;
      }

      const contrastRatio = this.getContrastRatio(fgColor, bgColor);
      
      if (contrastRatio === null) {
        accessibility.failed.push({
          ...pair,
          issue: 'Could not calculate contrast ratio',
          foreground: fgColor,
          background: bgColor
        });
        return;
      }

      const result = {
        ...pair,
        contrastRatio: Math.round(contrastRatio * 100) / 100,
        foreground: fgColor,
        background: bgColor,
        meetsWCAG_AA: contrastRatio >= 4.5,
        meetsWCAG_AAA: contrastRatio >= 7.0,
        medicalGrade: contrastRatio >= medicalImagingRequirements.textContrast.preferred
      };

      if (contrastRatio >= 4.5) {
        accessibility.passed.push(result);
        
        if (contrastRatio < 7.0) {
          accessibility.warnings.push({
            ...result,
            warning: 'Meets WCAG AA but not AAA (recommended for medical applications)'
          });
        }
      } else {
        accessibility.failed.push({
          ...result,
          issue: 'Does not meet WCAG AA contrast requirement (4.5:1)'
        });
      }
    });

    return accessibility;
  }

  /**
   * Validate medical imaging compliance
   */
  validateMedicalCompliance(colors, themeName) {
    const compliance = {
      passed: [],
      failed: [],
      warnings: [],
      recommendations: []
    };

    // Background luminance check (should be very dark for medical imaging)
    const backgroundColors = ['--color-background', '--background', '--card'];
    backgroundColors.forEach(colorVar => {
      const color = colors[colorVar];
      if (color) {
        const rgb = this.hslToRgb(color);
        if (rgb) {
          const luminance = this.getRelativeLuminance(rgb);
          
          if (luminance <= medicalImagingRequirements.backgroundLuminance.recommended) {
            compliance.passed.push({
              variable: colorVar,
              luminance: Math.round(luminance * 1000) / 1000,
              status: 'Optimal for medical imaging'
            });
          } else if (luminance <= medicalImagingRequirements.backgroundLuminance.max) {
            compliance.warnings.push({
              variable: colorVar,
              luminance: Math.round(luminance * 1000) / 1000,
              warning: 'Acceptable but could be darker for better image contrast'
            });
          } else {
            compliance.failed.push({
              variable: colorVar,
              luminance: Math.round(luminance * 1000) / 1000,
              issue: 'Too bright for medical imaging background'
            });
          }
        }
      }
    });

    // Medical-specific recommendations
    if (themeName === 'dark') {
      compliance.recommendations.push(
        'Dark theme backgrounds should be very dark (< 5% luminance) for optimal image contrast',
        'Status colors should be distinguishable from typical pathology colors',
        'Text should have high contrast (7:1 ratio preferred) for clinical readability',
        'UI elements should not interfere with medical image interpretation'
      );
    }

    return compliance;
  }

  /**
   * Compare themes to identify potential issues
   */
  compareThemes(lightColors, darkColors) {
    const comparison = {
      colorMismatches: [],
      accessibilityDifferences: [],
      recommendations: []
    };

    // Check for colors that should be the same across themes
    const consistentColors = ['--color-primary', '--primary']; // Primary brand colors should be consistent
    
    consistentColors.forEach(colorVar => {
      const lightColor = lightColors[colorVar];
      const darkColor = darkColors[colorVar];
      
      if (lightColor && darkColor && lightColor !== darkColor) {
        comparison.colorMismatches.push({
          variable: colorVar,
          lightValue: lightColor,
          darkValue: darkColor,
          recommendation: 'Consider keeping brand colors consistent across themes'
        });
      }
    });

    // General recommendations
    comparison.recommendations.push(
      'Ensure all interactive elements have sufficient contrast in both themes',
      'Test with actual medical images to verify background contrast',
      'Consider user preferences for theme switching',
      'Validate that status colors remain distinguishable in both themes'
    );

    return comparison;
  }

  /**
   * Test theme switching functionality
   */
  testThemeSwitching() {
    const switchingTest = {
      success: false,
      issues: []
    };

    try {
      // Test switching to dark theme
      document.documentElement.classList.add('dark');
      const darkApplied = getComputedStyle(document.documentElement)
        .getPropertyValue('--background').trim();
      
      // Test switching back to light theme
      document.documentElement.classList.remove('dark');
      const lightApplied = getComputedStyle(document.documentElement)
        .getPropertyValue('--background').trim();
      
      if (darkApplied && lightApplied && darkApplied !== lightApplied) {
        switchingTest.success = true;
      } else {
        switchingTest.issues.push('Theme switching does not appear to change color values');
      }
      
    } catch (error) {
      switchingTest.issues.push(`Theme switching error: ${error.message}`);
    }

    return switchingTest;
  }

  /**
   * Run comprehensive validation
   */
  async validateDarkThemeCompatibility() {
    console.group('🌙 Dark Theme Compatibility Validation');
    
    try {
      // Get color values for both themes
      const lightColors = this.getColorValues('light');
      const darkColors = this.getColorValues('dark');
      
      console.log(`📝 Found ${Object.keys(lightColors).length} light theme colors`);
      console.log(`📝 Found ${Object.keys(darkColors).length} dark theme colors`);

      // Validate accessibility for both themes
      if (this.options.enableAccessibilityTesting) {
        console.group('🔍 Accessibility Validation');
        this.results.accessibility.light = this.validateAccessibility(lightColors, 'light');
        this.results.accessibility.dark = this.validateAccessibility(darkColors, 'dark');
        
        console.log(`Light theme: ${this.results.accessibility.light.passed.length}/${this.results.accessibility.light.total} passed`);
        console.log(`Dark theme: ${this.results.accessibility.dark.passed.length}/${this.results.accessibility.dark.total} passed`);
        console.groupEnd();
      }

      // Validate medical imaging compliance
      if (this.options.enableMedicalImagingValidation) {
        console.group('🏥 Medical Imaging Compliance');
        this.results.medicalCompliance.light = this.validateMedicalCompliance(lightColors, 'light');
        this.results.medicalCompliance.dark = this.validateMedicalCompliance(darkColors, 'dark');
        
        console.log(`Light theme compliance: ${this.results.medicalCompliance.light.passed.length} passed, ${this.results.medicalCompliance.light.failed.length} failed`);
        console.log(`Dark theme compliance: ${this.results.medicalCompliance.dark.passed.length} passed, ${this.results.medicalCompliance.dark.failed.length} failed`);
        console.groupEnd();
      }

      // Compare themes
      console.group('⚖️ Theme Comparison');
      this.results.comparison = this.compareThemes(lightColors, darkColors);
      console.log(`Found ${this.results.comparison.colorMismatches.length} potential color mismatches`);
      console.groupEnd();

      // Test theme switching
      console.group('🔄 Theme Switching Test');
      const switchingTest = this.testThemeSwitching();
      console.log(`Theme switching: ${switchingTest.success ? '✅ Working' : '❌ Failed'}`);
      if (switchingTest.issues.length > 0) {
        console.warn('Issues:', switchingTest.issues);
      }
      console.groupEnd();

      // Store color values
      this.results.lightTheme = lightColors;
      this.results.darkTheme = darkColors;

      // Calculate overall results
      const overallSuccess = 
        this.results.accessibility.light.failed.length === 0 &&
        this.results.accessibility.dark.failed.length === 0 &&
        this.results.medicalCompliance.dark.failed.length === 0 &&
        switchingTest.success;

      this.results.overall = {
        passed: overallSuccess,
        issues: [
          ...this.results.accessibility.light.failed.map(f => `Light theme: ${f.issue}`),
          ...this.results.accessibility.dark.failed.map(f => `Dark theme: ${f.issue}`),
          ...this.results.medicalCompliance.dark.failed.map(f => `Medical compliance: ${f.issue}`),
          ...switchingTest.issues
        ],
        recommendations: [
          ...this.results.medicalCompliance.dark.recommendations,
          ...this.results.comparison.recommendations
        ]
      };

      console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ PASSED' : '❌ NEEDS ATTENTION'}`);
      
      if (this.results.overall.issues.length > 0) {
        console.group('Issues Found:');
        this.results.overall.issues.forEach(issue => console.warn('⚠️', issue));
        console.groupEnd();
      }

    } catch (error) {
      console.error('Validation error:', error);
      this.results.overall.passed = false;
      this.results.overall.issues.push(`Validation error: ${error.message}`);
    }

    console.groupEnd();
    return this.results;
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    return {
      summary: {
        overall: this.results.overall.passed ? 'PASSED' : 'FAILED',
        lightThemeAccessibility: `${this.results.accessibility.light?.passed?.length || 0}/${this.results.accessibility.light?.total || 0}`,
        darkThemeAccessibility: `${this.results.accessibility.dark?.passed?.length || 0}/${this.results.accessibility.dark?.total || 0}`,
        medicalCompliance: this.results.medicalCompliance.dark?.failed?.length === 0 ? 'COMPLIANT' : 'NEEDS_IMPROVEMENT'
      },
      issues: this.results.overall.issues,
      recommendations: this.results.overall.recommendations,
      details: this.results
    };
  }
}

/**
 * Quick validation function for browser console
 */
export const validateDarkTheme = async () => {
  const validator = new DarkThemeValidator({
    enableAccessibilityTesting: true,
    enableMedicalImagingValidation: true
  });
  
  return await validator.validateDarkThemeCompatibility();
};

/**
 * Color usage examples for both themes
 */
export const darkThemeUsageExamples = {
  css: {
    // Theme-aware CSS
    adaptiveBackground: 'background-color: hsl(var(--background));',
    adaptiveText: 'color: hsl(var(--foreground));',
    medicalPanel: 'background-color: hsl(var(--color-panel)); border: 1px solid hsl(var(--color-border));'
  },
  
  tailwind: {
    // Theme-aware Tailwind classes
    adaptiveCard: 'bg-card text-card-foreground border-border',
    statusWarning: 'bg-warning-bg text-warning-text border-warning-border',
    medicalInterface: 'bg-prd-background text-prd-text-primary border-prd-border'
  },
  
  react: {
    // React component examples
    themeAwareButton: `
<button className="bg-primary text-primary-foreground hover:bg-primary/90 
                   dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
  Action Button
</button>`,
    medicalPanel: `
<div className="bg-prd-panel border-prd-border text-prd-text-primary
                p-4 rounded-lg shadow-sm">
  Medical Information Panel
</div>`
  }
};

// Make validation available globally
if (typeof window !== 'undefined') {
  window.validateDarkTheme = validateDarkTheme;
  window.DarkThemeValidator = DarkThemeValidator;
  window.darkThemeExamples = darkThemeUsageExamples;
}

export default DarkThemeValidator; 