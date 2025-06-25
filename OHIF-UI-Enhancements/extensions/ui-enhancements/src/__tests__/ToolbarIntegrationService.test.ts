/**
 * ToolbarIntegrationService Unit Tests
 * 
 * Tests for OHIF service integration, event handling,
 * and accessibility features in the toolbar service.
 * 
 * Task 2.6: Unit and Integration Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ToolbarIntegrationService } from '../services/ToolbarIntegrationService';
import { ServiceToolbarButton } from '../types/toolbar.types';

// Mock OHIF services
const mockServicesManager = {
  services: {
    toolbarService: {
      register: jest.fn(),
      recordInteraction: jest.fn(),
      removeButton: jest.fn(),
      getState: jest.fn(() => ({ buttons: [], sections: [] })),
      refresh: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    },
    displaySetService: {
      getActiveDisplaySets: jest.fn(() => []),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    },
    viewportGridService: {
      getActiveViewportId: jest.fn(() => 'viewport-1'),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }
  }
};

// Mock DOM for accessibility testing
const mockToolbarElement = {
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  setAttribute: jest.fn(),
  getAttribute: jest.fn()
};

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    readyState: 'complete',
    querySelector: jest.fn(() => mockToolbarElement),
    addEventListener: jest.fn(),
    body: {
      appendChild: jest.fn()
    }
  },
  writable: true
});

// Mock accessibility utils
jest.mock('../utils/accessibilityUtils', () => ({
  createKeyboardNavigationController: jest.fn(() => ({
    activate: jest.fn(),
    deactivate: jest.fn(),
    focusButton: jest.fn(),
    getCurrentIndex: jest.fn(() => 0),
    getButtonCount: jest.fn(() => 10),
    isActive: jest.fn(() => true)
  })),
  validateAccessibility: jest.fn(() => ({
    isCompliant: true,
    issues: [],
    score: 100
  })),
  announceToScreenReader: jest.fn(),
  manageFocus: jest.fn(),
  DEFAULT_A11Y_CONFIG: {
    enableKeyboardNav: true,
    enableScreenReader: true,
    enableFocusManagement: true,
    enableHighContrast: true,
    announceStateChanges: true
  }
}));

// Mock toolbar utils
jest.mock('../utils/toolbarUtils', () => ({
  logToolbar: jest.fn(),
  debounce: jest.fn((fn) => fn)
}));

import {
  createKeyboardNavigationController,
  validateAccessibility,
  announceToScreenReader,
  manageFocus
} from '../utils/accessibilityUtils';

import { logToolbar } from '../utils/toolbarUtils';

describe('ToolbarIntegrationService', () => {
  let toolbarService: ToolbarIntegrationService;
  let mockButtons: any[];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
         // Create sample toolbar buttons
     mockButtons = [
       {
         id: 'Layout',
         groupId: 'view-tools',
         itemId: 'Layout',
         interactionType: 'tool',
         props: {
           groupId: 'view-tools',
           itemId: 'Layout',
           interactionType: 'tool',
           label: 'Layout',
           className: 'toolbar-button'
         },
         evaluate: jest.fn(() => ({ visible: true, disabled: false }))
       },
       {
         id: 'WindowLevel',
         groupId: 'view-tools',
         itemId: 'WindowLevel',
         interactionType: 'tool',
         props: {
           groupId: 'view-tools',
           itemId: 'WindowLevel',
           interactionType: 'tool',
           label: 'Window/Level',
           className: 'toolbar-button'
         },
         evaluate: jest.fn(() => ({ visible: true, disabled: false }))
       }
     ];

    // Create service instance
    toolbarService = new ToolbarIntegrationService(
      mockServicesManager as any,
      {
        autoRegister: true,
        autoRefresh: true,
        subscribeToEvents: ['DISPLAY_SETS_ADDED', 'VIEWPORT_DATA_CHANGED']
      },
             {
         logErrors: true,
         showUserErrors: false
       } as any
    );
  });

  afterEach(() => {
    if (toolbarService && !toolbarService.getStatus().isDestroyed) {
      toolbarService.destroy();
    }
    jest.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully with valid services', async () => {
      await toolbarService.initialize();
      
      const status = toolbarService.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.isDestroyed).toBe(false);
    });

    it('should initialize accessibility features during setup', async () => {
      await toolbarService.initialize();
      
      expect(createKeyboardNavigationController).toHaveBeenCalled();
      expect(validateAccessibility).toHaveBeenCalled();
      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Toolbar accessibility features enabled',
        'polite'
      );
    });

    it('should log initialization completion', async () => {
      await toolbarService.initialize();
      
      expect(logToolbar).toHaveBeenCalledWith(
        'info',
        'Enhanced ToolbarIntegrationService initialization complete'
      );
    });

    it('should not initialize twice', async () => {
      await toolbarService.initialize();
      await toolbarService.initialize();
      
      expect(logToolbar).toHaveBeenCalledWith(
        'warn',
        'ToolbarIntegrationService already initialized'
      );
    });

    it('should handle missing toolbar service gracefully', async () => {
      const mockServicesWithoutToolbar = {
        services: {
          displaySetService: mockServicesManager.services.displaySetService,
          viewportGridService: mockServicesManager.services.viewportGridService
        }
      };

      const serviceWithoutToolbar = new ToolbarIntegrationService(
        mockServicesWithoutToolbar as any
      );

      await serviceWithoutToolbar.initialize();
      
      expect(logToolbar).toHaveBeenCalledWith(
        'warn',
        'ToolbarService not available - enhanced toolbar integration disabled'
      );
    });
  });

  describe('Button Registration and Management', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should register buttons with the ToolbarService', () => {
      toolbarService.registerButtons(mockButtons);
      
      expect(mockServicesManager.services.toolbarService.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'Layout',
            uiType: 'ohif.splitButton'
          }),
          expect.objectContaining({
            id: 'WindowLevel',
            uiType: 'ohif.splitButton'
          })
        ]),
        true
      );
    });

    it('should track registered buttons', () => {
      toolbarService.registerButtons(mockButtons);
      
      expect(toolbarService.isButtonRegistered('Layout')).toBe(true);
      expect(toolbarService.isButtonRegistered('WindowLevel')).toBe(true);
      expect(toolbarService.isButtonRegistered('NonExistent')).toBe(false);
    });

    it('should remove buttons correctly', () => {
      toolbarService.registerButtons(mockButtons);
      toolbarService.removeButtons(['Layout']);
      
      expect(mockServicesManager.services.toolbarService.removeButton).toHaveBeenCalledWith('Layout');
      expect(toolbarService.isButtonRegistered('Layout')).toBe(false);
      expect(toolbarService.isButtonRegistered('WindowLevel')).toBe(true);
    });

    it('should handle registration errors gracefully', () => {
      // Mock registration error
      mockServicesManager.services.toolbarService.register.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      expect(() => {
        toolbarService.registerButtons(mockButtons);
      }).not.toThrow();

      expect(logToolbar).toHaveBeenCalledWith(
        'error',
        'Error registering toolbar buttons',
        expect.any(Error)
      );
    });

    it('should validate initialization before registration', () => {
      const uninitializedService = new ToolbarIntegrationService(mockServicesManager as any);
      
      uninitializedService.registerButtons(mockButtons);
      
      expect(mockServicesManager.services.toolbarService.register).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling and Subscriptions', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should subscribe to configured service events', () => {
      expect(mockServicesManager.services.displaySetService.subscribe).toHaveBeenCalled();
      expect(mockServicesManager.services.viewportGridService.subscribe).toHaveBeenCalled();
    });

    it('should handle service events and trigger refresh', () => {
      // Simulate display set change
      const displaySetCallback = mockServicesManager.services.displaySetService.subscribe.mock.calls[0][1];
      displaySetCallback({ displaySets: [{ Modality: 'CT' }] });
      
      // Should announce to screen readers
      expect(announceToScreenReader).toHaveBeenCalledWith('Images updated', 'polite');
    });

    it('should handle viewport changes', () => {
      // Simulate viewport change
      const viewportCallback = mockServicesManager.services.viewportGridService.subscribe.mock.calls[0][1];
      viewportCallback({ layout: '2x2' });
      
      // Should announce to screen readers
      expect(announceToScreenReader).toHaveBeenCalledWith('Layout changed to 2x2', 'polite');
    });

    it('should handle subscription errors gracefully', () => {
      // Mock subscription error
      const errorCallback = mockServicesManager.services.displaySetService.subscribe.mock.calls[0][1];
      
      expect(() => {
        errorCallback(null); // Trigger error condition
      }).not.toThrow();
    });
  });

  describe('Interaction Handling', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should handle toolbar interactions correctly', () => {
      const interaction = {
        itemId: 'Layout',
        interactionType: 'tool',
        label: 'Layout Tool'
      };

      toolbarService.handleInteraction(interaction);
      
      expect(mockServicesManager.services.toolbarService.recordInteraction).toHaveBeenCalledWith(interaction);
      expect(announceToScreenReader).toHaveBeenCalledWith('Layout Tool activated', 'polite');
    });

    it('should handle interaction errors gracefully', () => {
      mockServicesManager.services.toolbarService.recordInteraction.mockImplementation(() => {
        throw new Error('Interaction failed');
      });

      const interaction = { itemId: 'Layout', interactionType: 'tool' };
      
      expect(() => {
        toolbarService.handleInteraction(interaction);
      }).not.toThrow();

      expect(logToolbar).toHaveBeenCalledWith(
        'error',
        'Error handling toolbar interaction',
        expect.any(Error)
      );
    });

    it('should not handle interactions when not initialized', () => {
      const uninitializedService = new ToolbarIntegrationService(mockServicesManager as any);
      const interaction = { itemId: 'Layout', interactionType: 'tool' };
      
      uninitializedService.handleInteraction(interaction);
      
      expect(mockServicesManager.services.toolbarService.recordInteraction).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Integration', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should initialize keyboard navigation controller', () => {
      expect(createKeyboardNavigationController).toHaveBeenCalledWith(
        mockToolbarElement,
        expect.objectContaining({
          enableKeyboardNav: true,
          enableScreenReader: true
        })
      );
    });

    it('should validate accessibility compliance', () => {
      expect(validateAccessibility).toHaveBeenCalledWith(mockToolbarElement);
    });

    it('should provide accessibility status information', () => {
      const status = toolbarService.getAccessibilityStatus();
      
      expect(status).toMatchObject({
        isCompliant: true,
        features: expect.arrayContaining([
          'Keyboard Navigation',
          'Screen Reader Support',
          'Focus Management',
          'High Contrast Support'
        ]),
        issues: [],
        score: 100
      });
    });

    it('should focus buttons correctly', () => {
      // Mock button element
      const mockButton = { ...mockToolbarElement };
      mockToolbarElement.querySelector.mockReturnValue(mockButton);
      mockToolbarElement.querySelectorAll.mockReturnValue([mockButton]);

      const result = toolbarService.focusButton('Layout');
      
      expect(result).toBe(true);
    });

    it('should handle focus errors gracefully', () => {
      mockToolbarElement.querySelector.mockReturnValue(null);
      
      const result = toolbarService.focusButton('NonExistent');
      
      expect(result).toBe(false);
      expect(logToolbar).toHaveBeenCalledWith(
        'warn',
        'Button not found: NonExistent'
      );
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should refresh toolbar state correctly', () => {
      toolbarService.refreshToolbarState({ viewportId: 'test-viewport' });
      
      expect(mockServicesManager.services.toolbarService.refresh).toHaveBeenCalledWith({
        viewportId: 'test-viewport'
      });
    });

    it('should get toolbar state from service', () => {
      const mockState = { buttons: [], sections: [] };
      mockServicesManager.services.toolbarService.getState.mockReturnValue(mockState);
      
      const state = toolbarService.getToolbarState();
      
      expect(state).toEqual(mockState);
    });

    it('should handle state retrieval errors', () => {
      mockServicesManager.services.toolbarService.getState.mockImplementation(() => {
        throw new Error('State retrieval failed');
      });
      
      const state = toolbarService.getToolbarState();
      
      expect(state).toBeNull();
      expect(logToolbar).toHaveBeenCalledWith(
        'error',
        'Error getting toolbar state',
        expect.any(Error)
      );
    });

    it('should provide comprehensive status information', () => {
      toolbarService.registerButtons(mockButtons);
      
      const status = toolbarService.getStatus();
      
      expect(status).toMatchObject({
        isInitialized: true,
        isDestroyed: false,
        servicesAvailable: {
          toolbarService: true,
          displaySetService: true,
          viewportGridService: true
        },
        registeredButtonCount: 2,
        activeSubscriptions: expect.any(Number),
        accessibilityFeatures: expect.arrayContaining([
          'enableKeyboardNav',
          'enableScreenReader'
        ])
      });
    });
  });

  describe('Error Recovery and Cleanup', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should handle evaluate function errors with fallback', () => {
      const buttonWithErrorEvaluate = {
        ...mockButtons[0],
        evaluate: jest.fn(() => {
          throw new Error('Evaluation failed');
        })
      };

      // Should not throw when registering button with failing evaluate
      expect(() => {
        toolbarService.registerButtons([buttonWithErrorEvaluate]);
      }).not.toThrow();
    });

    it('should clean up properly on destroy', () => {
      toolbarService.registerButtons(mockButtons);
      
      toolbarService.destroy();
      
      const status = toolbarService.getStatus();
      expect(status.isDestroyed).toBe(true);
      expect(status.isInitialized).toBe(false);
      expect(status.registeredButtonCount).toBe(0);
    });

    it('should not allow operations after destroy', () => {
      toolbarService.destroy();
      
      toolbarService.registerButtons(mockButtons);
      
      expect(mockServicesManager.services.toolbarService.register).not.toHaveBeenCalled();
    });

    it('should unsubscribe from all events on destroy', () => {
      toolbarService.destroy();
      
      // Verify unsubscribe calls for each service
      expect(mockServicesManager.services.displaySetService.unsubscribe).toHaveBeenCalled();
      expect(mockServicesManager.services.viewportGridService.unsubscribe).toHaveBeenCalled();
    });

    it('should deactivate keyboard controller on destroy', () => {
      const mockController = {
        activate: jest.fn(),
        deactivate: jest.fn()
      };
      
      (createKeyboardNavigationController as jest.Mock).mockReturnValue(mockController);
      
      // Re-initialize to get the mock controller
      toolbarService.destroy();
      toolbarService = new ToolbarIntegrationService(mockServicesManager as any);
      toolbarService.initialize();
      
      toolbarService.destroy();
      
      expect(mockController.deactivate).toHaveBeenCalled();
    });

    it('should handle destroy errors gracefully', () => {
      // Mock unsubscribe error
      mockServicesManager.services.displaySetService.unsubscribe.mockImplementation(() => {
        throw new Error('Unsubscribe failed');
      });
      
      expect(() => {
        toolbarService.destroy();
      }).not.toThrow();

      expect(logToolbar).toHaveBeenCalledWith(
        'error',
        'Error unsubscribing from services',
        expect.any(Error)
      );
    });
  });

  describe('Performance and Memory Management', () => {
    beforeEach(async () => {
      await toolbarService.initialize();
    });

    it('should not create memory leaks with repeated registrations', () => {
      // Register buttons multiple times
      for (let i = 0; i < 5; i++) {
        toolbarService.registerButtons(mockButtons);
      }
      
      const status = toolbarService.getStatus();
      expect(status.registeredButtonCount).toBe(2); // Should not accumulate
    });

    it('should handle rapid state refreshes efficiently', () => {
      // Trigger multiple rapid refreshes
      for (let i = 0; i < 10; i++) {
        toolbarService.refreshToolbarState();
      }
      
      // Should handle without errors
      expect(mockServicesManager.services.toolbarService.refresh).toHaveBeenCalled();
    });

    it('should validate button arrays before processing', () => {
      // Test with invalid input
      toolbarService.registerButtons(null as any);
      toolbarService.registerButtons(undefined as any);
      toolbarService.registerButtons('invalid' as any);
      
      // Should not call register with invalid inputs
      expect(mockServicesManager.services.toolbarService.register).not.toHaveBeenCalled();
    });
  });
}); 