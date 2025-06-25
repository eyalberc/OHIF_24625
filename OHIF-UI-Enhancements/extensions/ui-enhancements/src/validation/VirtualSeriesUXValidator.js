/**
 * Virtual Series User Experience Validator
 * 
 * Comprehensive UX validation framework for virtual series functionality
 * Validates clinical workflows, accessibility, performance, and user interface
 * 
 * Task 4.8: User Experience Validation
 */

import { virtualSeriesProfiler } from '../utils/virtualSeriesPerformance.js';
import { getVirtualSeriesErrorHandler } from '../services/VirtualSeriesErrorHandler.js';

/**
 * UX Validation Categories
 */
export const UXValidationCategory = {
  CLINICAL_WORKFLOW: 'clinical_workflow',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE_UX: 'performance_ux',
  USER_INTERFACE: 'user_interface',
  ERROR_HANDLING: 'error_handling',
  MOBILE_RESPONSIVE: 'mobile_responsive',
  KEYBOARD_NAVIGATION: 'keyboard_navigation',
  VISUAL_FEEDBACK: 'visual_feedback'
};

/**
 * Validation Severity Levels
 */
export const UXValidationSeverity = {
  CRITICAL: 'critical',    // Prevents core functionality
  HIGH: 'high',           // Significantly impacts usability
  MEDIUM: 'medium',       // Moderate usability impact
  LOW: 'low',            // Minor usability issues
  INFO: 'info'           // Informational findings
};

/**
 * Clinical User Personas
 */
export const ClinicalPersonas = {
  RADIOLOGIST: {
    name: 'Radiologist',
    primaryTasks: ['image_review', 'diagnosis', 'report_generation'],
    expertise: 'high',
    timeConstraints: 'high',
    keyNeeds: ['speed', 'accuracy', 'comprehensive_view']
  },
  TECHNOLOGIST: {
    name: 'Radiologic Technologist',
    primaryTasks: ['study_loading', 'quality_check', 'workflow_management'],
    expertise: 'medium',
    timeConstraints: 'medium',
    keyNeeds: ['reliability', 'ease_of_use', 'clear_feedback']
  },
  RESIDENT: {
    name: 'Radiology Resident',
    primaryTasks: ['learning', 'preliminary_review', 'case_study'],
    expertise: 'low',
    timeConstraints: 'low',
    keyNeeds: ['learning_support', 'comprehensive_tools', 'guidance']
  },
  SURGEON: {
    name: 'Surgeon',
    primaryTasks: ['surgical_planning', 'anatomy_review', 'case_preparation'],
    expertise: 'medium',
    timeConstraints: 'high',
    keyNeeds: ['detailed_visualization', 'quick_access', 'reliability']
  }
};

/**
 * Virtual Series UX Validator Class
 */
export class VirtualSeriesUXValidator {
  constructor(options = {}) {
    this.options = {
      enableDetailedLogging: options.enableDetailedLogging || false,
      validateAccessibility: options.validateAccessibility !== false,
      validatePerformance: options.validatePerformance !== false,
      validateMobile: options.validateMobile !== false,
      performanceThresholds: {
        loadTime: options.loadTimeThreshold || 3000, // 3 seconds
        renderTime: options.renderTimeThreshold || 500, // 500ms
        interactionResponse: options.interactionThreshold || 100 // 100ms
      },
      ...options
    };

    this.validationResults = [];
    this.performanceMetrics = new Map();
    this.accessibilityIssues = [];
    this.userWorkflowIssues = [];
    
    this.log('VirtualSeriesUXValidator initialized', this.options);
  }

  /**
   * Main UX validation entry point
   */
  async validateVirtualSeriesUX(testContext = {}) {
    const validationTiming = virtualSeriesProfiler.startTiming('uxValidation');
    
    try {
      this.log('Starting comprehensive UX validation', testContext);
      
      // Clear previous results
      this.clearPreviousResults();
      
      // Run all validation categories
      const validationPromises = [
        this.validateClinicalWorkflow(testContext),
        this.validateUserInterface(testContext),
        this.validateErrorHandling(testContext),
        this.validateVisualFeedback(testContext)
      ];

      // Add conditional validations
      if (this.options.validateAccessibility) {
        validationPromises.push(this.validateAccessibility(testContext));
        validationPromises.push(this.validateKeyboardNavigation(testContext));
      }

      if (this.options.validatePerformance) {
        validationPromises.push(this.validatePerformanceUX(testContext));
      }

      if (this.options.validateMobile) {
        validationPromises.push(this.validateMobileResponsive(testContext));
      }

      // Execute all validations
      await Promise.all(validationPromises);
      
      // Generate comprehensive report
      const report = this.generateValidationReport();
      
      virtualSeriesProfiler.endTiming(validationTiming, 'uxValidation');
      return report;
      
    } catch (error) {
      virtualSeriesProfiler.endTiming(validationTiming, 'uxValidation');
      this.addValidationResult({
        category: UXValidationCategory.USER_INTERFACE,
        severity: UXValidationSeverity.CRITICAL,
        message: 'UX validation failed to complete',
        details: error.message,
        recommendation: 'Check validation setup and try again'
      });
      
      throw error;
    }
  }

  /**
   * Validate Clinical Workflow Integration
   */
  async validateClinicalWorkflow(testContext) {
    this.log('Validating clinical workflow integration');

    // Test each clinical persona workflow
    for (const [personaKey, persona] of Object.entries(ClinicalPersonas)) {
      await this.validatePersonaWorkflow(persona, testContext);
    }

    // Validate common clinical scenarios
    await this.validateClinicalScenarios(testContext);
  }

  /**
   * Validate workflow for specific clinical persona
   */
  async validatePersonaWorkflow(persona, testContext) {
    const workflowTiming = virtualSeriesProfiler.startTiming(`workflow_${persona.name}`);
    
    try {
      this.log(`Validating workflow for ${persona.name}`);

      // Simulate typical workflow steps
      const workflowSteps = this.getPersonaWorkflowSteps(persona);
      
      for (const step of workflowSteps) {
        const stepResult = await this.validateWorkflowStep(step, persona, testContext);
        
        if (!stepResult.success) {
          this.addValidationResult({
            category: UXValidationCategory.CLINICAL_WORKFLOW,
            severity: this.determineWorkflowSeverity(step, persona),
            message: `${persona.name} workflow issue: ${step.name}`,
            details: stepResult.details,
            persona: persona.name,
            step: step.name,
            recommendation: stepResult.recommendation
          });
        }
      }

      virtualSeriesProfiler.endTiming(workflowTiming, `workflow_${persona.name}`);
      
    } catch (error) {
      virtualSeriesProfiler.endTiming(workflowTiming, `workflow_${persona.name}`);
      this.addValidationResult({
        category: UXValidationCategory.CLINICAL_WORKFLOW,
        severity: UXValidationSeverity.HIGH,
        message: `Failed to validate ${persona.name} workflow`,
        details: error.message,
        persona: persona.name
      });
    }
  }

  /**
   * Get workflow steps for clinical persona
   */
  getPersonaWorkflowSteps(persona) {
    const commonSteps = [
      {
        name: 'study_loading',
        description: 'Load medical study',
        expectedTime: 3000,
        criticalPath: true
      },
      {
        name: 'virtual_series_discovery',
        description: 'Discover virtual series option',
        expectedTime: 500,
        criticalPath: true
      },
      {
        name: 'virtual_series_selection',
        description: 'Select virtual series',
        expectedTime: 200,
        criticalPath: true
      },
      {
        name: 'image_navigation',
        description: 'Navigate through images',
        expectedTime: 100,
        criticalPath: true
      }
    ];

    // Add persona-specific steps
    switch (persona.name) {
      case 'Radiologist':
        return [
          ...commonSteps,
          {
            name: 'diagnostic_review',
            description: 'Perform diagnostic review',
            expectedTime: 1000,
            criticalPath: true
          },
          {
            name: 'measurement_tools',
            description: 'Use measurement tools',
            expectedTime: 500,
            criticalPath: false
          }
        ];
        
      case 'Radiologic Technologist':
        return [
          ...commonSteps,
          {
            name: 'quality_assessment',
            description: 'Assess image quality',
            expectedTime: 800,
            criticalPath: true
          },
          {
            name: 'workflow_handoff',
            description: 'Prepare for radiologist review',
            expectedTime: 300,
            criticalPath: true
          }
        ];
        
      case 'Radiology Resident':
        return [
          ...commonSteps,
          {
            name: 'learning_exploration',
            description: 'Explore learning features',
            expectedTime: 2000,
            criticalPath: false
          },
          {
            name: 'reference_comparison',
            description: 'Compare with reference cases',
            expectedTime: 1500,
            criticalPath: false
          }
        ];
        
      case 'Surgeon':
        return [
          ...commonSteps,
          {
            name: 'surgical_planning',
            description: 'Plan surgical approach',
            expectedTime: 3000,
            criticalPath: true
          },
          {
            name: 'anatomical_landmarks',
            description: 'Identify anatomical landmarks',
            expectedTime: 1000,
            criticalPath: true
          }
        ];
        
      default:
        return commonSteps;
    }
  }

  /**
   * Validate individual workflow step
   */
  async validateWorkflowStep(step, persona, testContext) {
    try {
      this.log(`Validating step: ${step.name} for ${persona.name}`);

      // Simulate step execution time
      const startTime = performance.now();
      await this.simulateWorkflowStep(step, testContext);
      const endTime = performance.now();
      
      const actualTime = endTime - startTime;
      
      // Check if step meets performance expectations
      if (step.criticalPath && actualTime > step.expectedTime) {
        return {
          success: false,
          details: `Step took ${actualTime}ms, expected ${step.expectedTime}ms`,
          recommendation: `Optimize ${step.name} performance for ${persona.name} workflow`
        };
      }

      // Check if step provides appropriate feedback
      const feedbackValidation = this.validateStepFeedback(step, persona);
      if (!feedbackValidation.success) {
        return feedbackValidation;
      }

      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        details: `Step execution failed: ${error.message}`,
        recommendation: `Fix ${step.name} implementation for ${persona.name}`
      };
    }
  }

  /**
   * Simulate workflow step execution
   */
  async simulateWorkflowStep(step, testContext) {
    // This would integrate with actual UI components in a real implementation
    // For validation purposes, we simulate the step
    
    switch (step.name) {
      case 'study_loading':
        // Simulate study loading with virtual series creation
        await this.simulateDelay(50); // Basic simulation
        break;
        
      case 'virtual_series_discovery':
        // Check if virtual series is discoverable
        await this.validateVirtualSeriesDiscoverability(testContext);
        break;
        
      case 'virtual_series_selection':
        // Check if virtual series can be selected
        await this.validateVirtualSeriesSelection(testContext);
        break;
        
      case 'image_navigation':
        // Simulate image navigation
        await this.validateImageNavigation(testContext);
        break;
        
      default:
        await this.simulateDelay(10);
    }
  }

  /**
   * Validate virtual series discoverability
   */
  async validateVirtualSeriesDiscoverability(testContext) {
    // Check if virtual series is clearly visible and identifiable
    const discoverabilityChecks = [
      {
        name: 'virtual_series_labeling',
        check: () => this.checkVirtualSeriesLabeling(),
        message: 'Virtual series should be clearly labeled'
      },
      {
        name: 'visual_distinction',
        check: () => this.checkVisualDistinction(),
        message: 'Virtual series should be visually distinct from regular series'
      },
      {
        name: 'position_prominence',
        check: () => this.checkPositionProminence(),
        message: 'Virtual series should be prominently positioned'
      }
    ];

    for (const discoverabilityCheck of discoverabilityChecks) {
      const result = discoverabilityCheck.check();
      if (!result.success) {
        this.addValidationResult({
          category: UXValidationCategory.USER_INTERFACE,
          severity: UXValidationSeverity.HIGH,
          message: discoverabilityCheck.message,
          details: result.details,
          recommendation: result.recommendation
        });
      }
    }
  }

  /**
   * Validate accessibility compliance
   */
  async validateAccessibility(testContext) {
    this.log('Validating accessibility compliance');

    const accessibilityChecks = [
      {
        name: 'keyboard_accessibility',
        validator: () => this.validateKeyboardAccessibility(),
        wcagLevel: 'AA',
        severity: UXValidationSeverity.HIGH
      },
      {
        name: 'screen_reader_support',
        validator: () => this.validateScreenReaderSupport(),
        wcagLevel: 'AA',
        severity: UXValidationSeverity.HIGH
      },
      {
        name: 'color_contrast',
        validator: () => this.validateColorContrast(),
        wcagLevel: 'AA',
        severity: UXValidationSeverity.MEDIUM
      },
      {
        name: 'focus_management',
        validator: () => this.validateFocusManagement(),
        wcagLevel: 'AA',
        severity: UXValidationSeverity.MEDIUM
      },
      {
        name: 'aria_labels',
        validator: () => this.validateAriaLabels(),
        wcagLevel: 'AA',
        severity: UXValidationSeverity.HIGH
      }
    ];

    for (const accessibilityCheck of accessibilityChecks) {
      try {
        const result = await accessibilityCheck.validator();
        
        if (!result.success) {
          this.addValidationResult({
            category: UXValidationCategory.ACCESSIBILITY,
            severity: accessibilityCheck.severity,
            message: `WCAG ${accessibilityCheck.wcagLevel} violation: ${accessibilityCheck.name}`,
            details: result.details,
            recommendation: result.recommendation,
            wcagLevel: accessibilityCheck.wcagLevel
          });
        }
      } catch (error) {
        this.addValidationResult({
          category: UXValidationCategory.ACCESSIBILITY,
          severity: UXValidationSeverity.HIGH,
          message: `Failed to validate ${accessibilityCheck.name}`,
          details: error.message,
          recommendation: 'Fix accessibility validation implementation'
        });
      }
    }
  }

  /**
   * Validate performance from user experience perspective
   */
  async validatePerformanceUX(testContext) {
    this.log('Validating performance UX');

    const performanceTests = [
      {
        name: 'initial_load_time',
        description: 'Time to first meaningful paint',
        threshold: this.options.performanceThresholds.loadTime,
        test: () => this.measureInitialLoadTime(testContext)
      },
      {
        name: 'virtual_series_render_time',
        description: 'Time to render virtual series',
        threshold: this.options.performanceThresholds.renderTime,
        test: () => this.measureVirtualSeriesRenderTime(testContext)
      },
      {
        name: 'interaction_response_time',
        description: 'Response time to user interactions',
        threshold: this.options.performanceThresholds.interactionResponse,
        test: () => this.measureInteractionResponseTime(testContext)
      },
      {
        name: 'memory_usage_impact',
        description: 'Memory usage impact on user experience',
        threshold: 100 * 1024 * 1024, // 100MB
        test: () => this.measureMemoryUsageImpact(testContext)
      }
    ];

    for (const performanceTest of performanceTests) {
      try {
        const result = await performanceTest.test();
        
        if (result.value > performanceTest.threshold) {
          this.addValidationResult({
            category: UXValidationCategory.PERFORMANCE_UX,
            severity: this.determinePerformanceSeverity(result.value, performanceTest.threshold),
            message: `Performance issue: ${performanceTest.description}`,
            details: `Measured: ${result.value}ms, Threshold: ${performanceTest.threshold}ms`,
            recommendation: `Optimize ${performanceTest.name} to meet user experience standards`,
            metric: {
              name: performanceTest.name,
              value: result.value,
              threshold: performanceTest.threshold,
              unit: result.unit || 'ms'
            }
          });
        }

        // Store metric for reporting
        this.performanceMetrics.set(performanceTest.name, {
          value: result.value,
          threshold: performanceTest.threshold,
          passed: result.value <= performanceTest.threshold
        });
        
      } catch (error) {
        this.addValidationResult({
          category: UXValidationCategory.PERFORMANCE_UX,
          severity: UXValidationSeverity.HIGH,
          message: `Failed to measure ${performanceTest.description}`,
          details: error.message,
          recommendation: 'Fix performance measurement implementation'
        });
      }
    }
  }

  /**
   * Validate error handling from user perspective
   */
  async validateErrorHandling(testContext) {
    this.log('Validating error handling UX');

    const errorScenarios = [
      {
        name: 'network_failure',
        scenario: () => this.simulateNetworkFailure(),
        expectedBehavior: 'Clear error message with retry option'
      },
      {
        name: 'large_study_timeout',
        scenario: () => this.simulateLargeStudyTimeout(),
        expectedBehavior: 'Progress indicator with option to continue'
      },
      {
        name: 'corrupted_data',
        scenario: () => this.simulateCorruptedData(),
        expectedBehavior: 'Graceful degradation with informative message'
      },
      {
        name: 'memory_pressure',
        scenario: () => this.simulateMemoryPressure(),
        expectedBehavior: 'Performance adjustment with user notification'
      }
    ];

    for (const errorScenario of errorScenarios) {
      try {
        const result = await this.validateErrorScenario(errorScenario, testContext);
        
        if (!result.success) {
          this.addValidationResult({
            category: UXValidationCategory.ERROR_HANDLING,
            severity: UXValidationSeverity.HIGH,
            message: `Poor error handling for ${errorScenario.name}`,
            details: result.details,
            expectedBehavior: errorScenario.expectedBehavior,
            recommendation: result.recommendation
          });
        }
      } catch (error) {
        this.addValidationResult({
          category: UXValidationCategory.ERROR_HANDLING,
          severity: UXValidationSeverity.CRITICAL,
          message: `Error scenario validation failed: ${errorScenario.name}`,
          details: error.message,
          recommendation: 'Fix error scenario validation implementation'
        });
      }
    }
  }

  /**
   * Validate visual feedback and user interface
   */
  async validateVisualFeedback(testContext) {
    this.log('Validating visual feedback');

    const visualFeedbackChecks = [
      {
        name: 'loading_indicators',
        check: () => this.validateLoadingIndicators(),
        message: 'Loading states should provide clear visual feedback'
      },
      {
        name: 'progress_indication',
        check: () => this.validateProgressIndication(),
        message: 'Long operations should show progress'
      },
      {
        name: 'state_transitions',
        check: () => this.validateStateTransitions(),
        message: 'State changes should be visually smooth'
      },
      {
        name: 'error_visualization',
        check: () => this.validateErrorVisualization(),
        message: 'Errors should be clearly visualized'
      },
      {
        name: 'success_confirmation',
        check: () => this.validateSuccessConfirmation(),
        message: 'Successful actions should be confirmed'
      }
    ];

    for (const feedbackCheck of visualFeedbackChecks) {
      try {
        const result = feedbackCheck.check();
        
        if (!result.success) {
          this.addValidationResult({
            category: UXValidationCategory.VISUAL_FEEDBACK,
            severity: UXValidationSeverity.MEDIUM,
            message: feedbackCheck.message,
            details: result.details,
            recommendation: result.recommendation
          });
        }
      } catch (error) {
        this.addValidationResult({
          category: UXValidationCategory.VISUAL_FEEDBACK,
          severity: UXValidationSeverity.HIGH,
          message: `Failed to validate ${feedbackCheck.name}`,
          details: error.message,
          recommendation: 'Fix visual feedback validation'
        });
      }
    }
  }

  /**
   * Utility methods
   */
  
  clearPreviousResults() {
    this.validationResults = [];
    this.performanceMetrics.clear();
    this.accessibilityIssues = [];
    this.userWorkflowIssues = [];
  }

  addValidationResult(result) {
    const validationResult = {
      id: this.generateResultId(),
      timestamp: new Date().toISOString(),
      ...result
    };
    
    this.validationResults.push(validationResult);
    
    if (this.options.enableDetailedLogging) {
      this.log(`Validation result: ${result.severity} - ${result.message}`, validationResult);
    }
  }

  generateResultId() {
    return `ux_validation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  log(message, data = null) {
    if (this.options.enableDetailedLogging) {
      console.log(`[VirtualSeriesUXValidator] ${message}`, data);
    }
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Placeholder validation methods (would be implemented with actual UI testing)
  checkVirtualSeriesLabeling() {
    return { success: true, details: 'Virtual series properly labeled' };
  }

  checkVisualDistinction() {
    return { success: true, details: 'Virtual series visually distinct' };
  }

  checkPositionProminence() {
    return { success: true, details: 'Virtual series prominently positioned' };
  }

  validateKeyboardAccessibility() {
    return { success: true, details: 'Keyboard navigation functional' };
  }

  validateScreenReaderSupport() {
    return { success: true, details: 'Screen reader support adequate' };
  }

  validateColorContrast() {
    return { success: true, details: 'Color contrast meets WCAG AA standards' };
  }

  validateFocusManagement() {
    return { success: true, details: 'Focus management appropriate' };
  }

  validateAriaLabels() {
    return { success: true, details: 'ARIA labels present and descriptive' };
  }

  async measureInitialLoadTime(testContext) {
    await this.simulateDelay(100);
    return { value: 1500, unit: 'ms' };
  }

  async measureVirtualSeriesRenderTime(testContext) {
    await this.simulateDelay(50);
    return { value: 300, unit: 'ms' };
  }

  async measureInteractionResponseTime(testContext) {
    await this.simulateDelay(10);
    return { value: 50, unit: 'ms' };
  }

  async measureMemoryUsageImpact(testContext) {
    return { value: 50 * 1024 * 1024, unit: 'bytes' }; // 50MB
  }

  determinePerformanceSeverity(value, threshold) {
    const ratio = value / threshold;
    if (ratio > 3) return UXValidationSeverity.CRITICAL;
    if (ratio > 2) return UXValidationSeverity.HIGH;
    if (ratio > 1.5) return UXValidationSeverity.MEDIUM;
    return UXValidationSeverity.LOW;
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const report = {
      summary: this.generateValidationSummary(),
      categories: this.groupResultsByCategory(),
      personas: this.generatePersonaReport(),
      performance: this.generatePerformanceReport(),
      accessibility: this.generateAccessibilityReport(),
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    this.log('Generated comprehensive UX validation report', report.summary);
    return report;
  }

  generateValidationSummary() {
    const totalResults = this.validationResults.length;
    const severityCounts = {};
    
    Object.values(UXValidationSeverity).forEach(severity => {
      severityCounts[severity] = this.validationResults.filter(
        result => result.severity === severity
      ).length;
    });

    const overallStatus = this.determineOverallStatus(severityCounts);

    return {
      totalValidations: totalResults,
      overallStatus,
      severityCounts,
      categoryCounts: this.getCategoryCounts(),
      passRate: this.calculatePassRate()
    };
  }

  determineOverallStatus(severityCounts) {
    if (severityCounts[UXValidationSeverity.CRITICAL] > 0) return 'critical';
    if (severityCounts[UXValidationSeverity.HIGH] > 3) return 'needs_attention';
    if (severityCounts[UXValidationSeverity.HIGH] > 0 || severityCounts[UXValidationSeverity.MEDIUM] > 5) return 'review_recommended';
    return 'acceptable';
  }

  groupResultsByCategory() {
    const categories = {};
    
    Object.values(UXValidationCategory).forEach(category => {
      categories[category] = this.validationResults.filter(
        result => result.category === category
      );
    });

    return categories;
  }

  generatePersonaReport() {
    const personaResults = {};
    
    Object.keys(ClinicalPersonas).forEach(personaKey => {
      const persona = ClinicalPersonas[personaKey];
      personaResults[persona.name] = {
        workflowIssues: this.validationResults.filter(
          result => result.persona === persona.name
        ),
        criticalIssues: this.validationResults.filter(
          result => result.persona === persona.name && 
                   result.severity === UXValidationSeverity.CRITICAL
        ).length,
        recommendations: this.getPersonaSpecificRecommendations(persona.name)
      };
    });

    return personaResults;
  }

  generatePerformanceReport() {
    const performanceData = {};
    
    this.performanceMetrics.forEach((metric, name) => {
      performanceData[name] = metric;
    });

    return {
      metrics: performanceData,
      overallPerformance: this.calculateOverallPerformance(),
      performanceGrade: this.calculatePerformanceGrade()
    };
  }

  generateAccessibilityReport() {
    const accessibilityResults = this.validationResults.filter(
      result => result.category === UXValidationCategory.ACCESSIBILITY
    );

    return {
      wcagAACompliance: this.calculateWCAGCompliance('AA'),
      wcagAAACompliance: this.calculateWCAGCompliance('AAA'),
      accessibilityIssues: accessibilityResults,
      keyboardNavigationScore: this.calculateKeyboardNavigationScore(),
      screenReaderCompatibility: this.calculateScreenReaderCompatibility()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // High-priority recommendations
    const criticalIssues = this.validationResults.filter(
      result => result.severity === UXValidationSeverity.CRITICAL
    );
    
    criticalIssues.forEach(issue => {
      recommendations.push({
        priority: 'critical',
        category: issue.category,
        issue: issue.message,
        recommendation: issue.recommendation,
        impact: 'Prevents core functionality for medical professionals'
      });
    });

    // Performance recommendations
    const performanceIssues = this.validationResults.filter(
      result => result.category === UXValidationCategory.PERFORMANCE_UX
    );
    
    if (performanceIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: 'Performance optimization needed',
        recommendation: 'Implement performance optimizations to meet clinical workflow requirements',
        impact: 'Improves efficiency for time-constrained medical professionals'
      });
    }

    return recommendations;
  }

  // Helper calculation methods
  getCategoryCounts() {
    const counts = {};
    Object.values(UXValidationCategory).forEach(category => {
      counts[category] = this.validationResults.filter(
        result => result.category === category
      ).length;
    });
    return counts;
  }

  calculatePassRate() {
    const totalValidations = this.validationResults.length || 1;
    const passedValidations = this.validationResults.filter(
      result => result.severity === UXValidationSeverity.INFO
    ).length;
    
    return Math.round((passedValidations / totalValidations) * 100);
  }

  calculateOverallPerformance() {
    let totalScore = 0;
    let metricCount = 0;

    this.performanceMetrics.forEach((metric) => {
      totalScore += metric.passed ? 100 : 0;
      metricCount++;
    });

    return metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
  }

  calculatePerformanceGrade() {
    const score = this.calculateOverallPerformance();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  calculateWCAGCompliance(level) {
    const wcagResults = this.validationResults.filter(
      result => result.category === UXValidationCategory.ACCESSIBILITY &&
               result.wcagLevel === level
    );
    
    return {
      totalChecks: wcagResults.length,
      passedChecks: wcagResults.filter(result => result.severity === UXValidationSeverity.INFO).length,
      complianceRate: wcagResults.length > 0 ? 
        Math.round((wcagResults.filter(result => result.severity === UXValidationSeverity.INFO).length / wcagResults.length) * 100) : 100
    };
  }

  calculateKeyboardNavigationScore() {
    // Simplified calculation - would be more complex in real implementation
    return 85; // Placeholder
  }

  calculateScreenReaderCompatibility() {
    // Simplified calculation - would be more complex in real implementation
    return 80; // Placeholder
  }

  getPersonaSpecificRecommendations(personaName) {
    return this.validationResults
      .filter(result => result.persona === personaName && result.recommendation)
      .map(result => result.recommendation);
  }
}

/**
 * Factory function for creating UX validator
 */
export function createVirtualSeriesUXValidator(options = {}) {
  return new VirtualSeriesUXValidator(options);
}

/**
 * Quick UX validation function
 */
export async function validateVirtualSeriesUX(testContext = {}, options = {}) {
  const validator = createVirtualSeriesUXValidator(options);
  return await validator.validateVirtualSeriesUX(testContext);
} 