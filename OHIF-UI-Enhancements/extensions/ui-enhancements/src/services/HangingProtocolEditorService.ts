/**
 * Hanging Protocol Editor Service
 * 
 * Service wrapper for OHIF v3 HangingProtocolService integration
 * providing type-safe protocol management for the editor.
 * 
 * Task 5.1: HangingProtocolService Integration
 */

import {
  HangingProtocol,
  EditorHangingProtocol,
  HangingProtocolServiceAPI,
  ValidationResult,
  ValidationError,
  ProtocolMatchingRule,
  DisplaySetSelector,
  ProtocolStage,
  Viewport,
  ViewportOptions
} from '../types/hangingProtocol.types';
import { ProtocolValidationService } from './ProtocolValidationService';

/**
 * Protocol conversion utilities
 */
export class ProtocolConverter {
  /**
   * Convert simplified editor protocol to full OHIF protocol
   */
  static editorToOHIF(editorProtocol: EditorHangingProtocol): HangingProtocol {
    const { layout, viewports, ...basicInfo } = editorProtocol;
    
    // Create display set selectors based on series matching rules
    const displaySetSelectors: { [key: string]: DisplaySetSelector } = {};
    
    viewports.forEach((viewport, index) => {
      const selectorId = `viewport-${index}`;
      displaySetSelectors[selectorId] = {
        id: selectorId,
        matchingRules: viewport.seriesMatchingRules.map((rule, ruleIndex) => ({
          id: `rule-${index}-${ruleIndex}`,
          weight: 1,
          attribute: 'SeriesDescription',
          constraint: { contains: rule },
          required: false
        }))
      };
    });

    // Create viewport configurations
    const stageViewports: Viewport[] = viewports.map((viewport, index) => ({
      viewportOptions: {
        viewportType: 'stack' as const,
        toolGroupId: 'default',
        orientation: 'acquisition' as const
      },
      displaySets: [{
        id: `viewport-${index}`,
        matchedDisplaySetsIndex: 0
      }]
    }));

    // Create protocol matching rules
    const protocolMatchingRules: ProtocolMatchingRule[] = [];
    
    if (basicInfo.modality) {
      protocolMatchingRules.push({
        id: 'modality-rule',
        weight: 3,
        attribute: 'Modality',
        constraint: { equals: basicInfo.modality },
        required: false
      });
    }

    if (basicInfo.bodyPart) {
      protocolMatchingRules.push({
        id: 'bodypart-rule',
        weight: 2,
        attribute: 'BodyPartExamined',
        constraint: { contains: basicInfo.bodyPart },
        required: false
      });
    }

    // Create the main stage
    const mainStage: ProtocolStage = {
      id: 'main-stage',
      name: 'Main Stage',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: layout.rows,
          columns: layout.columns
        }
      },
      viewports: stageViewports,
      createdDate: new Date().toISOString()
    };

    return {
      id: basicInfo.id,
      name: basicInfo.name,
      description: basicInfo.description || '',
      version: '1.0.0',
      createdDate: new Date().toISOString(),
      protocolMatchingRules,
      displaySetSelectors,
      stages: [mainStage],
      numberOfPriorsReferenced: -1
    };
  }

  /**
   * Convert full OHIF protocol to simplified editor protocol
   */
  static OHIFToEditor(ohifProtocol: HangingProtocol): EditorHangingProtocol {
    const mainStage = ohifProtocol.stages[0];
    if (!mainStage) {
      throw new Error('Protocol must have at least one stage');
    }

    const layout = {
      rows: mainStage.viewportStructure.properties.rows,
      columns: mainStage.viewportStructure.properties.columns
    };

    // Extract series matching rules from display set selectors
    const viewports = mainStage.viewports.map((viewport, index) => {
      const displaySetId = viewport.displaySets[0]?.id;
      const selector = displaySetId ? ohifProtocol.displaySetSelectors[displaySetId] : null;
      
      const seriesMatchingRules = selector?.matchingRules
        .filter(rule => rule.attribute === 'SeriesDescription')
        .map(rule => {
          if (rule.constraint.contains) return String(rule.constraint.contains);
          if (rule.constraint.equals) return String(rule.constraint.equals);
          return 'Any';
        }) || ['Any'];

      return {
        seriesMatchingRules,
        position: {
          row: Math.floor(index / layout.columns),
          col: index % layout.columns
        }
      };
    });

    // Extract modality and body part from protocol matching rules
    const modalityRule = ohifProtocol.protocolMatchingRules.find(rule => rule.attribute === 'Modality');
    const bodyPartRule = ohifProtocol.protocolMatchingRules.find(rule => rule.attribute === 'BodyPartExamined');

    return {
      id: ohifProtocol.id,
      name: ohifProtocol.name,
      description: ohifProtocol.description,
      modality: modalityRule?.constraint.equals ? String(modalityRule.constraint.equals) : '',
      bodyPart: bodyPartRule?.constraint.contains ? String(bodyPartRule.constraint.contains) : '',
      layout,
      viewports
    };
  }

  /**
   * Validate protocol conversion
   */
  static validateConversion(protocol: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!protocol?.id) {
      errors.push({
        field: 'id',
        message: 'Protocol ID is required',
        severity: 'error',
        code: 'MISSING_ID'
      });
    }

    if (!protocol?.name) {
      errors.push({
        field: 'name',
        message: 'Protocol name is required',
        severity: 'error',
        code: 'MISSING_NAME'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
}

/**
 * Main service for hanging protocol editor integration
 */
export class HangingProtocolEditorService {
  private hangingProtocolService: any;
  private servicesManager: any;

  constructor(servicesManager: any) {
    this.servicesManager = servicesManager;
    this.hangingProtocolService = servicesManager?.services?.HangingProtocolService;
    
    if (!this.hangingProtocolService) {
      console.warn('HangingProtocolService not available in servicesManager');
    }
  }

  /**
   * Get all available protocols
   */
  async getProtocols(): Promise<HangingProtocol[]> {
    try {
      if (!this.hangingProtocolService) {
        return [];
      }

      const protocols = this.hangingProtocolService.getProtocols();
      return Array.isArray(protocols) ? protocols : [];
    } catch (error) {
      console.error('Error getting protocols:', error);
      return [];
    }
  }

  /**
   * Get protocol by ID
   */
  async getProtocolById(id: string): Promise<HangingProtocol | null> {
    try {
      if (!this.hangingProtocolService || !id) {
        return null;
      }

      const protocol = this.hangingProtocolService.getProtocolById(id);
      return protocol || null;
    } catch (error) {
      console.error(`Error getting protocol ${id}:`, error);
      return null;
    }
  }

  /**
   * Add new protocol
   */
  async addProtocol(protocol: HangingProtocol): Promise<boolean> {
    try {
      if (!this.hangingProtocolService) {
        throw new Error('HangingProtocolService not available');
      }

      // Validate protocol first
      const validation = this.validateProtocol(protocol);
      if (!validation.isValid) {
        console.error('Protocol validation failed:', validation.errors);
        return false;
      }

      // Add protocol to service
      const result = this.hangingProtocolService.addProtocol(protocol);
      
      if (result !== false) {
        console.log(`Protocol ${protocol.id} added successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding protocol:', error);
      return false;
    }
  }

  /**
   * Update existing protocol
   */
  async updateProtocol(protocol: HangingProtocol): Promise<boolean> {
    try {
      if (!this.hangingProtocolService) {
        throw new Error('HangingProtocolService not available');
      }

      // Validate protocol first
      const validation = this.validateProtocol(protocol);
      if (!validation.isValid) {
        console.error('Protocol validation failed:', validation.errors);
        return false;
      }

      // Update modified date
      const updatedProtocol = {
        ...protocol,
        modifiedDate: new Date().toISOString()
      };

      // Update protocol in service
      const result = this.hangingProtocolService.updateProtocol 
        ? this.hangingProtocolService.updateProtocol(updatedProtocol)
        : this.hangingProtocolService.addProtocol(updatedProtocol); // Fallback for services without update method

      if (result !== false) {
        console.log(`Protocol ${protocol.id} updated successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating protocol:', error);
      return false;
    }
  }

  /**
   * Remove protocol by ID
   */
  async removeProtocol(id: string): Promise<boolean> {
    try {
      if (!this.hangingProtocolService || !id) {
        return false;
      }

      const result = this.hangingProtocolService.removeProtocol 
        ? this.hangingProtocolService.removeProtocol(id)
        : false; // Some services may not support removal

      if (result !== false) {
        console.log(`Protocol ${id} removed successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error removing protocol ${id}:`, error);
      return false;
    }
  }

  /**
   * Apply protocol to viewer
   */
  async applyProtocol(id: string, options?: any): Promise<boolean> {
    try {
      if (!this.hangingProtocolService || !id) {
        return false;
      }

      this.hangingProtocolService.setProtocol(id, options);
      console.log(`Protocol ${id} applied successfully`);
      return true;
    } catch (error) {
      console.error(`Error applying protocol ${id}:`, error);
      return false;
    }
  }

  /**
   * Validate hanging protocol using comprehensive validation service
   */
  validateProtocol(protocol: HangingProtocol): ValidationResult {
    return ProtocolValidationService.validateProtocol(protocol);
  }

  /**
   * Quick validation for real-time feedback during editing
   */
  validateProtocolQuick(protocol: Partial<HangingProtocol>): ValidationResult {
    return ProtocolValidationService.validateQuick(protocol);
  }

  /**
   * Get available modalities for matching rules
   */
  getAvailableModalities(): string[] {
    return [
      'CT', 'MR', 'PT', 'US', 'XA', 'RF', 'DX', 'CR', 'MG', 'NM',
      'SC', 'OT', 'BI', 'CD', 'DG', 'ES', 'LS', 'VL', 'PX'
    ];
  }

  /**
   * Get common body parts for matching rules
   */
  getAvailableBodyParts(): string[] {
    return [
      'HEAD', 'NECK', 'CHEST', 'ABDOMEN', 'PELVIS', 'SPINE',
      'EXTREMITY', 'KNEE', 'ANKLE', 'SHOULDER', 'ELBOW', 'WRIST', 'HAND',
      'HEART', 'LUNG', 'LIVER', 'KIDNEY', 'BRAIN'
    ];
  }

  /**
   * Create default protocol template
   */
  createDefaultProtocol(): HangingProtocol {
    const timestamp = new Date().toISOString();
    
    return {
      id: `custom-${Date.now()}`,
      name: 'New Protocol',
      description: 'Custom hanging protocol created with editor',
      version: '1.0.0',
      createdDate: timestamp,
      protocolMatchingRules: [
        {
          id: 'modality-rule',
          weight: 3,
          attribute: 'Modality',
          constraint: { equals: 'CT' },
          required: false
        }
      ],
      displaySetSelectors: {
        'viewport-0': {
          id: 'viewport-0',
          matchingRules: [
            {
              id: 'default-rule',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: { contains: '' },
              required: false
            }
          ]
        }
      },
      stages: [
        {
          id: 'main-stage',
          name: 'Main Stage',
          viewportStructure: {
            layoutType: 'grid',
            properties: {
              rows: 1,
              columns: 2
            }
          },
          viewports: [
            {
              viewportOptions: {
                viewportType: 'stack',
                toolGroupId: 'default',
                orientation: 'acquisition'
              },
              displaySets: [
                {
                  id: 'viewport-0',
                  matchedDisplaySetsIndex: 0
                }
              ]
            }
          ],
          createdDate: timestamp
        }
      ],
      numberOfPriorsReferenced: -1
    };
  }

  /**
   * Check if service is available and properly initialized
   */
  isServiceAvailable(): boolean {
    return !!this.hangingProtocolService;
  }

  /**
   * Get service status information
   */
  getServiceStatus(): { available: boolean; version?: string; errorMessage?: string } {
    if (!this.hangingProtocolService) {
      return {
        available: false,
        errorMessage: 'HangingProtocolService not found in ServicesManager'
      };
    }

    return {
      available: true,
      version: '3.x' // OHIF v3
    };
  }
}

export default HangingProtocolEditorService; 