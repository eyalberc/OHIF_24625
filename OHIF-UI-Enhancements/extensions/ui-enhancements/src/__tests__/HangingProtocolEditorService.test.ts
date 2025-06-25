/**
 * Unit Tests for HangingProtocolEditorService
 * 
 * Tests core service functionality including CRUD operations, validation,
 * error handling, and OHIF integration.
 * 
 * Task 5.8: Write Unit and Integration Tests
 */

import { HangingProtocolEditorService } from '../services/HangingProtocolEditorService';

// Mock OHIF services
const mockHangingProtocolService = {
  getProtocols: jest.fn(),
  addProtocol: jest.fn(),
  removeProtocol: jest.fn(),
  run: jest.fn(),
  setActiveProtocol: jest.fn()
};

// Mock services manager
const mockServicesManager = {
  services: {
    hangingProtocolService: mockHangingProtocolService
  }
};

describe('HangingProtocolEditorService', () => {
  let service: HangingProtocolEditorService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance
    service = new HangingProtocolEditorService(mockServicesManager as any);
  });

  describe('Service Initialization', () => {
    it('should initialize with services manager', () => {
      expect(service).toBeDefined();
      expect(service['servicesManager']).toBe(mockServicesManager);
    });

    it('should handle missing hanging protocol service gracefully', () => {
      const emptyServicesManager = { services: {} };
      const emptyService = new HangingProtocolEditorService(emptyServicesManager as any);
      expect(emptyService).toBeDefined();
    });
  });

  describe('Service Availability', () => {
    it('should detect when hanging protocol service is available', () => {
      expect(service.isServiceAvailable()).toBe(true);
    });

    it('should detect when hanging protocol service is not available', () => {
      const serviceWithoutHangingProtocol = new HangingProtocolEditorService({
        services: {}
      } as any);

      expect(serviceWithoutHangingProtocol.isServiceAvailable()).toBe(false);
    });
  });

  describe('Protocol Retrieval', () => {
    it('should get all protocols successfully', async () => {
      const mockProtocols = [
        { id: 'protocol-1', name: 'Test Protocol 1' },
        { id: 'protocol-2', name: 'Test Protocol 2' }
      ];
      mockHangingProtocolService.getProtocols.mockResolvedValue(mockProtocols);

      const result = await service.getProtocols();

      expect(result).toEqual(mockProtocols);
      expect(mockHangingProtocolService.getProtocols).toHaveBeenCalledTimes(1);
    });

    it('should handle service unavailable error', async () => {
      mockHangingProtocolService.getProtocols.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.getProtocols()).rejects.toThrow('Failed to retrieve protocols: Service unavailable');
    });

    it('should return empty array when no protocols exist', async () => {
      mockHangingProtocolService.getProtocols.mockResolvedValue([]);

      const result = await service.getProtocols();

      expect(result).toEqual([]);
    });
  });

  describe('Protocol Deletion', () => {
    it('should remove protocol successfully', async () => {
      mockHangingProtocolService.removeProtocol.mockResolvedValue(true);

      const result = await service.removeProtocol('test-protocol-1');

      expect(result).toBe(true);
      expect(mockHangingProtocolService.removeProtocol).toHaveBeenCalledWith('test-protocol-1');
    });

    it('should handle deletion failure', async () => {
      mockHangingProtocolService.removeProtocol.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.removeProtocol('test-protocol-1')).rejects.toThrow('Failed to remove protocol: Deletion failed');
    });

    it('should reject empty protocol ID', async () => {
      await expect(service.removeProtocol('')).rejects.toThrow('Protocol ID is required');
    });
  });

  describe('Default Protocol Factory', () => {
    it('should create default protocol with correct structure', () => {
      const defaultProtocol = service.createDefaultProtocol();

      expect(defaultProtocol.id).toBeDefined();
      expect(defaultProtocol.name).toBe('New Protocol');
      expect(defaultProtocol.stages).toHaveLength(1);
      expect(defaultProtocol.stages[0].viewports).toHaveLength(1);
      expect(defaultProtocol.protocolMatchingRules).toHaveLength(0);
    });

    it('should create unique IDs for multiple default protocols', () => {
      const protocol1 = service.createDefaultProtocol();
      const protocol2 = service.createDefaultProtocol();

      expect(protocol1.id).not.toBe(protocol2.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle service method not found', async () => {
      const brokenService = {
        services: {
          hangingProtocolService: {}
        }
      };
      const service = new HangingProtocolEditorService(brokenService as any);

      await expect(service.getProtocols()).rejects.toThrow(/Failed to retrieve protocols/);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      await expect(service.removeProtocol(null as any)).rejects.toThrow('Protocol ID is required');
      await expect(service.removeProtocol(undefined as any)).rejects.toThrow('Protocol ID is required');
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of protocols efficiently', async () => {
      const largeProtocolArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `protocol-${i}`,
        name: `Protocol ${i}`
      }));

      mockHangingProtocolService.getProtocols.mockResolvedValue(largeProtocolArray);

      const startTime = performance.now();
      const result = await service.getProtocols();
      const endTime = performance.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Protocol Creation and Updates', () => {
    it('should handle protocol addition with validation', async () => {
      const validProtocol = service.createDefaultProtocol();
      mockHangingProtocolService.addProtocol.mockResolvedValue(true);

      const result = await service.addProtocol(validProtocol);

      expect(result).toBe(true);
      expect(mockHangingProtocolService.addProtocol).toHaveBeenCalledWith(validProtocol);
    });

    it('should handle protocol update with validation', async () => {
      const validProtocol = service.createDefaultProtocol();
      validProtocol.name = 'Updated Protocol';
      mockHangingProtocolService.addProtocol.mockResolvedValue(true);

      const result = await service.updateProtocol(validProtocol);

      expect(result).toBe(true);
      expect(mockHangingProtocolService.addProtocol).toHaveBeenCalledWith(validProtocol);
    });

    it('should validate protocol before operations', async () => {
      const invalidProtocol = { id: '', name: '', stages: [] } as any;

      await expect(service.addProtocol(invalidProtocol)).rejects.toThrow(/Protocol validation failed/);
      await expect(service.updateProtocol(invalidProtocol)).rejects.toThrow(/Protocol validation failed/);
    });
  });

  describe('Protocol Validation', () => {
    it('should validate default protocol as valid', () => {
      const defaultProtocol = service.createDefaultProtocol();
      const result = service.validateProtocol(defaultProtocol);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide quick validation for real-time feedback', () => {
      const defaultProtocol = service.createDefaultProtocol();
      const result = service.validateProtocolQuick(defaultProtocol);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidProtocol = { id: '', name: '', stages: [] } as any;

      const result = service.validateProtocol(invalidProtocol);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific error types
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes('ID') || msg.includes('name'))).toBe(true);
    });
  });
}); 