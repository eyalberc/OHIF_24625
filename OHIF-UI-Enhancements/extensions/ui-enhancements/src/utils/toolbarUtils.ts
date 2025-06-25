/**
 * Enhanced Toolbar Utility Functions
 * 
 * Provides reusable utility functions for the OHIF UI Enhancements
 * enhanced toolbar system, promoting code reuse and maintainability.
 * 
 * Task 2.5: Code Organization - Utility Functions
 */

import {
  OHIFContext,
  ButtonEvaluationResult,
  ButtonEvaluateFunction,
  ModalityToolConfig,
  MODALITY_CONFIGS,
  DEFAULT_ERROR_CONFIG,
  ToolbarErrorConfig,
  ToolbarGroupId,
  ToolbarButtonDefinition,
  ToolbarDividerDefinition,
  TOOLBAR_CSS_CLASSES
} from '../types/toolbar.types';

/**
 * Creates a standardized evaluate function for modality-specific tools
 * 
 * @param modalities - Array of DICOM modality codes that should show this tool
 * @param sopClassUIDs - Optional array of SOP Class UIDs for content type detection
 * @param config - Optional configuration for error handling
 * @returns Evaluate function for use in toolbar buttons
 */
export function createModalityEvaluateFunction(
  modalities: string[],
  sopClassUIDs?: string[],
  config: ToolbarErrorConfig = DEFAULT_ERROR_CONFIG
): ButtonEvaluateFunction {
  return (context: OHIFContext): ButtonEvaluationResult => {
    try {
      const { DisplaySetService } = context.services;
      
      if (!DisplaySetService) {
        if (config.logErrors) {
          console.warn('DisplaySetService not available for modality evaluation');
        }
        return config.evaluationFallback || { visible: false, disabled: true };
      }

      const displaySets = DisplaySetService.getActiveDisplaySets?.() || [];
      
      // Check for modality matches
      const hasModalityMatch = modalities.length === 0 || displaySets.some((ds: any) => 
        modalities.includes(ds.Modality)
      );
      
      // Check for SOP Class UID matches if specified
      const hasSopClassMatch = !sopClassUIDs || displaySets.some((ds: any) =>
        sopClassUIDs.includes(ds.SOPClassUID)
      );
      
      return {
        visible: hasModalityMatch && hasSopClassMatch,
        disabled: false
      };
    } catch (error) {
      if (config.logErrors) {
        console.warn('Error in modality evaluation function:', error);
      }
      return config.evaluationFallback || { visible: false, disabled: true };
    }
  };
}

/**
 * Creates a standard evaluate function for basic tools that are always visible
 * 
 * @param config - Optional configuration for error handling
 * @returns Evaluate function that always returns visible/enabled
 */
export function createStandardEvaluateFunction(
  config: ToolbarErrorConfig = DEFAULT_ERROR_CONFIG
): ButtonEvaluateFunction {
  return (context: OHIFContext): ButtonEvaluationResult => {
    return {
      visible: true,
      disabled: false
    };
  };
}

/**
 * Creates evaluate function for PET/CT specific tools following PRD FR-2.2.4
 * 
 * @param config - Optional configuration for error handling
 * @returns Evaluate function for PET/CT tools
 */
export function createPETCTEvaluateFunction(
  config: ToolbarErrorConfig = DEFAULT_ERROR_CONFIG
): ButtonEvaluateFunction {
  const petCtConfig = MODALITY_CONFIGS.PET_CT;
  return createModalityEvaluateFunction(petCtConfig.modalities, undefined, config);
}

/**
 * Creates evaluate function for PDF viewer tools following PRD FR-2.2.4
 * 
 * @param config - Optional configuration for error handling  
 * @returns Evaluate function for PDF tools
 */
export function createPDFEvaluateFunction(
  config: ToolbarErrorConfig = DEFAULT_ERROR_CONFIG
): ButtonEvaluateFunction {
  const pdfConfig = MODALITY_CONFIGS.PDF;
  return createModalityEvaluateFunction(pdfConfig.modalities, pdfConfig.sopClassUIDs, config);
}

/**
 * Validates that a toolbar group ID is one of the supported types
 * 
 * @param groupId - Group identifier to validate
 * @returns true if the group ID is valid
 */
export function isValidToolbarGroup(groupId: string): groupId is ToolbarGroupId {
  const validGroups: ToolbarGroupId[] = [
    'view-tools',
    'measurement-tools', 
    'actions-tools',
    'contextual-tools'
  ];
  return validGroups.includes(groupId as ToolbarGroupId);
}

/**
 * Creates a toolbar button definition with standardized properties
 * 
 * @param config - Button configuration object
 * @returns Complete toolbar button definition
 */
export function createToolbarButton(config: {
  id: string;
  groupId: ToolbarGroupId;
  itemId: string;
  interactionType: 'tool' | 'action' | 'toggle';
  evaluate?: ButtonEvaluateFunction;
  commands?: Array<{
    commandName: string;
    context?: string;
    options?: Record<string, any>;
  }>;
  className?: string;
  icon?: string;
  label?: string;
  tooltip?: string;
}): ToolbarButtonDefinition {
  return {
    id: config.id,
    uiType: 'ohif.button',
    props: {
      groupId: config.groupId,
      itemId: config.itemId,
      className: `${TOOLBAR_CSS_CLASSES.BUTTON_ENLARGED} ${config.className || ''}`.trim(),
      interactionType: config.interactionType,
      evaluate: config.evaluate || createStandardEvaluateFunction(),
      commands: config.commands,
      icon: config.icon,
      label: config.label,
      tooltip: config.tooltip
    }
  };
}

/**
 * Creates a toolbar group separator/divider
 * 
 * @param id - Unique identifier for the divider
 * @param className - Optional additional CSS classes
 * @returns Toolbar divider definition
 */
export function createToolbarDivider(
  id: string,
  className?: string
): ToolbarDividerDefinition {
  return {
    id,
    uiType: 'ohif.divider',
    props: {
      className: `${TOOLBAR_CSS_CLASSES.GROUP_SEPARATOR} ${className || ''}`.trim()
    }
  };
}

/**
 * Extracts display set information for evaluation functions
 * 
 * @param context - OHIF context object
 * @returns Processed display set information
 */
export function extractDisplaySetInfo(context: OHIFContext): {
  modalities: string[];
  sopClassUIDs: string[];
  displaySets: any[];
  hasMultipleModalities: boolean;
} {
  const { DisplaySetService } = context.services;
  const displaySets = DisplaySetService?.getActiveDisplaySets?.() || [];
  
  const modalities = [...new Set(displaySets.map((ds: any) => ds.Modality).filter(Boolean) as string[])];
  const sopClassUIDs = [...new Set(displaySets.map((ds: any) => ds.SOPClassUID).filter(Boolean) as string[])];
  
  return {
    modalities,
    sopClassUIDs,
    displaySets,
    hasMultipleModalities: modalities.length > 1
  };
}

/**
 * Checks if current context supports a specific modality configuration
 * 
 * @param context - OHIF context object
 * @param config - Modality configuration to check
 * @returns true if the configuration is supported in current context
 */
export function supportsModalityConfig(
  context: OHIFContext,
  config: ModalityToolConfig
): boolean {
  const displaySetInfo = extractDisplaySetInfo(context);
  
  // Check modality support
  const modalityMatch = config.modalities.length === 0 || 
    config.modalities.some(modality => displaySetInfo.modalities.includes(modality));
  
  // Check SOP Class UID support if specified
  const sopClassMatch = !config.sopClassUIDs || 
    config.sopClassUIDs.some(uid => displaySetInfo.sopClassUIDs.includes(uid));
    
  return modalityMatch && sopClassMatch;
}

/**
 * Gets the appropriate tools for the current context based on modality
 * 
 * @param context - OHIF context object
 * @returns Array of tool IDs that should be visible for current context
 */
export function getContextualTools(context: OHIFContext): string[] {
  const tools: string[] = [];
  
  // Check each modality configuration
  Object.entries(MODALITY_CONFIGS).forEach(([configName, config]) => {
    if (supportsModalityConfig(context, config)) {
      config.tools.forEach(tool => {
        if (tool.visible) {
          tools.push(tool.id);
        }
      });
    }
  });
  
  return tools;
}

/**
 * Validates toolbar button configuration
 * 
 * @param button - Button definition to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateToolbarButton(button: ToolbarButtonDefinition): string[] {
  const errors: string[] = [];
  
  if (!button.id) {
    errors.push('Button must have an id');
  }
  
  if (!button.props) {
    errors.push('Button must have props');
    return errors; // Can't validate further without props
  }
  
  if (!button.props.groupId) {
    errors.push('Button must have a groupId');
  } else if (!isValidToolbarGroup(button.props.groupId)) {
    errors.push(`Invalid groupId: ${button.props.groupId}`);
  }
  
  if (!button.props.itemId) {
    errors.push('Button must have an itemId');
  }
  
  if (!button.props.interactionType) {
    errors.push('Button must have an interactionType');
  } else if (!['tool', 'action', 'toggle'].includes(button.props.interactionType)) {
    errors.push(`Invalid interactionType: ${button.props.interactionType}`);
  }
  
  return errors;
}

/**
 * Safely executes a button evaluation function with error handling
 * 
 * @param evaluateFunction - Function to execute
 * @param context - OHIF context to pass to function
 * @param config - Error handling configuration
 * @returns Evaluation result or fallback on error
 */
export function safeEvaluate(
  evaluateFunction: ButtonEvaluateFunction | undefined,
  context: OHIFContext,
  config: ToolbarErrorConfig = DEFAULT_ERROR_CONFIG
): ButtonEvaluationResult {
  if (typeof evaluateFunction !== 'function') {
    return config.evaluationFallback || { visible: true, disabled: false };
  }
  
  try {
    const result = evaluateFunction(context);
    return result || { visible: true, disabled: false };
  } catch (error) {
    if (config.logErrors) {
      console.warn('Error in button evaluation function:', error);
    }
    return config.evaluationFallback || { visible: true, disabled: false };
  }
}

/**
 * Creates a deep copy of a toolbar button definition
 * 
 * @param button - Button definition to clone
 * @returns Deep copy of the button definition
 */
export function cloneToolbarButton(button: ToolbarButtonDefinition): ToolbarButtonDefinition {
  return JSON.parse(JSON.stringify(button));
}

/**
 * Merges button properties with defaults
 * 
 * @param props - Button properties to merge
 * @param defaults - Default properties
 * @returns Merged properties object
 */
export function mergeButtonProps(props: any, defaults: any): any {
  return {
    ...defaults,
    ...props,
    // Special handling for arrays and objects
    commands: props.commands || defaults.commands,
    className: `${defaults.className || ''} ${props.className || ''}`.trim()
  };
}

/**
 * Formats button tooltip with contextual information
 * 
 * @param baseTooltip - Base tooltip text
 * @param context - OHIF context for additional info
 * @returns Enhanced tooltip text
 */
export function formatTooltip(baseTooltip: string, context?: OHIFContext): string {
  if (!context) {
    return baseTooltip;
  }
  
  const displaySetInfo = extractDisplaySetInfo(context);
  const modalityText = displaySetInfo.modalities.length > 0 
    ? ` (${displaySetInfo.modalities.join(', ')})`
    : '';
    
  return `${baseTooltip}${modalityText}`;
}

/**
 * Debounce function for toolbar state updates
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Log toolbar-related messages with consistent formatting
 * 
 * @param level - Log level
 * @param message - Message to log
 * @param data - Additional data to include
 */
export function logToolbar(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: any
): void {
  const prefix = '[OHIF Enhanced Toolbar]';
  const fullMessage = `${prefix} ${message}`;
  
  if (data) {
    console[level](fullMessage, data);
  } else {
    console[level](fullMessage);
  }
} 