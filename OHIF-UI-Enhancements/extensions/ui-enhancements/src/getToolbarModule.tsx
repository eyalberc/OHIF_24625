import React from 'react';
import {
  ToolbarModuleDefinition,
  ToolbarElement,
  TOOLBAR_CSS_CLASSES,
  ButtonEvaluateFunction
} from './types/toolbar.types';
import {
  createToolbarButton,
  createToolbarDivider,
  createStandardEvaluateFunction,
  createPETCTEvaluateFunction,
  createPDFEvaluateFunction,
  logToolbar
} from './utils/toolbarUtils';
import {
  createButtonAriaAttributes,
  createToolbarAriaAttributes,
  createSeparatorAriaAttributes,
  generateAccessibleTooltip,
  announceToScreenReader,
  DEFAULT_A11Y_CONFIG
} from './utils/accessibilityUtils';

/**
 * FR-2: Redesigned Primary Toolbar
 * Enhanced toolbar with enlarged buttons and flattened hierarchy
 * Implements PRD requirements FR-2.2.1 through FR-2.2.4
 * 
 * Task 2.4: ToolbarService Integration
 * - Dynamic tool state management
 * - Service-driven updates
 * - Proper registration and evaluation
 * 
 * Task 2.5: Code Organization - Enhanced with types and utilities
 * Task 2.8: Accessibility Compliance - WCAG 2.1 AA compliant
 */

/**
 * Enhanced interaction handler for toolbar buttons with accessibility support
 * Integrates with OHIF ToolbarService for proper state management
 * 
 * @param interaction - Button interaction object
 * @param servicesManager - OHIF Services Manager instance
 */
function handleToolbarInteraction(interaction: any, servicesManager: any): void {
  try {
    const { toolbarService } = servicesManager?.services || {};
    
    if (toolbarService && typeof toolbarService.recordInteraction === 'function') {
      toolbarService.recordInteraction(interaction);
      logToolbar('info', `Toolbar interaction recorded: ${interaction.itemId || interaction.id}`);
      
      // Announce interaction to screen readers
      const buttonName = interaction.label || interaction.itemId || interaction.id;
      announceToScreenReader(`${buttonName} activated`, 'polite');
    } else {
      logToolbar('warn', 'ToolbarService not available for interaction recording');
    }
  } catch (error) {
    logToolbar('error', 'Error handling toolbar interaction', error);
  }
}

/**
 * Creates an accessible toolbar button with comprehensive ARIA support
 * 
 * @param config - Button configuration object
 * @returns Enhanced toolbar button definition with accessibility features
 */
function createAccessibleToolbarButton(config: {
  id: string;
  groupId: 'view-tools' | 'measurement-tools' | 'actions-tools' | 'contextual-tools';
  itemId: string;
  interactionType: 'tool' | 'action' | 'toggle';
  label: string;
  description?: string;
  shortcut?: string;
  evaluate?: ButtonEvaluateFunction;
  commands?: Array<{
    commandName: string;
    context?: string;
    options?: Record<string, any>;
  }>;
}): ToolbarElement {
  // Generate accessible tooltip
  const tooltip = generateAccessibleTooltip({
    baseName: config.label,
    action: config.description,
    shortcut: config.shortcut,
    groupId: config.groupId
  });

  // Create ARIA attributes
  const ariaAttributes = createButtonAriaAttributes({
    id: config.id,
    label: config.label,
    description: config.description,
    groupId: config.groupId
  });

  return createToolbarButton({
    id: config.id,
    groupId: config.groupId,
    itemId: config.itemId,
    interactionType: config.interactionType,
    evaluate: config.evaluate,
    commands: config.commands,
    // Enhanced accessibility properties
    label: config.label,
    tooltip,
    ...ariaAttributes
  });
}

/**
 * Creates an accessible toolbar separator with ARIA support
 * 
 * @param id - Separator identifier
 * @param groupName - Name of the group being separated
 * @returns Enhanced separator definition with accessibility features
 */
function createAccessibleSeparator(id: string, groupName: string): ToolbarElement {
  const ariaAttributes = createSeparatorAriaAttributes(groupName);
  
  return {
    id,
    uiType: 'ohif.divider',
    props: {
      className: TOOLBAR_CSS_CLASSES.GROUP_SEPARATOR,
      ...ariaAttributes
    }
  };
}

/**
 * Creates the complete toolbar definition following PRD specifications with full accessibility support
 * 
 * @returns Array containing the enhanced accessible toolbar module definition
 */
export default function getToolbarModule(): ToolbarModuleDefinition[] {
  try {
    // Build toolbar elements array following PRD group organization with accessibility
    const toolbarElements: ToolbarElement[] = [
      // ===== VIEW TOOLS GROUP =====
      // FR-2.2.2: Layout - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'Layout',
        groupId: 'view-tools',
        itemId: 'Layout',
        interactionType: 'tool',
        label: 'Layout',
        description: 'Change viewport grid layout',
        shortcut: 'Alt+L',
        evaluate: createStandardEvaluateFunction(),
        commands: [
          {
            commandName: 'setViewportGridLayout',
            context: 'VIEWER'
          }
        ]
      }),

      // FR-2.2.2: Window Level - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'WindowLevel',
        groupId: 'view-tools',
        itemId: 'WindowLevel',
        interactionType: 'tool',
        label: 'Window/Level',
        description: 'Adjust image brightness and contrast',
        shortcut: 'W',
        evaluate: createStandardEvaluateFunction()
      }),

      // Group Separator: View | Measurement
      createAccessibleSeparator('view-measurement-separator', 'View and Measurement Tools'),

      // ===== MEASUREMENT TOOLS GROUP =====
      // FR-2.2.2: Length - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'Length',
        groupId: 'measurement-tools',
        itemId: 'Length',
        interactionType: 'tool',
        label: 'Length',
        description: 'Measure linear distances',
        shortcut: 'L',
        evaluate: createStandardEvaluateFunction()
      }),

      // FR-2.2.2: ROI (Ellipse) - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'EllipticalROI',
        groupId: 'measurement-tools',
        itemId: 'EllipticalROI',
        interactionType: 'tool',
        label: 'Elliptical ROI',
        description: 'Draw elliptical region of interest',
        shortcut: 'E',
        evaluate: createStandardEvaluateFunction()
      }),

      // FR-2.2.2: Annotation - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'Annotation',
        groupId: 'measurement-tools',
        itemId: 'Annotation',
        interactionType: 'tool',
        label: 'Annotation',
        description: 'Add text annotations',
        shortcut: 'A',
        evaluate: createStandardEvaluateFunction()
      }),

      // Group Separator: Measurement | Actions
      createAccessibleSeparator('measurement-actions-separator', 'Measurement and Action Tools'),

      // ===== ACTIONS TOOLS GROUP =====
      // FR-2.2.2: Pan - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'Pan',
        groupId: 'actions-tools',
        itemId: 'Pan',
        interactionType: 'tool',
        label: 'Pan',
        description: 'Pan and move the image',
        shortcut: 'P',
        evaluate: createStandardEvaluateFunction()
      }),

      // FR-2.2.2: Zoom - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'Zoom',
        groupId: 'actions-tools',
        itemId: 'Zoom',
        interactionType: 'tool',
        label: 'Zoom',
        description: 'Zoom in and out of the image',
        shortcut: 'Z',
        evaluate: createStandardEvaluateFunction()
      }),

      // FR-2.2.2: Reset View - MUST be directly visible
      createAccessibleToolbarButton({
        id: 'Reset',
        groupId: 'actions-tools',
        itemId: 'Reset',
        interactionType: 'action',
        label: 'Reset View',
        description: 'Reset image to original view',
        shortcut: 'R',
        evaluate: createStandardEvaluateFunction(),
        commands: [
          {
            commandName: 'resetViewport',
            context: 'VIEWER'
          }
        ]
      }),

      // Group Separator: Actions | Contextual
      createAccessibleSeparator('actions-contextual-separator', 'Action and Contextual Tools'),

      // ===== CONTEXTUAL TOOLS GROUP =====
      // FR-2.2.4: Modality-specific tools - conditionally displayed

      // PET/CT Fusion - only shown when PET/CT study is active
      createAccessibleToolbarButton({
        id: 'PETCTFusion',
        groupId: 'contextual-tools',
        itemId: 'PETCTFusion',
        interactionType: 'action',
        label: 'PET/CT Fusion',
        description: 'Fuse PET and CT images for hybrid viewing',
        shortcut: 'F',
        evaluate: createPETCTEvaluateFunction()
      }),

      // View PDF - only shown when PDF documents are available
      createAccessibleToolbarButton({
        id: 'ViewPDF',
        groupId: 'contextual-tools',
        itemId: 'ViewPDF',
        interactionType: 'action',
        label: 'View PDF',
        description: 'Open PDF documents associated with this study',
        shortcut: 'Ctrl+P',
        evaluate: createPDFEvaluateFunction()
      })
    ];

    // Create accessible toolbar ARIA attributes
    const toolbarAriaAttributes = createToolbarAriaAttributes({
      label: 'Medical Imaging Tools - Enhanced Toolbar',
      orientation: 'horizontal'
    });

    // Create the complete accessible toolbar module definition
    const toolbarModule: ToolbarModuleDefinition = {
      name: 'enhanced-toolbar',
      evaluateIfEnabled: () => true,
      definition: {
        id: 'enhanced-toolbar-primary',
        uiType: 'ohif.toolbar',
        props: {
          servicesManager: undefined, // Will be injected by OHIF
          buttonSize: 'large', // FR-2.2.3: Use large buttons (40x40px)
          className: TOOLBAR_CSS_CLASSES.TOOLBAR,
          onInteraction: handleToolbarInteraction,
          // Accessibility configuration
          accessibilityConfig: DEFAULT_A11Y_CONFIG,
          // ARIA attributes for the toolbar container
          ...toolbarAriaAttributes,
          // Keyboard navigation setup
          onKeyDown: (event: KeyboardEvent) => {
            // Keyboard navigation will be handled by the toolbar component
            logToolbar('info', `Keyboard event: ${event.key}`);
          },
          // Focus management
          onFocus: () => {
            announceToScreenReader('Enhanced toolbar focused. Use arrow keys to navigate, Enter or Space to activate tools.', 'polite');
          }
        },
        buttons: toolbarElements
      }
    };

    logToolbar('info', `Enhanced accessible toolbar module created with ${toolbarElements.length} elements`);
    
    // Announce toolbar availability to screen readers
    announceToScreenReader('Enhanced medical imaging toolbar loaded with accessibility support', 'polite');
    
    return [toolbarModule];

  } catch (error) {
    logToolbar('error', 'Error creating accessible toolbar module', error);
    
    // Return minimal fallback toolbar with basic accessibility
    return [{
      name: 'enhanced-toolbar-fallback',
      evaluateIfEnabled: () => true,
      definition: {
        id: 'enhanced-toolbar-fallback',
        uiType: 'ohif.toolbar',
        props: {
          servicesManager: undefined,
          buttonSize: 'large',
          className: 'enhanced-toolbar-fallback',
          role: 'toolbar',
          'aria-label': 'Medical Imaging Toolbar (Fallback Mode)'
        },
        buttons: []
      }
    }];
  }
} 