/**
 * CORRECTED: Virtual Series Data Sources Module - OHIF v3 Compatible
 * 
 * Proper implementation following OHIF v3 data source registration patterns
 * Task 4.2: Data Source Registration Validation - Corrected Implementation
 */

import { createVirtualSeriesApi } from './dataSource/VirtualSeriesDataSource.js';

/**
 * Provides data source modules for the Virtual Series functionality
 * Following the standard OHIF v3 pattern: { name, type, createDataSource }
 */
function getDataSourcesModule() {
  return [
    {
      name: 'virtual-series-dicomweb',
      type: 'webApi',
      createDataSource: createVirtualSeriesApi,
    },
  ];
}

export default getDataSourcesModule; 