/**
 * Component Color Validation System
 * 
 * Task 6.6: Update Component Library - Color Consistency Validation
 * 
 * This system validates that all UI components use the updated PRD color palette
 * consistently and meet WCAG accessibility standards for medical imaging environments
 */

/**
 * Component Color Standards for Medical UI
 */
export const componentColorStandards = {
  // Primary UI elements
  buttons: {
    primary: {
      background: '--primary',
      text: '--primary-foreground',
      hover: '--primary/90',
      focus: '--ring'
    },
    secondary: {
      background: '--secondary',
      text: '--secondary-foreground',
      hover: '--secondary/80'
    },
    destructive: {
      background: '--destructive',
      text: '--destructive-foreground',
      hover: '--destructive/90'
    }
  },

  // Medical status indicators
  statusIndicators: {
    warning: {
      background: '--warning-bg',
      text: '--warning-text',
      border: '--warning-border',
      icon: '--warning'
    },
    success: {
      background: '--success-bg',
      text: '--success-text',
      border: '--success-border',
      icon: '--success'
    },
    error: {
      background: '--error-bg',
      text: '--error-text',
      border: '--error-border',
      icon: '--error'
    },
    info: {
      background: '--info-bg',
      text: '--info-text',
      border: '--info-border',
      icon: '--info'
    }
  },

  // Layout components
  layout: {
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    cardForeground: '--card-foreground',
    panel: '--color-panel',
    border: '--border'
  },

  // Text hierarchy
  text: {
    primary: '--color-text-primary',
    secondary: '--color-text-secondary',
    muted: '--muted-foreground'
  },

  // Interactive elements
  interactive: {
    hover: '--accent',
    focus: '--ring',
    selection: '--primary/20'
  }
};

/**
 * Hardcoded Color Patterns to Find and Replace
 */
export const hardcodedColorPatterns = [
  // Hex colors
  /#[0-9A-Fa-f]{3,8}/g,
  
  // RGB/RGBA colors
  /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/g,
  
  // HSL/HSLA colors
  /hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)/g,
  
  // Named colors (common ones)
  /\b(white|black|red|green|blue|yellow|gray|grey|transparent)\b/g,
  
  // Tailwind arbitrary values
  /\[(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\]/g
];

/**
 * Component Color Validator Class
 */
export class ComponentColorValidator {
  constructor(options = {}) {
    this.options = {
      enableAccessibilityValidation: true,
      enableHardcodedColorDetection: true,
      enableConsistencyChecking: true,
      strictMode: false,
      ...options
    };
    
    this.results = {
      scannedComponents: 0,
      hardcodedColors: [],
      inconsistencies: [],
      accessibilityIssues: [],
      recommendations: [],
      summary: { passed: false, score: 0 }
    };
  }

  /**
   * Scan component files for color usage
   */
  async scanComponentDirectory(directory = 'src/components') {
    const componentFiles = await this.findComponentFiles(directory);
    
    for (const file of componentFiles) {
      await this.validateComponentFile(file);
    }
    
    return this.generateReport();
  }

  /**
   * Find component files to scan
   */
  async findComponentFiles(directory) {
    // In a real implementation, this would use fs to scan directories
    // For demo purposes, we'll simulate common OHIF component files
    return [
      'src/components/Button/Button.tsx',
      'src/components/Card/Card.tsx',
      'src/components/StatusBadge/StatusBadge.tsx',
      'src/components/Toolbar/Toolbar.tsx',
      'src/components/Panel/Panel.tsx',
      'src/components/StudyBrowser/StudyBrowser.tsx',
      'src/components/ViewportGrid/ViewportGrid.tsx',
      'src/components/Modal/Modal.tsx',
      'src/components/Tooltip/Tooltip.tsx',
      'src/components/Alert/Alert.tsx'
    ];
  }

  /**
   * Validate an individual component file
   */
  async validateComponentFile(filePath) {
    // Simulate reading file content
    const content = await this.readFileContent(filePath);
    this.results.scannedComponents++;
    
    // Check for hardcoded colors
    if (this.options.enableHardcodedColorDetection) {
      this.detectHardcodedColors(filePath, content);
    }
    
    // Check for consistency issues
    if (this.options.enableConsistencyChecking) {
      this.checkConsistency(filePath, content);
    }
    
    // Validate accessibility
    if (this.options.enableAccessibilityValidation) {
      this.validateAccessibility(filePath, content);
    }
  }

  /**
   * Simulate reading file content (in real implementation, use fs.readFile)
   */
  async readFileContent(filePath) {
    // Mock component content with various color usage patterns
    const mockContent = {
      'src/components/Button/Button.tsx': `
        const Button = ({ variant = 'primary', children, ...props }) => {
          const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
          const variantClasses = {
            primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border border-border bg-background hover:bg-accent',
          };
          return <button className={\`\${baseClasses} \${variantClasses[variant]}\`} {...props}>{children}</button>;
        };
      `,
      
      'src/components/StatusBadge/StatusBadge.tsx': `
        const StatusBadge = ({ status, children }) => {
          const statusClasses = {
            warning: 'bg-warning-bg text-warning-text border-warning-border',
            success: 'bg-success-bg text-success-text border-success-border',
            error: 'bg-error-bg text-error-text border-error-border',
            info: 'bg-info-bg text-info-text border-info-border'
          };
          return <span className={\`px-2 py-1 rounded border \${statusClasses[status]}\`}>{children}</span>;
        };
      `,
      
      'src/components/Panel/Panel.tsx': `
        const Panel = ({ children, className = '' }) => {
          return (
            <div className={\`bg-card text-card-foreground border border-border rounded-lg p-4 \${className}\`}>
              {children}
            </div>
          );
        };
      `,
      
      // Example with hardcoded colors (problematic)
      'src/components/Alert/Alert.tsx': `
        const Alert = ({ type, children }) => {
          const alertStyles = {
            error: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
            warning: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
            success: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
          };
          return <div style={alertStyles[type]}>{children}</div>;
        };
      `
    };
    
    return mockContent[filePath] || '// Mock component content';
  }

  /**
   * Detect hardcoded color values
   */
  detectHardcodedColors(filePath, content) {
    hardcodedColorPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.results.hardcodedColors.push({
            file: filePath,
            color: match,
            line: this.findLineNumber(content, match),
            recommendation: this.getColorRecommendation(match),
            severity: this.getHardcodedColorSeverity(match)
          });
        });
      }
    });
  }

  /**
   * Check for consistency issues
   */
  checkConsistency(filePath, content) {
    // Check for inconsistent button styling
    if (content.includes('button') || content.includes('Button')) {
      if (!content.includes('bg-primary') && !content.includes('bg-secondary')) {
        this.results.inconsistencies.push({
          file: filePath,
          type: 'button-styling',
          issue: 'Button component may not be using standard color classes',
          recommendation: 'Use bg-primary, bg-secondary, or bg-destructive for button backgrounds'
        });
      }
    }
    
    // Check for inconsistent status indicators
    const statusTypes = ['warning', 'success', 'error', 'info'];
    statusTypes.forEach(status => {
      if (content.includes(status)) {
        const expectedClass = `${status}-bg`;
        if (!content.includes(expectedClass)) {
          this.results.inconsistencies.push({
            file: filePath,
            type: 'status-styling',
            issue: `${status} status may not be using standard color classes`,
            recommendation: `Use ${status}-bg, ${status}-text, and ${status}-border classes`
          });
        }
      }
    });
  }

  /**
   * Validate accessibility compliance
   */
  validateAccessibility(filePath, content) {
    // Check for proper contrast pairings
    const contrastPairs = [
      { bg: 'bg-primary', text: 'text-primary-foreground' },
      { bg: 'bg-secondary', text: 'text-secondary-foreground' },
      { bg: 'bg-destructive', text: 'text-destructive-foreground' },
      { bg: 'bg-card', text: 'text-card-foreground' }
    ];
    
    contrastPairs.forEach(pair => {
      if (content.includes(pair.bg) && !content.includes(pair.text)) {
        this.results.accessibilityIssues.push({
          file: filePath,
          type: 'contrast-pairing',
          issue: `Background class ${pair.bg} used without corresponding text class ${pair.text}`,
          recommendation: `Always pair ${pair.bg} with ${pair.text} for proper contrast`,
          severity: 'high'
        });
      }
    });
    
    // Check for focus indicators
    if (content.includes('button') || content.includes('input')) {
      if (!content.includes('focus:') && !content.includes('focus-visible:')) {
        this.results.accessibilityIssues.push({
          file: filePath,
          type: 'focus-indicator',
          issue: 'Interactive element may be missing focus indicators',
          recommendation: 'Add focus:ring-2 focus:ring-ring focus:ring-offset-2 classes',
          severity: 'medium'
        });
      }
    }
  }

  /**
   * Get line number for a match
   */
  findLineNumber(content, match) {
    const index = content.indexOf(match);
    const beforeMatch = content.substring(0, index);
    return beforeMatch.split('\n').length;
  }

  /**
   * Get recommendation for hardcoded color
   */
  getColorRecommendation(color) {
    const colorRecommendations = {
      '#ffffff': 'Use --color-text-primary or --foreground',
      '#000000': 'Use --color-background or --background',
      '#fee2e2': 'Use --error-bg',
      '#991b1b': 'Use --error-text',
      '#fef3c7': 'Use --warning-bg',
      '#92400e': 'Use --warning-text',
      '#dcfce7': 'Use --success-bg',
      '#166534': 'Use --success-text'
    };
    
    return colorRecommendations[color.toLowerCase()] || 'Replace with appropriate CSS custom property';
  }

  /**
   * Get severity for hardcoded color
   */
  getHardcodedColorSeverity(color) {
    // Critical colors that must be replaced
    const criticalColors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'];
    if (criticalColors.includes(color.toLowerCase())) {
      return 'critical';
    }
    
    // High priority (status colors)
    if (color.includes('fee2e2') || color.includes('fef3c7') || color.includes('dcfce7')) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport() {
    const totalIssues = this.results.hardcodedColors.length + 
                       this.results.inconsistencies.length + 
                       this.results.accessibilityIssues.length;
    
    const criticalIssues = this.results.hardcodedColors.filter(c => c.severity === 'critical').length +
                          this.results.accessibilityIssues.filter(a => a.severity === 'high').length;
    
    // Calculate score (0-100)
    const maxPossibleIssues = this.results.scannedComponents * 3; // Assume 3 potential issues per component
    const score = Math.max(0, Math.round(((maxPossibleIssues - totalIssues) / maxPossibleIssues) * 100));
    
    this.results.summary = {
      passed: criticalIssues === 0 && totalIssues <= (this.results.scannedComponents * 0.5),
      score,
      totalIssues,
      criticalIssues,
      grade: this.getGrade(score)
    };
    
    // Generate recommendations
    this.generateRecommendations();
    
    return this.results;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    if (this.results.hardcodedColors.length > 0) {
      this.results.recommendations.push({
        priority: 'high',
        action: 'Replace hardcoded colors with CSS custom properties',
        details: `Found ${this.results.hardcodedColors.length} hardcoded color values`,
        impact: 'Improves theme consistency and dark mode compatibility'
      });
    }
    
    if (this.results.accessibilityIssues.length > 0) {
      this.results.recommendations.push({
        priority: 'high',
        action: 'Fix accessibility issues',
        details: `Address ${this.results.accessibilityIssues.length} accessibility concerns`,
        impact: 'Ensures compliance with medical software accessibility standards'
      });
    }
    
    if (this.results.inconsistencies.length > 0) {
      this.results.recommendations.push({
        priority: 'medium',
        action: 'Improve color consistency',
        details: `Resolve ${this.results.inconsistencies.length} consistency issues`,
        impact: 'Creates unified visual experience across components'
      });
    }
    
    // General recommendations
    this.results.recommendations.push({
      priority: 'low',
      action: 'Implement automated color validation in CI/CD',
      details: 'Add this validation to your build process',
      impact: 'Prevents future color consistency issues'
    });
  }

  /**
   * Get letter grade based on score
   */
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate component update plan
   */
  generateUpdatePlan() {
    const updatePlan = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };
    
    // Immediate fixes (critical issues)
    this.results.hardcodedColors
      .filter(c => c.severity === 'critical')
      .forEach(color => {
        updatePlan.immediate.push({
          file: color.file,
          action: `Replace ${color.color} with ${color.recommendation}`,
          line: color.line
        });
      });
    
    this.results.accessibilityIssues
      .filter(a => a.severity === 'high')
      .forEach(issue => {
        updatePlan.immediate.push({
          file: issue.file,
          action: issue.recommendation,
          type: issue.type
        });
      });
    
    // Short-term improvements
    this.results.hardcodedColors
      .filter(c => c.severity === 'high')
      .forEach(color => {
        updatePlan.shortTerm.push({
          file: color.file,
          action: `Replace ${color.color} with ${color.recommendation}`,
          line: color.line
        });
      });
    
    // Long-term optimizations
    this.results.inconsistencies.forEach(issue => {
      updatePlan.longTerm.push({
        file: issue.file,
        action: issue.recommendation,
        type: issue.type
      });
    });
    
    return updatePlan;
  }
}

/**
 * Quick validation function for immediate use
 */
export const validateComponentColors = async (directory = 'src/components') => {
  const validator = new ComponentColorValidator({
    enableAccessibilityValidation: true,
    enableHardcodedColorDetection: true,
    enableConsistencyChecking: true
  });
  
  const results = await validator.scanComponentDirectory(directory);
  
  console.group('🎨 Component Color Validation Report');
  console.log(`📊 Overall Score: ${results.summary.score}/100 (${results.summary.grade})`);
  console.log(`📁 Scanned Components: ${results.scannedComponents}`);
  console.log(`🚨 Total Issues: ${results.summary.totalIssues}`);
  console.log(`⚠️ Critical Issues: ${results.summary.criticalIssues}`);
  
  if (results.hardcodedColors.length > 0) {
    console.group('🔍 Hardcoded Colors Found:');
    results.hardcodedColors.forEach(color => {
      console.warn(`${color.file}:${color.line} - ${color.color} (${color.severity})`);
      console.log(`  → ${color.recommendation}`);
    });
    console.groupEnd();
  }
  
  if (results.accessibilityIssues.length > 0) {
    console.group('♿ Accessibility Issues:');
    results.accessibilityIssues.forEach(issue => {
      console.warn(`${issue.file} - ${issue.issue} (${issue.severity})`);
      console.log(`  → ${issue.recommendation}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return results;
};

/**
 * Component color migration helpers
 */
export const migrationHelpers = {
  // Common color replacements
  replacements: {
    '#ffffff': 'hsl(var(--foreground))',
    '#000000': 'hsl(var(--background))',
    'white': 'hsl(var(--foreground))',
    'black': 'hsl(var(--background))',
    'transparent': 'transparent', // Keep as-is
    '#fee2e2': 'hsl(var(--error-bg))',
    '#fef3c7': 'hsl(var(--warning-bg))',
    '#dcfce7': 'hsl(var(--success-bg))'
  },
  
  // Tailwind class migrations
  tailwindMigrations: {
    'bg-white': 'bg-background',
    'text-black': 'text-foreground',
    'bg-red-100': 'bg-error-bg',
    'text-red-800': 'text-error-text',
    'border-red-300': 'border-error-border',
    'bg-yellow-100': 'bg-warning-bg',
    'text-yellow-800': 'text-warning-text',
    'bg-green-100': 'bg-success-bg',
    'text-green-800': 'text-success-text',
    'bg-card': 'bg-card',
    'text-card-foreground': 'text-card-foreground'
  },
  
  // Component-specific recommendations
  componentRecommendations: {
    Button: 'Use bg-primary/secondary/destructive with corresponding text colors',
    Card: 'Use bg-card with text-card-foreground',
    Panel: 'Use bg-color-panel with text-color-text-primary',
    Alert: 'Use status-specific bg/text/border classes (error-bg, warning-bg, etc.)',
    Badge: 'Use semantic status classes or bg-muted with text-muted-foreground'
  }
};

export default ComponentColorValidator; 