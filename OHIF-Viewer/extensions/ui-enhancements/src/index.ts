import { Types } from '@ohif/core';
import { id } from './id';
import preRegistration from './init';
import getToolbarModule from './getToolbarModule';
import getCustomizationModule from './getCustomizationModule';
import getDataSourcesModule from './getDataSourcesModule';

const uiEnhancementsExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   * @see https://docs.ohif.org/development/extensions/
   */
  id,
  
  /**
   * Pre-registration hook for setting up components and configuration
   */
  preRegistration,

  /**
   * Extension modules
   */
  getToolbarModule,
  getCustomizationModule,
  getDataSourcesModule,

  /**
   * Utility module exports
   */
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'ui-enhancements',
        exports: {
          // Export utility functions here if needed
        },
      },
    ];
  },
};

export default uiEnhancementsExtension; 