/**
 * Unit Tests for ProtocolValidationService
 * 
 * Tests comprehensive validation logic including protocol structure,
 * matching rules, business rules, and performance analysis.
 * 
 * Task 5.8: Write Unit and Integration Tests
 */

import { ProtocolValidationService } from '../services/ProtocolValidationService';

describe('ProtocolValidationService', () => {
  
  describe('Service Functionality', () => {
    it('should have validateProtocol method', () => {
      expect(ProtocolValidationService.validateProtocol).toBeDefined();
      expect(typeof ProtocolValidationService.validateProtocol).toBe('function');
    });

    it('should have validateProtocolQuick method', () => {
      expect(ProtocolValidationService.validateProtocolQuick).toBeDefined();
      expect(typeof ProtocolValidationService.validateProtocolQuick).toBe('function');
    });
  });

  describe('Basic Validation Logic', () => {
    it('should validate a simple valid protocol', () => {
      const validProtocol = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [
          {
            id: 'stage-1',
            name: 'Main Stage',
            viewportStructure: {
              layoutType: 'grid',
              properties: { rows: 2, columns: 2 }
            },
            viewports: [
              {
                viewportOptions: { viewportType: 'stack' },
                displaySets: [{ id: 'ds-1', matchedDisplaySetsIndex: 0 }]
              }
            ]
          }
        ],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(validProtocol);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing protocol ID', () => {
      const invalidProtocol = {
        id: '',
        name: 'Test Protocol',
        stages: [],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(invalidProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => 
        error.field === 'id' || error.message.includes('ID')
      )).toBe(true);
    });

    it('should detect missing protocol name', () => {
      const invalidProtocol = {
        id: 'test-protocol',
        name: '',
        stages: [],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(invalidProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => 
        error.field === 'name' || error.message.toLowerCase().includes('name')
      )).toBe(true);
    });

    it('should detect empty stages array', () => {
      const invalidProtocol = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(invalidProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => 
        error.field === 'stages' || error.message.toLowerCase().includes('stage')
      )).toBe(true);
    });
  });

  describe('Quick Validation', () => {
    it('should provide quick validation results', () => {
      const protocol = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [
          {
            id: 'stage-1',
            viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 1 } },
            viewports: [{ viewportOptions: { viewportType: 'stack' }, displaySets: [] }]
          }
        ],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocolQuick(protocol);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should detect basic errors in quick validation', () => {
      const invalidProtocol = {
        id: '',
        name: '',
        stages: [],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocolQuick(invalidProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should be performant for quick validation', () => {
      const protocol = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [
          {
            id: 'stage-1',
            viewportStructure: { layoutType: 'grid', properties: { rows: 2, columns: 2 } },
            viewports: Array.from({ length: 4 }, (_, i) => ({
              viewportOptions: { viewportType: 'stack' },
              displaySets: [{ id: `ds-${i}`, matchedDisplaySetsIndex: 0 }]
            }))
          }
        ],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const startTime = performance.now();
      const result = ProtocolValidationService.validateProtocolQuick(protocol);
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Matching Rules Validation', () => {
    it('should validate protocols with matching rules', () => {
      const protocolWithRules = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [
          {
            id: 'stage-1',
            viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 1 } },
            viewports: [{ viewportOptions: { viewportType: 'stack' }, displaySets: [] }]
          }
        ],
        protocolMatchingRules: [
          {
            id: 'rule-1',
            weight: 1,
            attribute: 'Modality',
            constraint: { equals: 'CT' },
            required: true
          }
        ],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(protocolWithRules);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid matching rule weights', () => {
      const protocolWithInvalidRules = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [
          {
            id: 'stage-1',
            viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 1 } },
            viewports: [{ viewportOptions: { viewportType: 'stack' }, displaySets: [] }]
          }
        ],
        protocolMatchingRules: [
          {
            id: 'rule-1',
            weight: -1, // Invalid weight
            attribute: 'Modality',
            constraint: { equals: 'CT' },
            required: true
          }
        ],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(protocolWithInvalidRules);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.message.toLowerCase().includes('weight')
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined input gracefully', () => {
      expect(() => ProtocolValidationService.validateProtocol(null as any)).not.toThrow();
      expect(() => ProtocolValidationService.validateProtocol(undefined as any)).not.toThrow();
      
      const nullResult = ProtocolValidationService.validateProtocol(null as any);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed protocol objects', () => {
      const malformedProtocol = { randomField: 'value' } as any;
      
      const result = ProtocolValidationService.validateProtocol(malformedProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty objects', () => {
      const emptyProtocol = {} as any;
      
      const result = ProtocolValidationService.validateProtocol(emptyProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle validation efficiently', () => {
      const largeProtocol = {
        id: 'large-protocol',
        name: 'Large Test Protocol',
        stages: Array.from({ length: 5 }, (_, i) => ({
          id: `stage-${i}`,
          viewportStructure: { layoutType: 'grid', properties: { rows: 2, columns: 2 } },
          viewports: Array.from({ length: 4 }, (_, j) => ({
            viewportOptions: { viewportType: 'stack' },
            displaySets: [{ id: `ds-${i}-${j}`, matchedDisplaySetsIndex: 0 }]
          }))
        })),
        protocolMatchingRules: Array.from({ length: 20 }, (_, i) => ({
          id: `rule-${i}`,
          weight: 1,
          attribute: 'Modality',
          constraint: { equals: 'CT' },
          required: false
        })),
        numberOfPriorsReferenced: 0
      };

      const startTime = performance.now();
      const result = ProtocolValidationService.validateProtocol(largeProtocol);
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(200); // Should complete reasonably fast
    });
  });

  describe('Validation Result Structure', () => {
    it('should return properly structured validation results', () => {
      const protocol = {
        id: 'test-protocol',
        name: 'Test Protocol',
        stages: [],
        protocolMatchingRules: [],
        numberOfPriorsReferenced: 0
      };

      const result = ProtocolValidationService.validateProtocol(protocol);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should include proper error structure', () => {
      const invalidProtocol = { id: '', name: '', stages: [] };

      const result = ProtocolValidationService.validateProtocol(invalidProtocol);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      result.errors.forEach(error => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('severity');
        expect(typeof error.message).toBe('string');
        expect(['error', 'warning']).toContain(error.severity);
      });
    });
  });
}); 