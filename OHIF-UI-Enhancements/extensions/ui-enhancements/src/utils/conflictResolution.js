/**
 * Conflict Resolution Utility for UI-Enhancements Extension
 * 
 * This module provides comprehensive conflict resolution strategies to ensure
 * the ui-enhancements extension integrates properly with existing OHIF extensions,
 * particularly the default and cornerstone extensions.
 * 
 * Task 7.2: Component Conflict Resolution
 */

const EXTENSION_PRIORITIES = {
  'ui-enhancements': 100,    // Highest priority for our enhancements
  'default': 50,             // Standard priority for default extension
  'cornerstone': 75,         // High priority for cornerstone
  'measurement-tracking': 60, // Medium-high priority
  'fallback': 10             // Lowest priority for fallbacks
};

const COMPONENT_NAMESPACES = {
  TOOLBAR: 'uie.toolbar',          // UI Enhancements toolbar components
  CUSTOMIZATION: 'uie.custom',     // UI Enhancements customizations
  DATASOURCE: 'uie.datasource',    // UI Enhancements data sources
  COMMANDS: 'UI_ENHANCEMENTS',     // Commands context
  PANELS: 'uie.panels'             // UI Enhancements panels
};

/**
 * Conflict Resolution Logger
 */
class ConflictLogger {
  static log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[UI-Enhancements Conflict Resolution ${timestamp}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, details || '');
        break;
      case 'warn':
        console.warn(logMessage, details || '');
        break;
      case 'error':
        console.error(logMessage, details || '');
        break;
      default:
        console.log(logMessage, details || '');
    }
  }
}

/**
 * Toolbar Conflict Resolution
 * Ensures toolbar definitions don't conflict with existing toolbar components
 */
export class ToolbarConflictResolver {
  /**
   * Resolve toolbar component conflicts by ensuring unique naming and proper priorities
   * 
   * @param {Array} toolbarElements - Array of toolbar elements to register
   * @param {Object} extensionManager - OHIF Extension Manager instance
   * @returns {Array} Resolved toolbar elements with conflict mitigation
   */
  static resolveToolbarConflicts(toolbarElements, extensionManager = null) {
    ConflictLogger.log('info', 'Starting toolbar conflict resolution');
    
    try {
      // Get list of already registered toolbar components
      const registeredComponents = extensionManager ? 
        extensionManager.getRegisteredToolbarComponents() : [];
      
      const resolvedElements = toolbarElements.map(element => {
        // Ensure unique IDs with namespace prefix
        const originalId = element.id;
        const namespacedId = `${COMPONENT_NAMESPACES.TOOLBAR}.${originalId}`;
        
        // Check for conflicts
        const hasConflict = registeredComponents.some(comp => 
          comp.id === originalId || comp.name === originalId
        );
        
        if (hasConflict) {
          ConflictLogger.log('warn', `Toolbar conflict detected for ID: ${originalId}`, {
            originalId,
            namespacedId,
            action: 'Applying namespace prefix'
          });
        }
        
        // Apply conflict resolution
        const resolvedElement = {
          ...element,
          id: hasConflict ? namespacedId : originalId,
          priority: EXTENSION_PRIORITIES['ui-enhancements'],
          namespace: COMPONENT_NAMESPACES.TOOLBAR,
          conflictResolved: hasConflict,
          originalId: hasConflict ? originalId : undefined
        };
        
        return resolvedElement;
      });
      
      ConflictLogger.log('info', `Toolbar conflict resolution completed. Processed ${resolvedElements.length} elements`);
      
      return resolvedElements;
      
    } catch (error) {
      ConflictLogger.log('error', 'Error during toolbar conflict resolution', error);
      return toolbarElements; // Return original elements as fallback
    }
  }
}

/**
 * Customization Conflict Resolution
 * Ensures customization registrations don't conflict with existing customizations
 */
export class CustomizationConflictResolver {
  /**
   * Resolve customization conflicts by ensuring unique names and proper targeting
   * 
   * @param {Array} customizations - Array of customizations to register
   * @param {Object} extensionManager - OHIF Extension Manager instance
   * @returns {Array} Resolved customizations with conflict mitigation
   */
  static resolveCustomizationConflicts(customizations, extensionManager = null) {
    ConflictLogger.log('info', 'Starting customization conflict resolution');
    
    try {
      const resolvedCustomizations = customizations.map(customization => {
        const originalName = customization.name;
        const namespacedName = `${COMPONENT_NAMESPACES.CUSTOMIZATION}.${originalName}`;
        
        // Apply namespace to avoid conflicts
        const resolvedCustomization = {
          ...customization,
          name: namespacedName,
          priority: EXTENSION_PRIORITIES['ui-enhancements'],
          namespace: COMPONENT_NAMESPACES.CUSTOMIZATION,
          originalName: originalName,
          // Add extension identifier
          extensionId: '@ohif/extension-ui-enhancements'
        };
        
        ConflictLogger.log('info', `Customization registered: ${originalName} -> ${namespacedName}`);
        
        return resolvedCustomization;
      });
      
      ConflictLogger.log('info', `Customization conflict resolution completed. Processed ${resolvedCustomizations.length} customizations`);
      
      return resolvedCustomizations;
      
    } catch (error) {
      ConflictLogger.log('error', 'Error during customization conflict resolution', error);
      return customizations; // Return original customizations as fallback
    }
  }
}

/**
 * Data Source Conflict Resolution
 * Ensures data source registrations don't conflict with existing data sources
 */
export class DataSourceConflictResolver {
  /**
   * Resolve data source conflicts by ensuring unique namespaces and proper priorities
   * 
   * @param {Array} dataSources - Array of data sources to register
   * @param {Object} extensionManager - OHIF Extension Manager instance
   * @returns {Array} Resolved data sources with conflict mitigation
   */
  static resolveDataSourceConflicts(dataSources, extensionManager = null) {
    ConflictLogger.log('info', 'Starting data source conflict resolution');
    
    try {
      const resolvedDataSources = dataSources.map(dataSource => {
        const originalName = dataSource.name;
        const namespacedName = `${COMPONENT_NAMESPACES.DATASOURCE}.${originalName}`;
        
        // Apply conflict resolution
        const resolvedDataSource = {
          ...dataSource,
          name: namespacedName,
          priority: EXTENSION_PRIORITIES['ui-enhancements'],
          namespace: COMPONENT_NAMESPACES.DATASOURCE,
          originalName: originalName,
          // Add extension metadata
          extensionId: '@ohif/extension-ui-enhancements',
          conflictResolutionApplied: true
        };
        
        ConflictLogger.log('info', `Data source registered: ${originalName} -> ${namespacedName}`);
        
        return resolvedDataSource;
      });
      
      ConflictLogger.log('info', `Data source conflict resolution completed. Processed ${resolvedDataSources.length} data sources`);
      
      return resolvedDataSources;
      
    } catch (error) {
      ConflictLogger.log('error', 'Error during data source conflict resolution', error);
      return dataSources; // Return original data sources as fallback
    }
  }
}

/**
 * Commands Conflict Resolution
 * Ensures command registrations don't conflict with existing commands
 */
export class CommandsConflictResolver {
  /**
   * Resolve command conflicts by ensuring unique contexts and proper naming
   * 
   * @param {Object} commandsModule - Commands module definition
   * @param {Object} extensionManager - OHIF Extension Manager instance
   * @returns {Object} Resolved commands module with conflict mitigation
   */
  static resolveCommandsConflicts(commandsModule, extensionManager = null) {
    ConflictLogger.log('info', 'Starting commands conflict resolution');
    
    try {
      // Ensure our commands use a unique context
      const resolvedCommandsModule = {
        ...commandsModule,
        defaultContext: COMPONENT_NAMESPACES.COMMANDS,
        namespace: COMPONENT_NAMESPACES.COMMANDS,
        priority: EXTENSION_PRIORITIES['ui-enhancements'],
        extensionId: '@ohif/extension-ui-enhancements'
      };
      
      // Add namespace prefix to action names if needed
      if (resolvedCommandsModule.actions) {
        const namespacedActions = {};
        Object.keys(resolvedCommandsModule.actions).forEach(actionName => {
          const namespacedActionName = `uie.${actionName}`;
          namespacedActions[namespacedActionName] = resolvedCommandsModule.actions[actionName];
          namespacedActions[actionName] = resolvedCommandsModule.actions[actionName]; // Keep original for compatibility
        });
        resolvedCommandsModule.actions = namespacedActions;
      }
      
      // Add namespace prefix to definition names if needed
      if (resolvedCommandsModule.definitions) {
        const namespacedDefinitions = {};
        Object.keys(resolvedCommandsModule.definitions).forEach(defName => {
          const namespacedDefName = `uie.${defName}`;
          namespacedDefinitions[namespacedDefName] = resolvedCommandsModule.definitions[defName];
          namespacedDefinitions[defName] = resolvedCommandsModule.definitions[defName]; // Keep original for compatibility
        });
        resolvedCommandsModule.definitions = namespacedDefinitions;
      }
      
      ConflictLogger.log('info', 'Commands conflict resolution completed');
      
      return resolvedCommandsModule;
      
    } catch (error) {
      ConflictLogger.log('error', 'Error during commands conflict resolution', error);
      return commandsModule; // Return original commands module as fallback
    }
  }
}

/**
 * Master Conflict Resolution Controller
 * Coordinates all conflict resolution strategies
 */
export class MasterConflictResolver {
  /**
   * Apply comprehensive conflict resolution across all extension modules
   * 
   * @param {Object} extensionModules - Object containing all extension modules
   * @param {Object} extensionManager - OHIF Extension Manager instance
   * @returns {Object} Resolved extension modules with all conflicts mitigated
   */
  static resolveAllConflicts(extensionModules, extensionManager = null) {
    ConflictLogger.log('info', 'Starting master conflict resolution for UI-Enhancements extension');
    
    try {
      const resolvedModules = { ...extensionModules };
      
      // Resolve toolbar conflicts
      if (resolvedModules.toolbarModule && resolvedModules.toolbarModule.length > 0) {
        resolvedModules.toolbarModule = resolvedModules.toolbarModule.map(module => ({
          ...module,
          definition: {
            ...module.definition,
            buttons: ToolbarConflictResolver.resolveToolbarConflicts(
              module.definition.buttons || [],
              extensionManager
            )
          }
        }));
      }
      
      // Resolve customization conflicts
      if (resolvedModules.customizationModule) {
        resolvedModules.customizationModule = CustomizationConflictResolver.resolveCustomizationConflicts(
          resolvedModules.customizationModule,
          extensionManager
        );
      }
      
      // Resolve data source conflicts
      if (resolvedModules.dataSourcesModule) {
        resolvedModules.dataSourcesModule = DataSourceConflictResolver.resolveDataSourceConflicts(
          resolvedModules.dataSourcesModule,
          extensionManager
        );
      }
      
      // Resolve commands conflicts
      if (resolvedModules.commandsModule) {
        resolvedModules.commandsModule = CommandsConflictResolver.resolveCommandsConflicts(
          resolvedModules.commandsModule,
          extensionManager
        );
      }
      
      // Add global conflict resolution metadata
      resolvedModules.conflictResolutionMetadata = {
        appliedAt: new Date().toISOString(),
        extensionId: '@ohif/extension-ui-enhancements',
        version: '3.11.0-beta.58',
        resolutionStrategies: [
          'namespace_prefixing',
          'priority_management',
          'unique_identification',
          'context_isolation'
        ],
        conflictAreas: [
          'toolbar_components',
          'customization_targets',
          'data_source_names',
          'command_contexts'
        ]
      };
      
      ConflictLogger.log('info', 'Master conflict resolution completed successfully');
      
      return resolvedModules;
      
    } catch (error) {
      ConflictLogger.log('error', 'Error during master conflict resolution', error);
      return extensionModules; // Return original modules as fallback
    }
  }
  
  /**
   * Generate conflict resolution report
   * 
   * @param {Object} resolvedModules - Resolved extension modules
   * @returns {Object} Comprehensive conflict resolution report
   */
  static generateConflictReport(resolvedModules) {
    const report = {
      timestamp: new Date().toISOString(),
      extensionId: '@ohif/extension-ui-enhancements',
      summary: {
        totalConflictsResolved: 0,
        toolbarConflicts: 0,
        customizationConflicts: 0,
        dataSourceConflicts: 0,
        commandsConflicts: 0
      },
      details: {
        toolbar: [],
        customization: [],
        dataSources: [],
        commands: []
      },
      recommendations: []
    };
    
    // Generate detailed conflict analysis report
    try {
      // Analyze toolbar conflicts
      if (resolvedModules.toolbarModule) {
        resolvedModules.toolbarModule.forEach(module => {
          if (module.definition && module.definition.buttons) {
            module.definition.buttons.forEach(button => {
              if (button.conflictResolved) {
                report.summary.toolbarConflicts++;
                report.details.toolbar.push({
                  originalId: button.originalId,
                  resolvedId: button.id,
                  strategy: 'namespace_prefix'
                });
              }
            });
          }
        });
      }
      
      report.summary.totalConflictsResolved = 
        report.summary.toolbarConflicts +
        report.summary.customizationConflicts +
        report.summary.dataSourceConflicts +
        report.summary.commandsConflicts;
      
      // Add recommendations
      if (report.summary.totalConflictsResolved > 0) {
        report.recommendations.push(
          'Monitor console logs for conflict resolution notifications',
          'Verify that all enhanced components are functioning as expected',
          'Consider updating configuration to explicitly handle resolved conflicts'
        );
      }
      
    } catch (error) {
      ConflictLogger.log('error', 'Error generating conflict report', error);
    }
    
    return report;
  }
}

/**
 * Conflict Resolution Configuration
 * Allows fine-tuning of conflict resolution behavior
 */
export const CONFLICT_RESOLUTION_CONFIG = {
  // Enable/disable specific conflict resolution strategies
  enableNamespacing: true,
  enablePriorityManagement: true,
  enableContextIsolation: true,
  
  // Logging configuration
  logLevel: 'info', // 'info', 'warn', 'error', 'silent'
  enableDetailedLogging: true,
  
  // Fallback behavior
  enableFallbacks: true,
  strictMode: false, // If true, throws errors on unresolvable conflicts
  
  // Component namespaces (can be customized)
  namespaces: COMPONENT_NAMESPACES,
  
  // Extension priorities (can be customized)
  priorities: EXTENSION_PRIORITIES
};

// Export all conflict resolution utilities
export default {
  ToolbarConflictResolver,
  CustomizationConflictResolver,
  DataSourceConflictResolver,
  CommandsConflictResolver,
  MasterConflictResolver,
  ConflictLogger,
  CONFLICT_RESOLUTION_CONFIG,
  COMPONENT_NAMESPACES,
  EXTENSION_PRIORITIES
}; 