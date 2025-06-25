import {
  HangingProtocol,
  ProtocolMatchingRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ProtocolStage,
  DisplaySetSelector,
  ViewportConfiguration as BaseViewportConfiguration
} from '../types/hangingProtocol.types';

/**
 * Comprehensive Protocol Validation Service
 * 
 * Provides enterprise-grade validation for hanging protocols with detailed
 * business rules, data integrity checks, and performance considerations.
 */
export class ProtocolValidationService {
  
  /**
   * Validate complete hanging protocol with comprehensive checks
   */
  static validateProtocol(protocol: HangingProtocol): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Core protocol validation
    this.validateProtocolStructure(protocol, errors, warnings);
    this.validateProtocolMetadata(protocol, errors, warnings);
    this.validateProtocolMatchingRules(protocol, errors, warnings);
    this.validateDisplaySetSelectors(protocol, errors, warnings);
    this.validateProtocolStages(protocol, errors, warnings);
    this.validateBusinessRules(protocol, errors, warnings);
    this.validatePerformanceConstraints(protocol, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate basic protocol structure and required fields
   */
  private static validateProtocolStructure(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Required fields
    if (!protocol.id) {
      errors.push({
        field: 'id',
        message: 'Protocol ID is required and must be unique',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (typeof protocol.id !== 'string' || protocol.id.trim().length === 0) {
      errors.push({
        field: 'id',
        message: 'Protocol ID must be a non-empty string',
        severity: 'error',
        code: 'INVALID_FIELD_TYPE'
      });
    } else if (protocol.id.length > 100) {
      warnings.push({
        field: 'id',
        message: 'Protocol ID is unusually long (>100 characters)',
        severity: 'warning',
        code: 'FIELD_LENGTH_WARNING'
      });
    }

    if (!protocol.name) {
      errors.push({
        field: 'name',
        message: 'Protocol name is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (typeof protocol.name !== 'string' || protocol.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Protocol name must be a non-empty string',
        severity: 'error',
        code: 'INVALID_FIELD_TYPE'
      });
    } else if (protocol.name.length > 200) {
      warnings.push({
        field: 'name',
        message: 'Protocol name is unusually long (>200 characters)',
        severity: 'warning',
        code: 'FIELD_LENGTH_WARNING'
      });
    }

    // Optional but recommended fields
    if (!protocol.description) {
      warnings.push({
        field: 'description',
        message: 'Consider adding a description to help users understand this protocol',
        severity: 'warning',
        code: 'MISSING_RECOMMENDED_FIELD'
      });
    } else if (protocol.description.length > 1000) {
      warnings.push({
        field: 'description',
        message: 'Protocol description is very long (>1000 characters)',
        severity: 'warning',
        code: 'FIELD_LENGTH_WARNING'
      });
    }

    if (!protocol.version) {
      warnings.push({
        field: 'version',
        message: 'Consider specifying a protocol version for better tracking',
        severity: 'warning',
        code: 'MISSING_RECOMMENDED_FIELD'
      });
    }
  }

  /**
   * Validate protocol metadata and timestamps
   */
  private static validateProtocolMetadata(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Date validation
    if (protocol.createdDate) {
      const createdDate = new Date(protocol.createdDate);
      if (isNaN(createdDate.getTime())) {
        errors.push({
          field: 'createdDate',
          message: 'Invalid created date format',
          severity: 'error',
          code: 'INVALID_DATE_FORMAT'
        });
      } else if (createdDate > new Date()) {
        warnings.push({
          field: 'createdDate',
          message: 'Created date is in the future',
          severity: 'warning',
          code: 'FUTURE_DATE_WARNING'
        });
      }
    }

    if (protocol.modifiedDate) {
      const modifiedDate = new Date(protocol.modifiedDate);
      if (isNaN(modifiedDate.getTime())) {
        errors.push({
          field: 'modifiedDate',
          message: 'Invalid modified date format',
          severity: 'error',
          code: 'INVALID_DATE_FORMAT'
        });
      } else if (protocol.createdDate) {
        const createdDate = new Date(protocol.createdDate);
        if (modifiedDate < createdDate) {
          warnings.push({
            field: 'modifiedDate',
            message: 'Modified date is before created date',
            severity: 'warning',
            code: 'DATE_SEQUENCE_WARNING'
          });
        }
      }
    }

    // Number of priors validation
    if (protocol.numberOfPriorsReferenced !== undefined) {
      if (typeof protocol.numberOfPriorsReferenced !== 'number') {
        errors.push({
          field: 'numberOfPriorsReferenced',
          message: 'Number of priors referenced must be a number',
          severity: 'error',
          code: 'INVALID_FIELD_TYPE'
        });
      } else if (protocol.numberOfPriorsReferenced < -1) {
        errors.push({
          field: 'numberOfPriorsReferenced',
          message: 'Number of priors referenced must be -1 (unlimited) or positive',
          severity: 'error',
          code: 'INVALID_FIELD_VALUE'
        });
      } else if (protocol.numberOfPriorsReferenced > 50) {
        warnings.push({
          field: 'numberOfPriorsReferenced',
          message: 'Requesting many prior studies may impact performance',
          severity: 'warning',
          code: 'PERFORMANCE_WARNING'
        });
      }
    }
  }

  /**
   * Validate protocol matching rules
   */
  private static validateProtocolMatchingRules(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!protocol.protocolMatchingRules) {
      warnings.push({
        field: 'protocolMatchingRules',
        message: 'No protocol matching rules defined - protocol will match all studies',
        severity: 'warning',
        code: 'MISSING_MATCHING_RULES'
      });
      return;
    }

    if (!Array.isArray(protocol.protocolMatchingRules)) {
      errors.push({
        field: 'protocolMatchingRules',
        message: 'Protocol matching rules must be an array',
        severity: 'error',
        code: 'INVALID_FIELD_TYPE'
      });
      return;
    }

    if (protocol.protocolMatchingRules.length === 0) {
      warnings.push({
        field: 'protocolMatchingRules',
        message: 'No protocol matching rules defined - protocol will match all studies',
        severity: 'warning',
        code: 'EMPTY_MATCHING_RULES'
      });
      return;
    }

    if (protocol.protocolMatchingRules.length > 20) {
      warnings.push({
        field: 'protocolMatchingRules',
        message: 'Large number of matching rules may impact performance',
        severity: 'warning',
        code: 'PERFORMANCE_WARNING'
      });
    }

    // Validate individual rules
    const ruleIds = new Set<string>();
    protocol.protocolMatchingRules.forEach((rule, index) => {
      this.validateProtocolMatchingRule(rule, index, errors, warnings, ruleIds);
    });

    // Check for redundant rules
    this.checkForRedundantMatchingRules(protocol.protocolMatchingRules, warnings);
  }

  /**
   * Validate individual protocol matching rule
   */
  private static validateProtocolMatchingRule(
    rule: ProtocolMatchingRule, 
    index: number,
    errors: ValidationError[], 
    warnings: ValidationWarning[],
    ruleIds: Set<string>
  ): void {
    const fieldPrefix = `protocolMatchingRules[${index}]`;

    // Required fields
    if (!rule.id) {
      errors.push({
        field: `${fieldPrefix}.id`,
        message: 'Matching rule ID is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else {
      if (ruleIds.has(rule.id)) {
        errors.push({
          field: `${fieldPrefix}.id`,
          message: `Duplicate rule ID: ${rule.id}`,
          severity: 'error',
          code: 'DUPLICATE_ID'
        });
      }
      ruleIds.add(rule.id);
    }

    if (!rule.attribute) {
      errors.push({
        field: `${fieldPrefix}.attribute`,
        message: 'Matching rule attribute is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else {
      // Validate known DICOM attributes
      const validAttributes = [
        'Modality', 'BodyPartExamined', 'StudyDescription', 'SeriesDescription',
        'ProtocolName', 'StationName', 'Manufacturer', 'StudyDate', 'SeriesDate',
        'PatientAge', 'PatientSex', 'ImageType', 'SequenceName', 'SliceThickness'
      ];
      
      if (!validAttributes.includes(rule.attribute)) {
        warnings.push({
          field: `${fieldPrefix}.attribute`,
          message: `Unknown DICOM attribute: ${rule.attribute}. Ensure it exists in your data.`,
          severity: 'warning',
          code: 'UNKNOWN_ATTRIBUTE'
        });
      }
    }

    // Weight validation
    if (rule.weight !== undefined) {
      if (typeof rule.weight !== 'number' || rule.weight < 0 || rule.weight > 10) {
        errors.push({
          field: `${fieldPrefix}.weight`,
          message: 'Rule weight must be a number between 0 and 10',
          severity: 'error',
          code: 'INVALID_FIELD_VALUE'
        });
      }
    } else {
      warnings.push({
        field: `${fieldPrefix}.weight`,
        message: 'Consider specifying a weight for better rule priority',
        severity: 'warning',
        code: 'MISSING_RECOMMENDED_FIELD'
      });
    }

    // Constraint validation
    if (!rule.constraint) {
      errors.push({
        field: `${fieldPrefix}.constraint`,
        message: 'Matching rule constraint is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else {
      this.validateRuleConstraint(rule.constraint, `${fieldPrefix}.constraint`, errors, warnings);
    }
  }

  /**
   * Validate rule constraint
   */
  private static validateRuleConstraint(
    constraint: any, 
    fieldPrefix: string,
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const constraintKeys = Object.keys(constraint);
    const validConstraintTypes = ['equals', 'contains', 'regex', 'range', 'oneOf'];
    
    if (constraintKeys.length === 0) {
      errors.push({
        field: fieldPrefix,
        message: 'Constraint must have at least one condition',
        severity: 'error',
        code: 'EMPTY_CONSTRAINT'
      });
      return;
    }

    if (constraintKeys.length > 1) {
      warnings.push({
        field: fieldPrefix,
        message: 'Multiple constraint conditions - only first will be used',
        severity: 'warning',
        code: 'MULTIPLE_CONSTRAINTS'
      });
    }

    const constraintType = constraintKeys[0];
    if (!validConstraintTypes.includes(constraintType)) {
      errors.push({
        field: `${fieldPrefix}.${constraintType}`,
        message: `Invalid constraint type: ${constraintType}`,
        severity: 'error',
        code: 'INVALID_CONSTRAINT_TYPE'
      });
      return;
    }

    const constraintValue = constraint[constraintType];

    // Validate constraint values
    switch (constraintType) {
      case 'equals':
        if (constraintValue === null || constraintValue === undefined || constraintValue === '') {
          warnings.push({
            field: `${fieldPrefix}.equals`,
            message: 'Empty equals constraint may not match as expected',
            severity: 'warning',
            code: 'EMPTY_CONSTRAINT_VALUE'
          });
        }
        break;

      case 'contains':
        if (typeof constraintValue !== 'string' || constraintValue.length === 0) {
          warnings.push({
            field: `${fieldPrefix}.contains`,
            message: 'Contains constraint should be a non-empty string',
            severity: 'warning',
            code: 'INVALID_CONSTRAINT_VALUE'
          });
        }
        break;

      case 'regex':
        if (typeof constraintValue !== 'string') {
          errors.push({
            field: `${fieldPrefix}.regex`,
            message: 'Regex constraint must be a string',
            severity: 'error',
            code: 'INVALID_CONSTRAINT_VALUE'
          });
        } else {
          try {
            new RegExp(constraintValue);
          } catch (e) {
            errors.push({
              field: `${fieldPrefix}.regex`,
              message: `Invalid regex pattern: ${e.message}`,
              severity: 'error',
              code: 'INVALID_REGEX'
            });
          }
        }
        break;

      case 'range':
        if (!constraintValue || typeof constraintValue !== 'object') {
          errors.push({
            field: `${fieldPrefix}.range`,
            message: 'Range constraint must be an object with min/max values',
            severity: 'error',
            code: 'INVALID_CONSTRAINT_VALUE'
          });
        } else {
          const { min, max } = constraintValue;
          if (min !== undefined && max !== undefined && min > max) {
            errors.push({
              field: `${fieldPrefix}.range`,
              message: 'Range minimum cannot be greater than maximum',
              severity: 'error',
              code: 'INVALID_RANGE'
            });
          }
        }
        break;

      case 'oneOf':
        if (!Array.isArray(constraintValue) || constraintValue.length === 0) {
          errors.push({
            field: `${fieldPrefix}.oneOf`,
            message: 'OneOf constraint must be a non-empty array',
            severity: 'error',
            code: 'INVALID_CONSTRAINT_VALUE'
          });
        }
        break;
    }
  }

  /**
   * Check for redundant matching rules
   */
  private static checkForRedundantMatchingRules(
    rules: ProtocolMatchingRule[], 
    warnings: ValidationWarning[]
  ): void {
    const attributeGroups = new Map<string, ProtocolMatchingRule[]>();
    
    rules.forEach(rule => {
      if (!attributeGroups.has(rule.attribute)) {
        attributeGroups.set(rule.attribute, []);
      }
      attributeGroups.get(rule.attribute)!.push(rule);
    });

    attributeGroups.forEach((rulesForAttribute, attribute) => {
      if (rulesForAttribute.length > 1) {
        warnings.push({
          field: 'protocolMatchingRules',
          message: `Multiple rules for attribute '${attribute}' - may cause unexpected behavior`,
          severity: 'warning',
          code: 'REDUNDANT_RULES'
        });
      }
    });
  }

  /**
   * Validate display set selectors
   */
  private static validateDisplaySetSelectors(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!protocol.displaySetSelectors) {
      warnings.push({
        field: 'displaySetSelectors',
        message: 'No display set selectors defined',
        severity: 'warning',
        code: 'MISSING_SELECTORS'
      });
      return;
    }

    const selectorIds = Object.keys(protocol.displaySetSelectors);
    if (selectorIds.length === 0) {
      warnings.push({
        field: 'displaySetSelectors',
        message: 'No display set selectors defined',
        severity: 'warning',
        code: 'EMPTY_SELECTORS'
      });
      return;
    }

    if (selectorIds.length > 50) {
      warnings.push({
        field: 'displaySetSelectors',
        message: 'Large number of display set selectors may impact performance',
        severity: 'warning',
        code: 'PERFORMANCE_WARNING'
      });
    }

    selectorIds.forEach(selectorId => {
      const selector = protocol.displaySetSelectors[selectorId];
      this.validateDisplaySetSelector(selector, selectorId, errors, warnings);
    });
  }

  /**
   * Validate individual display set selector
   */
  private static validateDisplaySetSelector(
    selector: DisplaySetSelector, 
    selectorId: string,
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const fieldPrefix = `displaySetSelectors.${selectorId}`;

    if (!selector.id) {
      errors.push({
        field: `${fieldPrefix}.id`,
        message: 'Display set selector ID is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (selector.id !== selectorId) {
      warnings.push({
        field: `${fieldPrefix}.id`,
        message: 'Selector ID does not match its key in displaySetSelectors',
        severity: 'warning',
        code: 'ID_MISMATCH'
      });
    }

    // Validate matching rules if present
    if (selector.matchingRules && Array.isArray(selector.matchingRules)) {
      if (selector.matchingRules.length === 0) {
        warnings.push({
          field: `${fieldPrefix}.matchingRules`,
          message: 'Empty matching rules - selector will match all series',
          severity: 'warning',
          code: 'EMPTY_MATCHING_RULES'
        });
      }

      selector.matchingRules.forEach((rule, index) => {
        // Validate each matching rule (reuse logic from protocol matching rules)
        const ruleIds = new Set<string>();
        this.validateProtocolMatchingRule(rule, index, errors, warnings, ruleIds);
      });
    }
  }

  /**
   * Validate protocol stages
   */
  private static validateProtocolStages(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!protocol.stages || !Array.isArray(protocol.stages)) {
      errors.push({
        field: 'stages',
        message: 'Protocol must have at least one stage',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
      return;
    }

    if (protocol.stages.length === 0) {
      errors.push({
        field: 'stages',
        message: 'Protocol must have at least one stage',
        severity: 'error',
        code: 'EMPTY_STAGES'
      });
      return;
    }

    if (protocol.stages.length > 10) {
      warnings.push({
        field: 'stages',
        message: 'Many stages may be confusing to users',
        severity: 'warning',
        code: 'MANY_STAGES'
      });
    }

    protocol.stages.forEach((stage, index) => {
      this.validateProtocolStage(stage, index, protocol, errors, warnings);
    });
  }

  /**
   * Validate individual protocol stage
   */
  private static validateProtocolStage(
    stage: ProtocolStage, 
    index: number,
    protocol: HangingProtocol,
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const fieldPrefix = `stages[${index}]`;

    // Required fields
    if (!stage.id) {
      errors.push({
        field: `${fieldPrefix}.id`,
        message: 'Stage ID is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    if (!stage.name) {
      warnings.push({
        field: `${fieldPrefix}.name`,
        message: 'Consider providing a stage name for better user experience',
        severity: 'warning',
        code: 'MISSING_RECOMMENDED_FIELD'
      });
    }

    // Viewport structure validation
    if (!stage.viewportStructure) {
      errors.push({
        field: `${fieldPrefix}.viewportStructure`,
        message: 'Stage viewport structure is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
      return;
    }

    this.validateViewportStructure(stage.viewportStructure, `${fieldPrefix}.viewportStructure`, errors, warnings);

    // Viewports validation
    if (!stage.viewports || !Array.isArray(stage.viewports)) {
      errors.push({
        field: `${fieldPrefix}.viewports`,
        message: 'Stage must have viewports array',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
      return;
    }

    const expectedViewportCount = stage.viewportStructure.properties.rows * stage.viewportStructure.properties.columns;
    if (stage.viewports.length !== expectedViewportCount) {
      if (stage.viewports.length < expectedViewportCount) {
        warnings.push({
          field: `${fieldPrefix}.viewports`,
          message: `Fewer viewports (${stage.viewports.length}) than layout requires (${expectedViewportCount})`,
          severity: 'warning',
          code: 'VIEWPORT_COUNT_MISMATCH'
        });
      } else {
        warnings.push({
          field: `${fieldPrefix}.viewports`,
          message: `More viewports (${stage.viewports.length}) than layout supports (${expectedViewportCount})`,
          severity: 'warning',
          code: 'VIEWPORT_COUNT_MISMATCH'
        });
      }
    }

    // Validate individual viewports
    stage.viewports.forEach((viewport, viewportIndex) => {
      this.validateStageViewport(viewport, viewportIndex, `${fieldPrefix}.viewports`, protocol, errors, warnings);
    });
  }

  /**
   * Validate viewport structure
   */
  private static validateViewportStructure(
    structure: any, 
    fieldPrefix: string,
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!structure.layoutType) {
      errors.push({
        field: `${fieldPrefix}.layoutType`,
        message: 'Layout type is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (structure.layoutType !== 'grid') {
      warnings.push({
        field: `${fieldPrefix}.layoutType`,
        message: `Layout type '${structure.layoutType}' may not be supported`,
        severity: 'warning',
        code: 'UNSUPPORTED_LAYOUT_TYPE'
      });
    }

    if (!structure.properties) {
      errors.push({
        field: `${fieldPrefix}.properties`,
        message: 'Layout properties are required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
      return;
    }

    const { rows, columns } = structure.properties;
    
    if (!rows || typeof rows !== 'number' || rows < 1 || rows > 10) {
      errors.push({
        field: `${fieldPrefix}.properties.rows`,
        message: 'Rows must be a number between 1 and 10',
        severity: 'error',
        code: 'INVALID_LAYOUT_DIMENSION'
      });
    }

    if (!columns || typeof columns !== 'number' || columns < 1 || columns > 10) {
      errors.push({
        field: `${fieldPrefix}.properties.columns`,
        message: 'Columns must be a number between 1 and 10',
        severity: 'error',
        code: 'INVALID_LAYOUT_DIMENSION'
      });
    }

    if (rows && columns && (rows * columns) > 25) {
      warnings.push({
        field: `${fieldPrefix}.properties`,
        message: 'Large viewport layouts may impact performance',
        severity: 'warning',
        code: 'PERFORMANCE_WARNING'
      });
    }
  }

  /**
   * Validate stage viewport
   */
  private static validateStageViewport(
    viewport: any, 
    index: number,
    fieldPrefix: string,
    protocol: HangingProtocol,
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const viewportPrefix = `${fieldPrefix}[${index}]`;

    // Viewport options validation
    if (!viewport.viewportOptions) {
      warnings.push({
        field: `${viewportPrefix}.viewportOptions`,
        message: 'Consider specifying viewport options for better control',
        severity: 'warning',
        code: 'MISSING_RECOMMENDED_FIELD'
      });
    } else {
      const { viewportType, toolGroupId } = viewport.viewportOptions;
      
      if (viewportType && !['stack', 'volume', 'video'].includes(viewportType)) {
        warnings.push({
          field: `${viewportPrefix}.viewportOptions.viewportType`,
          message: `Unknown viewport type: ${viewportType}`,
          severity: 'warning',
          code: 'UNKNOWN_VIEWPORT_TYPE'
        });
      }

      if (!toolGroupId) {
        warnings.push({
          field: `${viewportPrefix}.viewportOptions.toolGroupId`,
          message: 'Consider specifying a tool group ID',
          severity: 'warning',
          code: 'MISSING_RECOMMENDED_FIELD'
        });
      }
    }

    // Display sets validation
    if (!viewport.displaySets || !Array.isArray(viewport.displaySets)) {
      errors.push({
        field: `${viewportPrefix}.displaySets`,
        message: 'Viewport must have display sets array',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
      return;
    }

    if (viewport.displaySets.length === 0) {
      warnings.push({
        field: `${viewportPrefix}.displaySets`,
        message: 'Viewport has no display sets - will be empty',
        severity: 'warning',
        code: 'EMPTY_DISPLAY_SETS'
      });
    }

    viewport.displaySets.forEach((displaySet: any, dsIndex: number) => {
      if (!displaySet.id) {
        errors.push({
          field: `${viewportPrefix}.displaySets[${dsIndex}].id`,
          message: 'Display set ID is required',
          severity: 'error',
          code: 'MISSING_REQUIRED_FIELD'
        });
      } else if (!protocol.displaySetSelectors[displaySet.id]) {
        errors.push({
          field: `${viewportPrefix}.displaySets[${dsIndex}].id`,
          message: `Display set selector '${displaySet.id}' not found`,
          severity: 'error',
          code: 'MISSING_DISPLAY_SET_SELECTOR'
        });
      }
    });
  }

  /**
   * Validate business rules
   */
  private static validateBusinessRules(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check for common business rule violations
    
    // 1. Ensure protocol has meaningful matching criteria
    if (protocol.protocolMatchingRules.length === 0) {
      warnings.push({
        field: 'protocolMatchingRules',
        message: 'Protocol without matching rules will apply to all studies - consider adding modality or body part constraints',
        severity: 'warning',
        code: 'OVERLY_BROAD_MATCHING'
      });
    }

    // 2. Check for modality-specific validation
    const modalityRule = protocol.protocolMatchingRules.find(rule => rule.attribute === 'Modality');
    if (modalityRule && modalityRule.constraint.equals) {
      const modality = modalityRule.constraint.equals as string;
      this.validateModalitySpecificRules(protocol, modality, warnings);
    }

    // 3. Validate layout makes sense for typical use cases
    if (protocol.stages.length > 0) {
      const mainStage = protocol.stages[0];
      const totalViewports = mainStage.viewportStructure.properties.rows * mainStage.viewportStructure.properties.columns;
      
      if (totalViewports === 1) {
        warnings.push({
          field: 'stages[0].viewportStructure',
          message: 'Single viewport layout - consider if multi-viewport would be more useful',
          severity: 'warning',
          code: 'LAYOUT_OPTIMIZATION'
        });
      } else if (totalViewports > 16) {
        warnings.push({
          field: 'stages[0].viewportStructure',
          message: 'Very large layout may be difficult for users to navigate',
          severity: 'warning',
          code: 'USABILITY_WARNING'
        });
      }
    }
  }

  /**
   * Validate modality-specific rules
   */
  private static validateModalitySpecificRules(
    protocol: HangingProtocol, 
    modality: string,
    warnings: ValidationWarning[]
  ): void {
    switch (modality.toUpperCase()) {
      case 'CT':
        // CT studies often benefit from axial, coronal, sagittal views
        if (protocol.stages[0]?.viewports.length < 3) {
          warnings.push({
            field: 'stages[0].viewports',
            message: 'CT protocols often benefit from multiple orthogonal views',
            severity: 'warning',
            code: 'MODALITY_BEST_PRACTICE'
          });
        }
        break;

      case 'MR':
        // MR studies have multiple sequences
        warnings.push({
          field: 'displaySetSelectors',
          message: 'MR protocols should consider sequence-specific display set selectors',
          severity: 'warning',
          code: 'MODALITY_BEST_PRACTICE'
        });
        break;

      case 'PT':
        // PET/CT fusion considerations
        warnings.push({
          field: 'protocolMatchingRules',
          message: 'PET protocols may need additional rules for fusion studies',
          severity: 'warning',
          code: 'MODALITY_BEST_PRACTICE'
        });
        break;

      case 'XA':
      case 'RF':
        // Angiography/fluoroscopy often single viewport
        if (protocol.stages[0]?.viewports.length > 2) {
          warnings.push({
            field: 'stages[0].viewports',
            message: 'Angiography protocols typically use fewer viewports',
            severity: 'warning',
            code: 'MODALITY_BEST_PRACTICE'
          });
        }
        break;
    }
  }

  /**
   * Validate performance constraints
   */
  private static validatePerformanceConstraints(
    protocol: HangingProtocol, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Count total complexity
    let complexityScore = 0;
    
    // Add complexity for matching rules
    complexityScore += protocol.protocolMatchingRules.length * 2;
    
    // Add complexity for display set selectors
    complexityScore += Object.keys(protocol.displaySetSelectors).length * 3;
    
    // Add complexity for viewports
    protocol.stages.forEach(stage => {
      complexityScore += stage.viewports.length * 5;
      stage.viewports.forEach(viewport => {
        complexityScore += viewport.displaySets.length * 2;
      });
    });

    if (complexityScore > 200) {
      warnings.push({
        field: 'protocol',
        message: 'High complexity protocol may impact loading performance',
        severity: 'warning',
        code: 'HIGH_COMPLEXITY'
      });
    }

    // Check for potential memory issues
    const totalViewports = protocol.stages.reduce((total, stage) => total + stage.viewports.length, 0);
    if (totalViewports > 20) {
      warnings.push({
        field: 'stages',
        message: 'Many viewports may cause memory issues on low-end devices',
        severity: 'warning',
        code: 'MEMORY_WARNING'
      });
    }

    // Check for regex performance issues
    protocol.protocolMatchingRules.forEach((rule, index) => {
      if (rule.constraint.regex) {
        const regex = rule.constraint.regex as string;
        if (regex.includes('.*') || regex.includes('.+')) {
          warnings.push({
            field: `protocolMatchingRules[${index}].constraint.regex`,
            message: 'Complex regex patterns may impact matching performance',
            severity: 'warning',
            code: 'REGEX_PERFORMANCE'
          });
        }
      }
    });
  }

  /**
   * Quick validation for real-time feedback
   */
  static validateQuick(protocol: Partial<HangingProtocol>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Only check critical fields for quick validation
    if (!protocol.id) {
      errors.push({
        field: 'id',
        message: 'Protocol ID is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    if (!protocol.name || protocol.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Protocol name is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default ProtocolValidationService; 