/**
 * Enhanced Toolbar Types and Interfaces
 * 
 * Provides comprehensive type definitions for the OHIF UI Enhancements
 * enhanced toolbar system, ensuring type safety and code organization.
 * 
 * Task 2.5: Code Organization - Type Definitions
 */

import { ServicesManager } from '@ohif/core';

/**
 * OHIF Context object passed to toolbar evaluation functions
 */
export interface OHIFContext {
  /** OHIF Services Manager instance */
  services: {
    /** Display Set Service for managing medical image display sets */
    DisplaySetService?: any;
    /** Viewport Grid Service for managing viewport layout */
    ViewportGridService?: any;
    /** Toolbar Service for toolbar state management */
    ToolbarService?: any;
    /** Commands Manager for executing application commands */
    CommandsManager?: any;
    [key: string]: any;
  };
  /** Current viewport identifier */
  viewportId?: string;
  /** Active display sets */
  displaySets?: any[];
  /** Button being evaluated */
  button?: ToolbarButtonDefinition;
  /** Additional context properties */
  [key: string]: any;
}

/**
 * Button evaluation result object
 */
export interface ButtonEvaluationResult {
  /** Whether the button should be visible */
  visible?: boolean;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Whether the button is currently active/selected */
  isActive?: boolean;
  /** Additional CSS classes to apply */
  className?: string;
  /** Tooltip text to show when disabled */
  disabledText?: string;
  /** Additional properties for button state */
  [key: string]: any;
}

/**
 * Button evaluation function signature
 */
export type ButtonEvaluateFunction = (context: OHIFContext) => ButtonEvaluationResult | undefined;

/**
 * OHIF Command definition for toolbar buttons
 */
export interface OHIFCommand {
  /** Name of the command to execute */
  commandName: string;
  /** Context in which to execute the command */
  context?: string;
  /** Additional command options */
  options?: Record<string, any>;
}

/**
 * Enhanced toolbar button properties following OHIF patterns
 */
export interface ToolbarButtonProps {
  /** Unique identifier for the button group */
  groupId: ToolbarGroupId;
  /** Unique identifier for the individual button/tool */
  itemId: string;
  /** CSS classes to apply to the button */
  className?: string;
  /** Type of interaction this button performs */
  interactionType: 'tool' | 'action' | 'toggle';
  /** Function to evaluate button state dynamically */
  evaluate?: ButtonEvaluateFunction;
  /** Commands to execute when button is activated */
  commands?: OHIFCommand[];
  /** Icon identifier for the button */
  icon?: string;
  /** Label text for the button */
  label?: string;
  /** Tooltip text for the button */
  tooltip?: string;
  /** Whether button is enabled */
  enabled?: boolean;
  /** Additional button properties */
  [key: string]: any;
}

/**
 * Toolbar button definition structure
 */
export interface ToolbarButtonDefinition {
  /** Unique button identifier */
  id: string;
  /** OHIF UI type for the button */
  uiType: 'ohif.button' | 'ohif.divider' | string;
  /** Button properties and configuration */
  props: ToolbarButtonProps;
}

/**
 * Toolbar group separators
 */
export interface ToolbarDividerDefinition {
  /** Unique divider identifier */
  id: string;
  /** OHIF UI type for dividers */
  uiType: 'ohif.divider';
  /** Divider properties */
  props: {
    /** CSS classes for styling */
    className?: string;
  };
}

/**
 * Predefined toolbar group identifiers following PRD specification
 */
export type ToolbarGroupId = 
  | 'view-tools'        // Layout, Window Level
  | 'measurement-tools' // Length, ROI, Annotation  
  | 'actions-tools'     // Pan, Zoom, Reset
  | 'contextual-tools'; // Modality-specific tools

/**
 * Toolbar element types (buttons and dividers)
 */
export type ToolbarElement = ToolbarButtonDefinition | ToolbarDividerDefinition;

/**
 * Complete toolbar module definition
 */
export interface ToolbarModuleDefinition {
  /** Module name identifier */
  name: string;
  /** Function to check if module should be enabled */
  evaluateIfEnabled: () => boolean;
  /** Module definition object */
  definition: {
    /** Unique toolbar identifier */
    id: string;
    /** OHIF UI type for toolbars */
    uiType: 'ohif.toolbar';
    /** Toolbar properties and configuration */
    props: ToolbarProps;
    /** Array of toolbar buttons and dividers */
    buttons: ToolbarElement[];
  };
}

/**
 * Toolbar properties for the main toolbar component
 */
export interface ToolbarProps {
  /** Services manager instance (injected by OHIF) */
  servicesManager?: ServicesManager;
  /** Button size preference */
  buttonSize?: 'small' | 'medium' | 'large';
  /** CSS classes for the toolbar container */
  className?: string;
  /** Interaction handler for toolbar button clicks */
  onInteraction?: (interaction: any, servicesManager?: ServicesManager) => void;
  /** Additional toolbar properties */
  [key: string]: any;
}

/**
 * Toolbar integration service configuration
 */
export interface ToolbarServiceConfig {
  /** Whether to enable automatic button registration */
  autoRegister?: boolean;
  /** Whether to enable automatic state refresh */
  autoRefresh?: boolean;
  /** Section identifier for button grouping */
  sectionId?: string;
  /** Event names to subscribe to for automatic updates */
  subscribeToEvents?: string[];
}

/**
 * Toolbar button for service integration
 */
export interface ServiceToolbarButton {
  /** Button identifier */
  id: string;
  /** Group identifier */
  groupId: ToolbarGroupId;
  /** Optional section identifier */
  sectionId?: string;
  /** Button properties */
  props: ToolbarButtonProps;
}

/**
 * Event subscription configuration
 */
export interface ServiceEventSubscription {
  /** Service instance */
  service: any;
  /** Event names to subscribe to */
  events: string[];
  /** Callback function for event handling */
  callback: () => void;
  /** Unsubscribe function */
  unsubscribe?: () => void;
}

/**
 * Modality-specific tool configuration
 */
export interface ModalityToolConfig {
  /** Supported DICOM modality codes */
  modalities: string[];
  /** SOP Class UIDs for specific content types */
  sopClassUIDs?: string[];
  /** Tool configuration for this modality */
  tools: {
    /** Tool identifier */
    id: string;
    /** Whether tool should be visible for this modality */
    visible: boolean;
    /** Whether tool should be enabled for this modality */
    enabled: boolean;
  }[];
}

/**
 * Predefined modality configurations following PRD FR-2.2.4
 */
export const MODALITY_CONFIGS: Record<string, ModalityToolConfig> = {
  PET_CT: {
    modalities: ['PT', 'CT'],
    tools: [
      { id: 'PETCTFusion', visible: true, enabled: true }
    ]
  },
  PDF: {
    modalities: [],
    sopClassUIDs: ['1.2.840.10008.5.1.4.1.1.104.1'], // PDF Storage
    tools: [
      { id: 'ViewPDF', visible: true, enabled: true }
    ]
  }
};

/**
 * Error handling configuration for toolbar operations
 */
export interface ToolbarErrorConfig {
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Whether to show user-friendly error messages */
  showUserErrors?: boolean;
  /** Fallback behavior when evaluation functions fail */
  evaluationFallback?: ButtonEvaluationResult;
}

/**
 * Default error configuration
 */
export const DEFAULT_ERROR_CONFIG: ToolbarErrorConfig = {
  logErrors: true,
  showUserErrors: false,
  evaluationFallback: {
    visible: true,
    disabled: false
  }
};

/**
 * Toolbar state interface for service integration
 */
export interface ToolbarState {
  /** Registered buttons by ID */
  buttons: Record<string, any>;
  /** Button sections/groups */
  buttonSections: Record<string, string[]>;
  /** Current active tools */
  activeTools?: string[];
  /** Disabled tools */
  disabledTools?: string[];
}

/**
 * CSS class names used throughout the toolbar system
 */
export const TOOLBAR_CSS_CLASSES = {
  /** Main toolbar container */
  TOOLBAR: 'enhanced-toolbar',
  /** Enlarged button class (40x40px) */
  BUTTON_ENLARGED: 'toolbar-button-enlarged',
  /** Group separator styling */
  GROUP_SEPARATOR: 'toolbar-group-separator',
  /** View tools group */
  VIEW_TOOLS: '[data-group-id="view-tools"]',
  /** Measurement tools group */
  MEASUREMENT_TOOLS: '[data-group-id="measurement-tools"]',
  /** Action tools group */
  ACTIONS_TOOLS: '[data-group-id="actions-tools"]',
  /** Contextual tools group */
  CONTEXTUAL_TOOLS: '[data-group-id="contextual-tools"]'
} as const;

/**
 * Type guard to check if an element is a button definition
 */
export function isToolbarButton(element: ToolbarElement): element is ToolbarButtonDefinition {
  return element.uiType === 'ohif.button';
}

/**
 * Type guard to check if an element is a divider definition
 */
export function isToolbarDivider(element: ToolbarElement): element is ToolbarDividerDefinition {
  return element.uiType === 'ohif.divider';
} 