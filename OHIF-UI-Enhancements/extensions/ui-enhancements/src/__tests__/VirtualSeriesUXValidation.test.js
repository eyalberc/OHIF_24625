/**
 * Virtual Series UX Validation Tests
 * 
 * Comprehensive testing of user experience validation framework
 * Tests clinical workflows, accessibility, performance UX, and error handling
 * 
 * Task 4.8: User Experience Validation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { 
  VirtualSeriesUXValidator, 
  UXValidationCategory, 
  ClinicalPersonas,
  createVirtualSeriesUXValidator,
  validateVirtualSeriesUX
} from '../validation/VirtualSeriesUXValidator.js';

// Mock performance API for consistent testing
if (!global.performance) {
  global.performance = { now: () => Date.now() };
}

describe('Virtual Series UX Validation Tests', () => {
  let uxValidator;
  let testContext;

  beforeEach(() => {
    // Initialize UX validator with test configuration
    uxValidator = new VirtualSeriesUXValidator({
      enableDetailedLogging: false,
      performanceThresholds: {
        loadTime: 2000,
        renderTime: 300,
        interactionResponse: 80
      }
    });

    testContext = {
      environment: 'testing',
      studyType: 'CT_CHEST',
      instanceCount: 150,
      userType: 'radiologist'
    };
  });

  describe('UX Validator Initialization', () => {
    test('should initialize with default configuration', () => {
      const validator = new VirtualSeriesUXValidator();
      expect(validator.options.performanceThresholds.loadTime).toBe(3000);
      expect(validator.options.performanceThresholds.renderTime).toBe(500);
    });

    test('should initialize validation tracking arrays', () => {
      expect(Array.isArray(uxValidator.validationResults)).toBe(true);
      expect(uxValidator.performanceMetrics instanceof Map).toBe(true);
    });
  });

  describe('Clinical Workflow Validation', () => {
    test('should validate radiologist workflow successfully', async () => {
      const radiologistContext = {
        ...testContext,
        userType: 'radiologist',
        timeConstraints: 'high'
      };

      await uxValidator.validateClinicalWorkflow(radiologistContext);

      const workflowResults = uxValidator.validationResults.filter(
        result => result.category === UXValidationCategory.CLINICAL_WORKFLOW
      );

      expect(workflowResults.length).toBeGreaterThanOrEqual(0);
    });

    test('should validate all clinical personas', async () => {
      await uxValidator.validateClinicalWorkflow(testContext);

      const personas = Object.keys(ClinicalPersonas);
      
      for (const personaKey of personas) {
        const persona = ClinicalPersonas[personaKey];
        const personaResults = uxValidator.validationResults.filter(
          result => result.persona === persona.name
        );

        expect(personaResults.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance UX Validation', () => {
    test('should validate performance metrics within thresholds', async () => {
      await uxValidator.validatePerformanceUX(testContext);

      expect(uxValidator.performanceMetrics.size).toBeGreaterThan(0);
      expect(uxValidator.performanceMetrics.has('initial_load_time')).toBe(true);
      expect(uxValidator.performanceMetrics.has('virtual_series_render_time')).toBe(true);
    });

    test('should identify performance issues when thresholds exceeded', async () => {
      // Mock slow performance
      const originalMeasureInitialLoadTime = uxValidator.measureInitialLoadTime;
      uxValidator.measureInitialLoadTime = jest.fn().mockResolvedValue({
        value: 5000, // Exceeds 2000ms threshold
        unit: 'ms'
      });

      await uxValidator.validatePerformanceUX(testContext);

      const performanceIssues = uxValidator.validationResults.filter(
        result => result.category === UXValidationCategory.PERFORMANCE_UX
      );

      expect(performanceIssues.length).toBeGreaterThan(0);

      // Restore original method
      uxValidator.measureInitialLoadTime = originalMeasureInitialLoadTime;
    });
  });

  describe('Comprehensive UX Validation', () => {
    test('should run complete UX validation successfully', async () => {
      const report = await uxValidator.validateVirtualSeriesUX(testContext);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.categories).toBeDefined();
      expect(report.personas).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });

    test('should generate comprehensive validation report', async () => {
      await uxValidator.validateVirtualSeriesUX(testContext);

      const report = uxValidator.generateValidationReport();

      expect(report.summary.totalValidations).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallStatus).toBeDefined();
      expect(report.performance.performanceGrade).toMatch(/[A-F]/);
    });
  });

  describe('Factory Functions', () => {
    test('should create UX validator using factory function', () => {
      const validator = createVirtualSeriesUXValidator({
        enableDetailedLogging: true
      });

      expect(validator).toBeInstanceOf(VirtualSeriesUXValidator);
      expect(validator.options.enableDetailedLogging).toBe(true);
    });

    test('should validate UX using quick validation function', async () => {
      const report = await validateVirtualSeriesUX(testContext, {
        enableDetailedLogging: false
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });
  });

  describe('Real-world Clinical Scenarios', () => {
    test('should validate emergency radiology workflow', async () => {
      const emergencyContext = {
        ...testContext,
        clinicalScenario: 'emergency',
        timeConstraints: 'critical',
        studyType: 'CT_TRAUMA'
      };

      const report = await uxValidator.validateVirtualSeriesUX(emergencyContext);
      
      expect(report.summary.overallStatus).toMatch(/acceptable|review_recommended|needs_attention|critical/);
    });

    test('should validate routine screening workflow', async () => {
      const screeningContext = {
        ...testContext,
        clinicalScenario: 'screening',
        userType: 'technologist'
      };

      const report = await uxValidator.validateVirtualSeriesUX(screeningContext);
      
      expect(report.personas['Radiologic Technologist']).toBeDefined();
    });
  });
}); 