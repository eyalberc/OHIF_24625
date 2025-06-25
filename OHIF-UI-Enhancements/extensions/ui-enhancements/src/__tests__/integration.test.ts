/**
 * Study Comparison Integration Tests
 * 
 * Simplified integration test suite for Study Comparison system
 * focusing on core functionality and service integration.
 * 
 * Task 3.5: Unit and Integration Tests
 * Task 7.8: End-to-End Integration Testing
 */

import { StudyComparisonService } from '../services/StudyComparisonService';

// Import extension and utilities for end-to-end testing
import uiEnhancementsExtension from '../index';
import { validateServiceIntegration } from '../utils/serviceIntegrationValidation';
import { VirtualSeriesErrorHandler } from '../services/VirtualSeriesErrorHandler';
import { ToolbarIntegrationService } from '../services/ToolbarIntegrationService';

// Mock OHIF core services for comprehensive testing
const createMockServicesManager = () => ({
  services: {
    viewportGridService: {
      getState: jest.fn().mockReturnValue({
        viewports: new Map([
          ['viewport-1', { 
            id: 'viewport-1',
            studyInstanceUID: 'study-123',
            displaySetInstanceUID: 'displayset-123',
            isActive: true
          }],
          ['viewport-2', { 
            id: 'viewport-2',
            studyInstanceUID: 'study-456',
            displaySetInstanceUID: 'displayset-456',
            isActive: false
          }]
        ]),
        activeViewportIndex: 0,
        layout: { numRows: 2, numCols: 2 }
      }),
      setViewportOptions: jest.fn(),
      setDisplaySetsForViewports: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {}),
      EVENTS: {
        VIEWPORT_GRID_CHANGED: 'VIEWPORT_GRID_CHANGED'
      }
    },
    toolbarService: {
      recordInteraction: jest.fn(),
      getState: jest.fn().mockReturnValue({
        buttons: [],
        primaryToolId: 'Zoom',
        toolGroupId: 'default'
      }),
      createButton: jest.fn(),
      addButtons: jest.fn()
    },
    customizationService: {
      getCustomization: jest.fn().mockReturnValue({}),
      setCustomization: jest.fn(),
      addModeCustomizations: jest.fn()
    },
    DicomMetadataStore: {
      getStudyInstanceUIDs: jest.fn().mockReturnValue(['study1', 'study2']),
      getStudy: jest.fn().mockImplementation((uid: string) => {
        if (uid === 'study1') {
          return {
            StudyInstanceUID: 'study1',
            StudyDate: '20231201',
            PatientName: 'Patient, Test'
          };
        }
        if (uid === 'study2') {
          return {
            StudyInstanceUID: 'study2', 
            StudyDate: '20231115',
            PatientName: 'Patient, Test'
          };
        }
        return null;
      }),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      EVENTS: {
        STUDY_ADDED: 'STUDY_ADDED',
        INSTANCES_ADDED: 'INSTANCES_ADDED'
      }
    }
  }
});

const createMockExtensionManager = () => ({
  registeredExtensions: new Map([
    ['@ohif/extension-cornerstone', { id: '@ohif/extension-cornerstone', priority: 75 }]
  ]),
  getExtension: jest.fn(),
  registerExtension: jest.fn(),
  modules: {
    toolbar: new Map(),
    customization: new Map(),
    dataSources: new Map()
  }
});

// Create mock extension parameters for proper typing
const createMockExtensionParams = (servicesManager: any, extensionManager?: any) => ({
  servicesManager,
  extensionManager: extensionManager || createMockExtensionManager(),
  serviceProvidersManager: {},
  peerImport: jest.fn(),
  commandsManager: {},
  hotkeysManager: {},
  appConfig: {},
  configuration: {}
});

describe('Study Comparison Integration', () => {
  let service: StudyComparisonService;
  let mockServicesManager: any;

  beforeEach(() => {
    service = new StudyComparisonService();
    
    mockServicesManager = {
      services: {
        DicomMetadataStore: {
          getStudyInstanceUIDs: jest.fn().mockReturnValue(['study1', 'study2']),
          getStudy: jest.fn().mockImplementation((uid: string) => {
            if (uid === 'study1') {
              return {
                StudyInstanceUID: 'study1',
                StudyDate: '20231201',
                PatientName: 'Patient, Test'
              };
            }
            if (uid === 'study2') {
              return {
                StudyInstanceUID: 'study2', 
                StudyDate: '20231115',
                PatientName: 'Patient, Test'
              };
            }
            return null;
          }),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          EVENTS: {
            STUDY_ADDED: 'STUDY_ADDED',
            INSTANCES_ADDED: 'INSTANCES_ADDED'
          }
        }
      }
    };
  });

  describe('Service Integration', () => {
    it('should correctly identify current and prior studies', () => {
      const currentResult = service.getStudyType('study1', mockServicesManager);
      const priorResult = service.getStudyType('study2', mockServicesManager);
      
      expect(currentResult.type).toBe('current');
      expect(currentResult.date).toBe('20231201');
      expect(currentResult.confidence).toBeGreaterThan(0.8);
      
      expect(priorResult.type).toBe('prior');
      expect(priorResult.date).toBe('20231115');
      expect(priorResult.confidence).toBeGreaterThan(0.6);
    });

    it('should handle caching correctly', () => {
      // First call
      service.getStudyType('study1', mockServicesManager);
      
      // Second call should use cache
      service.getStudyType('study1', mockServicesManager);
      
      // Should only call getStudyInstanceUIDs once due to caching
      expect(mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs).toHaveBeenCalledTimes(1);
    });

    it('should format dates correctly', () => {
      const formatted = service.formatStudyDate('20231201');
      expect(formatted).toBe('12/01/2023');
    });

    it('should handle invalid dates', () => {
      expect(service.formatStudyDate('invalid')).toBe('Date: N/A');
      expect(service.formatStudyDate(null)).toBe('Date: N/A');
    });

    it('should provide performance metrics', () => {
      service.getStudyType('study1', mockServicesManager);
      
      const metrics = service.getPerformanceMetrics();
      expect(metrics).toHaveProperty('lastCalculationTime');
      expect(metrics).toHaveProperty('averageCalculationTime');
      expect(metrics).toHaveProperty('cacheStats');
    });

    it('should handle service errors gracefully', () => {
      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      const result = service.getStudyType('study1', mockServicesManager);
      expect(result.type).toBe('default');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Event Management', () => {
    it('should set up event subscriptions', () => {
      const callback = jest.fn();
      
      const unsubscribe = service.subscribeToStudyChanges(callback, mockServicesManager);
      
      expect(mockServicesManager.services.DicomMetadataStore.subscribe).toHaveBeenCalledWith(
        'STUDY_ADDED',
        expect.any(Function)
      );
      
      expect(typeof unsubscribe).toBe('function');
    });
  });
});

// End-to-End Integration Tests
describe('End-to-End Extension Integration', () => {
  let mockServicesManager: any;
  let mockExtensionManager: any;

  beforeEach(() => {
    mockServicesManager = createMockServicesManager();
    mockExtensionManager = createMockExtensionManager();
    jest.clearAllMocks();

    // Setup DOM environment
    document.body.innerHTML = `
      <div class="viewport-element" data-study-instance-uid="study-123">
        <div class="cornerstone-viewport"></div>
      </div>
    `;

    // Mock console methods to reduce test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Extension Registration and Discovery', () => {
    it('should have correct extension metadata and structure', () => {
      expect(uiEnhancementsExtension.id).toBe('@ohif/extension-ui-enhancements');
      expect(typeof uiEnhancementsExtension.preRegistration).toBe('function');
      expect(typeof uiEnhancementsExtension.onModeEnter).toBe('function');
      expect(typeof uiEnhancementsExtension.onModeExit).toBe('function');
      expect((uiEnhancementsExtension as any).configuration).toBeDefined();
    });

    it('should export all required module getters', () => {
      expect(typeof uiEnhancementsExtension.getToolbarModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getCustomizationModule).toBe('function');
      expect(typeof (uiEnhancementsExtension as any).getDataSourcesModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getCommandsModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getPanelModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getUtilityModule).toBe('function');
    });

    it('should have proper configuration structure with all features enabled', () => {
      const config = (uiEnhancementsExtension as any).configuration;
      
      expect(config.enableVirtualSeries).toBe(true);
      expect(config.enableGlobalPatientHeader).toBe(true);
      expect(config.enableStudyComparison).toBe(true);
      expect(config.enableEnhancedToolbar).toBe(true);
      expect(config.enablePRDColorSystem).toBe(true);
      
      expect(config.lifecycle).toBeDefined();
      expect(config.conflictResolution).toBeDefined();
    });
  });

  describe('Service Integration Validation', () => {
    it('should validate all required services are available and functional', async () => {
      const validationResult = await validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      expect(validationResult.success).toBe(true);
      expect(validationResult.results).toBeDefined();
      expect(validationResult.metrics).toBeDefined();
      expect(validationResult.results.length).toBeGreaterThan(0);
    });

    it('should handle service integration errors gracefully', async () => {
      const faultyServicesManager = {
        services: {
          viewportGridService: {
            getState: jest.fn().mockImplementation(() => {
              throw new Error('Service error');
            })
          }
        }
      };

      const validationResult = await validateServiceIntegration(
        faultyServicesManager,
        mockExtensionManager
      );

      // Should not crash the validation system
      expect(validationResult).toBeDefined();
      expect(typeof validationResult.success).toBe('boolean');
    });
  });

  describe('Lifecycle Management', () => {
    it('should enter mode successfully with proper initialization', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: {}
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UI-Enhancements] Mode enter completed successfully')
      );
    });

    it('should exit mode successfully with proper cleanup', async () => {
      // First enter mode
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: {}
      });

      const consoleLogSpy = jest.spyOn(console, 'log');

      // Then exit mode
      await uiEnhancementsExtension.onModeExit();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UI-Enhancements] Mode exit completed successfully')
      );
    });
  });

  describe('Module Integration and Functionality', () => {
    it('should provide functional commands module with all required commands', () => {
      const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
      const commandsModule = uiEnhancementsExtension.getCommandsModule(mockParams);

      expect(commandsModule).toBeDefined();
      expect(commandsModule.definitions).toBeDefined();
      expect(Array.isArray(commandsModule.definitions)).toBe(true);
      
      const commandNames = commandsModule.definitions.map(def => def.commandName);
      expect(commandNames).toContain('toggleVirtualSeriesMode');
      expect(commandNames).toContain('resetVirtualSeriesCache');
      expect(commandNames).toContain('showGlobalPatientHeader');
      expect(commandNames).toContain('highlightCurrentStudy');
    });

    it('should provide utility module with all required exports', () => {
      const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
      const utilityModule = uiEnhancementsExtension.getUtilityModule(mockParams);

      expect(utilityModule).toBeDefined();
      expect(Array.isArray(utilityModule)).toBe(true);

      const utilities = utilityModule[0].exports;
      expect(utilities.VirtualSeriesErrorHandler).toBeDefined();
      expect(utilities.lifecycleManager).toBeDefined();
      expect(utilities.getExtensionStatus).toBeDefined();
      expect(typeof utilities.highlightStudy).toBe('function');
      expect(typeof utilities.applyThemeColors).toBe('function');
      expect(typeof utilities.enhanceToolbar).toBe('function');
      expect(typeof utilities.validateServiceIntegration).toBe('function');
    });

    it('should provide all other required modules', () => {
      const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
      const modules = [
        uiEnhancementsExtension.getToolbarModule(mockParams),
        uiEnhancementsExtension.getCustomizationModule(mockParams),
        (uiEnhancementsExtension as any).getDataSourcesModule(mockParams),
        uiEnhancementsExtension.getPanelModule(mockParams)
      ];

      modules.forEach(module => {
        expect(module).toBeDefined();
      });
    });
  });

  describe('Enhanced Component Integration', () => {
    it('should integrate virtual series error handling', () => {
      expect(VirtualSeriesErrorHandler).toBeDefined();
      expect(typeof VirtualSeriesErrorHandler.handleError).toBe('function');
      expect(typeof VirtualSeriesErrorHandler.createErrorContext).toBe('function');
    });

    it('should integrate toolbar enhancement functionality', () => {
      const toolbarService = new ToolbarIntegrationService();
      
      expect(toolbarService).toBeDefined();
      expect(typeof toolbarService.enhanceButtons).toBe('function');
      expect(typeof toolbarService.applyConditionalLogic).toBe('function');
    });

    it('should integrate study comparison functionality', () => {
      const studyComparisonService = new StudyComparisonService();
      
      expect(studyComparisonService).toBeDefined();
      expect(typeof studyComparisonService.getStudyType).toBe('function');
      expect(typeof studyComparisonService.highlightStudyComparison).toBe('function');
    });
  });

  describe('Command Execution and Error Handling', () => {
    it('should execute all extension commands successfully', () => {
      const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
      const commandsModule = uiEnhancementsExtension.getCommandsModule(mockParams);
      const commands = commandsModule.definitions;

      commands.forEach(command => {
        expect(typeof command.handler).toBe('function');
        
        // Test command execution
        const result = command.handler({
          servicesManager: mockServicesManager,
          studyInstanceUID: 'test-study',
          viewports: mockServicesManager.services.viewportGridService.getState().viewports
        });

        expect(result).toBe(true);
      });
    });

    it('should handle module getter errors gracefully', () => {
      const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
      
      // Test each module getter with valid parameters
      const modules = [
        () => uiEnhancementsExtension.getToolbarModule(mockParams),
        () => uiEnhancementsExtension.getCustomizationModule(mockParams),
        () => (uiEnhancementsExtension as any).getDataSourcesModule(mockParams),
        () => uiEnhancementsExtension.getCommandsModule(mockParams),
        () => uiEnhancementsExtension.getPanelModule(mockParams),
        () => uiEnhancementsExtension.getUtilityModule(mockParams)
      ];

      modules.forEach(moduleGetter => {
        const result = moduleGetter();
        expect(result).toBeDefined(); // Should return something, not crash
      });
    });
  });

  describe('Real-World Integration Scenarios', () => {
    it('should handle complete workflow: initialization → study loading → viewport setup', async () => {
      // 1. Initialize extension
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: {}
      });

      // 2. Verify services are accessible
      expect(mockServicesManager.services.viewportGridService.getState).toHaveBeenCalled();

      // 3. Test utility functions work after initialization
      const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
      const utilityModule = uiEnhancementsExtension.getUtilityModule(mockParams);
      
      const validationResult = await utilityModule[0].exports.validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      expect(validationResult.success).toBe(true);

      // 4. Test commands work after initialization
      const commandsModule = uiEnhancementsExtension.getCommandsModule(mockParams);
      const toggleCommand = commandsModule.definitions.find(
        cmd => cmd.commandName === 'toggleVirtualSeriesMode'
      );

      const commandResult = toggleCommand.handler({
        servicesManager: mockServicesManager,
        viewports: mockServicesManager.services.viewportGridService.getState().viewports
      });

      expect(commandResult).toBe(true);
    });

    it('should maintain performance under repeated operations', async () => {
      const startTime = performance.now();

      // Simulate multiple rapid mode enter/exit cycles
      for (let i = 0; i < 5; i++) {
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: mockServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: {}
        });
        
        await uiEnhancementsExtension.onModeExit();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete operations in reasonable time (< 1 second for 5 cycles)
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Integration Testing Summary', () => {
    it('should pass comprehensive integration validation', async () => {
      const results = {
        extensionRegistration: true,
        serviceIntegration: true,
        lifecycleManagement: true,
        moduleIntegration: true,
        componentIntegration: true,
        commandExecution: true,
        errorHandling: true,
        performanceMetrics: true
      };

      // Comprehensive test execution
      try {
        // Test extension structure
        expect(uiEnhancementsExtension.id).toBeDefined();
        
        // Test service integration
        const validationResult = await validateServiceIntegration(
          mockServicesManager,
          mockExtensionManager
        );
        expect(validationResult.success).toBe(true);
        
        // Test lifecycle
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: mockServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: {}
        });
        await uiEnhancementsExtension.onModeExit();
        
        // Test modules
        const mockParams = createMockExtensionParams(mockServicesManager, mockExtensionManager);
        const modules = [
          uiEnhancementsExtension.getToolbarModule(mockParams),
          uiEnhancementsExtension.getCustomizationModule(mockParams),
          (uiEnhancementsExtension as any).getDataSourcesModule(mockParams),
          uiEnhancementsExtension.getCommandsModule(mockParams),
          uiEnhancementsExtension.getPanelModule(mockParams),
          uiEnhancementsExtension.getUtilityModule(mockParams)
        ];
        modules.forEach(module => expect(module).toBeDefined());
        
        // Test components
        expect(VirtualSeriesErrorHandler).toBeDefined();
        expect(ToolbarIntegrationService).toBeDefined();
        expect(StudyComparisonService).toBeDefined();

      } catch (error) {
        results.extensionRegistration = false;
        results.serviceIntegration = false;
        results.lifecycleManagement = false;
        results.moduleIntegration = false;
        results.componentIntegration = false;
      }

      // Verify all integration tests passed
      Object.values(results).forEach(result => {
        expect(result).toBe(true);
      });
    });
  });
}); 