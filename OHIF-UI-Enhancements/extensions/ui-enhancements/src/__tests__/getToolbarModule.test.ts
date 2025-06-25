/**
 * Enhanced Toolbar Module Unit Tests
 * 
 * Comprehensive test suite for the enhanced toolbar implementation
 * covering PRD compliance, accessibility, and service integration.
 * 
 * Task 2.6: Unit and Integration Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import getToolbarModule from '../getToolbarModule';
import { 
  ToolbarModuleDefinition,
  ToolbarElement,
  OHIFContext,
  ButtonEvaluationResult
} from '../types/toolbar.types';

// Mock dependencies
jest.mock('../utils/toolbarUtils', () => ({
  createToolbarButton: jest.fn(),
  createStandardEvaluateFunction: jest.fn(),
  createPETCTEvaluateFunction: jest.fn(),
  createPDFEvaluateFunction: jest.fn(),
  logToolbar: jest.fn()
}));

jest.mock('../utils/accessibilityUtils', () => ({
  createButtonAriaAttributes: jest.fn(() => ({
    'role': 'button',
    'aria-label': 'test-button',
    'data-testid': 'toolbar-button-test'
  })),
  createToolbarAriaAttributes: jest.fn(() => ({
    'role': 'toolbar',
    'aria-label': 'Enhanced Toolbar',
    'aria-orientation': 'horizontal'
  })),
  createSeparatorAriaAttributes: jest.fn(() => ({
    'role': 'separator',
    'aria-label': 'separator'
  })),
  generateAccessibleTooltip: jest.fn(() => 'Test tooltip'),
  announceToScreenReader: jest.fn(),
  DEFAULT_A11Y_CONFIG: {
    enableKeyboardNav: true,
    enableScreenReader: true,
    enableFocusManagement: true,
    enableHighContrast: true,
    announceStateChanges: true
  }
}));

// Import mocked modules
import {
  createToolbarButton,
  createStandardEvaluateFunction,
  createPETCTEvaluateFunction,
  createPDFEvaluateFunction,
  logToolbar
} from '../utils/toolbarUtils';

import {
  createButtonAriaAttributes,
  createToolbarAriaAttributes,
  createSeparatorAriaAttributes,
  generateAccessibleTooltip,
  announceToScreenReader
} from '../utils/accessibilityUtils';

describe('Enhanced Toolbar Module', () => {
  // Mock OHIF context
  const mockOHIFContext: OHIFContext = {
    services: {
      DisplaySetService: {
        getActiveDisplaySets: jest.fn(() => [
          { Modality: 'CT', SOPClassUID: '1.2.840.10008.5.1.4.1.1.2' }
        ])
      },
      ViewportGridService: {
        getActiveViewportId: jest.fn(() => 'viewport-1')
      },
      ToolbarService: {
        recordInteraction: jest.fn(),
        getToolbarState: jest.fn()
      }
    }
  };

  // Mock button evaluation results
  const mockEvaluationResult: ButtonEvaluationResult = {
    visible: true,
    disabled: false,
    active: false
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (createToolbarButton as jest.Mock).mockImplementation((config: any) => ({
      id: config.id,
      uiType: 'ohif.button',
      props: {
        ...config,
        className: 'enhanced-toolbar-button'
      }
    }));

    (createStandardEvaluateFunction as jest.Mock).mockReturnValue(
      jest.fn(() => mockEvaluationResult)
    );

    (createPETCTEvaluateFunction as jest.Mock).mockReturnValue(
      jest.fn(() => mockEvaluationResult)
    );

    (createPDFEvaluateFunction as jest.Mock).mockReturnValue(
      jest.fn(() => mockEvaluationResult)
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Module Structure and Exports', () => {
    it('should export a function that returns a toolbar module definition array', () => {
      const result = getToolbarModule();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', 'enhanced-toolbar');
    });

    it('should create a module with proper OHIF toolbar structure', () => {
      const [toolbarModule] = getToolbarModule();
      
      expect(toolbarModule).toMatchObject({
        name: 'enhanced-toolbar',
        evaluateIfEnabled: expect.any(Function),
        definition: expect.objectContaining({
          id: 'enhanced-toolbar-primary',
          uiType: 'ohif.toolbar',
          props: expect.any(Object),
          buttons: expect.any(Array)
        })
      });
    });

    it('should have evaluateIfEnabled return true', () => {
      const [toolbarModule] = getToolbarModule();
      
      expect(toolbarModule.evaluateIfEnabled()).toBe(true);
    });
  });

  describe('PRD Compliance Testing', () => {
    let toolbarDefinition: ToolbarModuleDefinition;
    let toolbarButtons: ToolbarElement[];

    beforeEach(() => {
      [toolbarDefinition] = getToolbarModule();
      toolbarButtons = toolbarDefinition.definition.buttons;
    });

    describe('FR-2.2.2: Mandatory Tools Direct Visibility', () => {
      const mandatoryTools = [
        'Layout', 'WindowLevel', 'Length', 'EllipticalROI', 
        'Annotation', 'Pan', 'Zoom', 'Reset'
      ];

      it('should include all 8 mandatory tools', () => {
        const buttonIds = toolbarButtons.map(btn => btn.id);
        
        mandatoryTools.forEach(toolId => {
          expect(buttonIds).toContain(toolId);
        });
      });

      it('should create buttons without dropdown containers', () => {
        const toolButtons = toolbarButtons.filter(btn => 
          mandatoryTools.includes(btn.id)
        );

        toolButtons.forEach(button => {
          expect(createToolbarButton).toHaveBeenCalledWith(
            expect.objectContaining({
              id: button.id,
              interactionType: expect.any(String)
            })
          );
        });
      });
    });

    describe('FR-2.2.3: Button Sizing Requirements', () => {
      it('should configure large button size for 40x40px requirement', () => {
        const props = toolbarDefinition.definition.props;
        
        expect(props).toHaveProperty('buttonSize', 'large');
      });

      it('should apply enhanced toolbar CSS class', () => {
        const props = toolbarDefinition.definition.props;
        
        expect(props.className).toContain('enhanced-toolbar');
      });
    });

    describe('FR-2.2.4: Modality-Specific Tool Visibility', () => {
      it('should include PET/CT Fusion tool with conditional evaluation', () => {
        const petctTool = toolbarButtons.find(btn => btn.id === 'PETCTFusion');
        
        expect(petctTool).toBeDefined();
        expect(createPETCTEvaluateFunction).toHaveBeenCalled();
      });

      it('should include PDF Viewer tool with conditional evaluation', () => {
        const pdfTool = toolbarButtons.find(btn => btn.id === 'ViewPDF');
        
        expect(pdfTool).toBeDefined();
        expect(createPDFEvaluateFunction).toHaveBeenCalled();
      });

      it('should place contextual tools in correct group', () => {
        const contextualTools = toolbarButtons.filter(btn => 
          ['PETCTFusion', 'ViewPDF'].includes(btn.id)
        );

        contextualTools.forEach(tool => {
          expect(createToolbarButton).toHaveBeenCalledWith(
            expect.objectContaining({
              id: tool.id,
              groupId: 'contextual-tools'
            })
          );
        });
      });
    });
  });

  describe('Accessibility Compliance Testing', () => {
    let toolbarDefinition: ToolbarModuleDefinition;

    beforeEach(() => {
      [toolbarDefinition] = getToolbarModule();
    });

    it('should create toolbar with proper ARIA attributes', () => {
      expect(createToolbarAriaAttributes).toHaveBeenCalledWith({
        label: 'Medical Imaging Tools - Enhanced Toolbar',
        orientation: 'horizontal'
      });
    });

    it('should create buttons with accessibility attributes', () => {
      // Verify that buttons are created with accessibility support
      expect(createButtonAriaAttributes).toHaveBeenCalled();
      
      // Check that all main tool buttons have ARIA attributes
      const mainTools = ['Layout', 'WindowLevel', 'Length', 'Pan'];
      
      mainTools.forEach(toolId => {
        expect(createButtonAriaAttributes).toHaveBeenCalledWith(
          expect.objectContaining({
            id: toolId,
            label: expect.any(String),
            groupId: expect.any(String)
          })
        );
      });
    });

    it('should generate accessible tooltips for all buttons', () => {
      // Verify tooltip generation for each tool group
      const expectedGroups = [
        'view-tools', 'measurement-tools', 
        'actions-tools', 'contextual-tools'
      ];

      expectedGroups.forEach(groupId => {
        expect(generateAccessibleTooltip).toHaveBeenCalledWith(
          expect.objectContaining({
            groupId
          })
        );
      });
    });

    it('should create separators with ARIA attributes', () => {
      expect(createSeparatorAriaAttributes).toHaveBeenCalledWith(
        'View and Measurement Tools'
      );
      expect(createSeparatorAriaAttributes).toHaveBeenCalledWith(
        'Measurement and Action Tools'
      );
      expect(createSeparatorAriaAttributes).toHaveBeenCalledWith(
        'Action and Contextual Tools'
      );
    });

    it('should announce toolbar availability to screen readers', () => {
      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Enhanced medical imaging toolbar loaded with accessibility support',
        'polite'
      );
    });
  });

  describe('Tool Organization and Hierarchy', () => {
    let toolbarButtons: ToolbarElement[];

    beforeEach(() => {
      const [toolbarDefinition] = getToolbarModule();
      toolbarButtons = toolbarDefinition.definition.buttons;
    });

    it('should organize tools into logical groups', () => {
      const toolGroups = {
        'view-tools': ['Layout', 'WindowLevel'],
        'measurement-tools': ['Length', 'EllipticalROI', 'Annotation'],
        'actions-tools': ['Pan', 'Zoom', 'Reset'],
        'contextual-tools': ['PETCTFusion', 'ViewPDF']
      };

      Object.entries(toolGroups).forEach(([groupId, tools]) => {
        tools.forEach(toolId => {
          expect(createToolbarButton).toHaveBeenCalledWith(
            expect.objectContaining({
              id: toolId,
              groupId
            })
          );
        });
      });
    });

    it('should include visual separators between groups', () => {
      const separatorIds = toolbarButtons
        .filter(btn => btn.id.includes('separator'))
        .map(btn => btn.id);

      expect(separatorIds).toContain('view-measurement-separator');
      expect(separatorIds).toContain('measurement-actions-separator');
      expect(separatorIds).toContain('actions-contextual-separator');
    });

    it('should maintain logical tool ordering', () => {
      const buttonIds = toolbarButtons.map(btn => btn.id);
      
      // View tools should come first
      const layoutIndex = buttonIds.indexOf('Layout');
      const windowLevelIndex = buttonIds.indexOf('WindowLevel');
      expect(layoutIndex).toBeLessThan(windowLevelIndex);
      
      // Measurement tools should follow view tools
      const lengthIndex = buttonIds.indexOf('Length');
      expect(windowLevelIndex).toBeLessThan(lengthIndex);
      
      // Actions tools should follow measurement tools
      const panIndex = buttonIds.indexOf('Pan');
      expect(lengthIndex).toBeLessThan(panIndex);
    });
  });

  describe('Service Integration Testing', () => {
    let toolbarDefinition: ToolbarModuleDefinition;

    beforeEach(() => {
      [toolbarDefinition] = getToolbarModule();
    });

    it('should configure interaction handler for ToolbarService integration', () => {
      const props = toolbarDefinition.definition.props;
      
      expect(props).toHaveProperty('onInteraction');
      expect(typeof props.onInteraction).toBe('function');
    });

    it('should configure accessibility event handlers', () => {
      const props = toolbarDefinition.definition.props;
      
      expect(props).toHaveProperty('onKeyDown');
      expect(props).toHaveProperty('onFocus');
      expect(typeof props.onKeyDown).toBe('function');
      expect(typeof props.onFocus).toBe('function');
    });

    it('should include accessibility configuration', () => {
      const props = toolbarDefinition.definition.props;
      
      expect(props).toHaveProperty('accessibilityConfig');
      expect(props.accessibilityConfig).toMatchObject({
        enableKeyboardNav: true,
        enableScreenReader: true,
        enableFocusManagement: true,
        enableHighContrast: true,
        announceStateChanges: true
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should return fallback toolbar on error', () => {
      // Mock an error in button creation
      (createToolbarButton as jest.Mock).mockImplementation(() => {
        throw new Error('Button creation failed');
      });

      const result = getToolbarModule();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'enhanced-toolbar-fallback',
        definition: expect.objectContaining({
          id: 'enhanced-toolbar-fallback',
          props: expect.objectContaining({
            role: 'toolbar',
            'aria-label': 'Medical Imaging Toolbar (Fallback Mode)'
          }),
          buttons: []
        })
      });
    });

    it('should log errors appropriately', () => {
      // Mock an error in accessibility utils
      (createButtonAriaAttributes as jest.Mock).mockImplementation(() => {
        throw new Error('ARIA creation failed');
      });

      getToolbarModule();
      
      expect(logToolbar).toHaveBeenCalledWith(
        'error',
        'Error creating accessible toolbar module',
        expect.any(Error)
      );
    });
  });

  describe('Button Interaction and State Management', () => {
    it('should create buttons with proper interaction types', () => {
      getToolbarModule();

      // Check tool interaction types
      expect(createToolbarButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'Layout',
          interactionType: 'tool'
        })
      );

      expect(createToolbarButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'Reset',
          interactionType: 'action'
        })
      );
    });

    it('should configure commands for action buttons', () => {
      getToolbarModule();

      // Layout button should have viewport grid command
      expect(createToolbarButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'Layout',
          commands: [
            {
              commandName: 'setViewportGridLayout',
              context: 'VIEWER'
            }
          ]
        })
      );

      // Reset button should have reset viewport command
      expect(createToolbarButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'Reset',
          commands: [
            {
              commandName: 'resetViewport',
              context: 'VIEWER'
            }
          ]
        })
      );
    });

    it('should include keyboard shortcuts in button configuration', () => {
      getToolbarModule();

      // Verify that buttons are created with shortcut information
      expect(createToolbarButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'WindowLevel',
          shortcut: 'W'
        })
      );

      expect(createToolbarButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'Length',
          shortcut: 'L'
        })
      );
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not create excessive button instances', () => {
      getToolbarModule();
      
             // Should create exactly the expected number of buttons
       // 8 main tools + 2 contextual tools = 10 buttons
       const buttonCreationCalls = (createToolbarButton as jest.Mock).mock.calls
         .filter((call: any) => !call[0].id.includes('separator'));
      
      expect(buttonCreationCalls).toHaveLength(10);
    });

    it('should reuse evaluation functions efficiently', () => {
      getToolbarModule();
      
      // Standard evaluation should be called for most tools
      expect(createStandardEvaluateFunction).toHaveBeenCalled();
      
      // Specialized evaluation should be called only for contextual tools
      expect(createPETCTEvaluateFunction).toHaveBeenCalledTimes(1);
      expect(createPDFEvaluateFunction).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * Integration Test Helper Functions
 */
export const ToolbarTestHelpers = {
  createMockOHIFContext: (overrides?: Partial<OHIFContext>): OHIFContext => ({
    services: {
      DisplaySetService: {
        getActiveDisplaySets: jest.fn(() => []),
        ...overrides?.services?.DisplaySetService
      },
      ViewportGridService: {
        getActiveViewportId: jest.fn(() => 'viewport-1'),
        ...overrides?.services?.ViewportGridService
      },
      ToolbarService: {
        recordInteraction: jest.fn(),
        getToolbarState: jest.fn(),
        ...overrides?.services?.ToolbarService
      }
    }
  }),

  createMockEvaluationResult: (overrides?: Partial<ButtonEvaluationResult>): ButtonEvaluationResult => ({
    visible: true,
    disabled: false,
    active: false,
    ...overrides
  }),

  getMandatoryToolIds: () => [
    'Layout', 'WindowLevel', 'Length', 'EllipticalROI',
    'Annotation', 'Pan', 'Zoom', 'Reset'
  ],

  getContextualToolIds: () => [
    'PETCTFusion', 'ViewPDF'
  ],

  validatePRDCompliance: (toolbarModule: ToolbarModuleDefinition) => {
    const buttons = toolbarModule.definition.buttons;
    const mandatoryTools = ToolbarTestHelpers.getMandatoryToolIds();
    const buttonIds = buttons.map(btn => btn.id);

    return {
      hasAllMandatoryTools: mandatoryTools.every(id => buttonIds.includes(id)),
      hasLargeButtonSize: toolbarModule.definition.props.buttonSize === 'large',
      hasAccessibilityConfig: !!toolbarModule.definition.props.accessibilityConfig,
      hasProperARIA: toolbarModule.definition.props.role === 'toolbar'
    };
  }
}; 