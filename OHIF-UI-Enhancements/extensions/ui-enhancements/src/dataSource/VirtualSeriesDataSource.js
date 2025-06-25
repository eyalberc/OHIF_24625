/**
 * Virtual Series Data Source - OHIF v3 Compatible Implementation
 * 
 * Proper implementation following OHIF v3 data source patterns
 * Task 4.2: Data Source Registration Validation - Corrected Implementation
 */

import { IWebApiDataSource } from '@ohif/core';
import { virtualSeriesProfiler } from '../utils/virtualSeriesPerformance.js';

/**
 * Creates a Virtual Series enhanced DICOM Web data source
 * Following OHIF v3 data source creation patterns
 */
export function createVirtualSeriesDataSource(configuration) {
  const {
    name = 'virtual-series-dicomweb',
    wadoUriRoot,
    qidoRoot,
    wadoRoot,
    enableVirtualSeries = true,
    virtualSeriesMinInstances = 50,
    ...restConfig
  } = configuration;

  console.log('[VirtualSeries] Creating Virtual Series Data Source:', name);

  // Create base DICOM Web data source using OHIF's IWebApiDataSource
  const baseDataSource = IWebApiDataSource.create({
    name,
    wadoUriRoot,
    qidoRoot,
    wadoRoot,
    ...restConfig
  });

  // If virtual series is disabled, return the base data source
  if (!enableVirtualSeries) {
    console.log('[VirtualSeries] Virtual Series disabled, using base data source');
    return baseDataSource;
  }

  // Enhance the base data source with Virtual Series functionality
  const enhancedDataSource = {
    ...baseDataSource,
    
    /**
     * ENHANCED: mapStudies function with Virtual Series support
     */
    mapStudies: (studies) => {
      const profileTiming = virtualSeriesProfiler.startTiming('mapStudiesTime');
      
      try {
        // Call original mapStudies if it exists
        let mappedStudies = studies;
        if (baseDataSource.mapStudies) {
          mappedStudies = baseDataSource.mapStudies(studies);
        }

        // Add Virtual Series enhancement
        const enhancedStudies = mappedStudies.map(study => {
          // Early exit for studies without series
          if (!study.series || study.series.length === 0) {
            return study;
          }

          // Calculate total instance count
          let totalInstanceCount = 0;
          let hasAcquisitionTimes = false;
          
          for (const series of study.series) {
            if (series.instances) {
              totalInstanceCount += series.instances.length;
              if (!hasAcquisitionTimes && series.instances[0]?.AcquisitionTime) {
                hasAcquisitionTimes = true;
              }
            }
          }

          // Skip virtual series for small studies
          if (totalInstanceCount < virtualSeriesMinInstances) {
            console.log(`[VirtualSeries] Skipping virtual series for small study: ${totalInstanceCount} instances`);
            return study;
          }

          // Create virtual "All Images" series with lazy loading
          const virtualSeries = {
            SeriesInstanceUID: `${study.StudyInstanceUID}.all-images`,
            SeriesNumber: '999999',
            SeriesDescription: `All Images (${totalInstanceCount} total)`,
            SeriesDate: study.StudyDate,
            SeriesTime: study.StudyTime,
            Modality: 'VIRTUAL',
            isVirtualSeries: true,
            totalImageCount: totalInstanceCount,
            
            // Lazy loading properties
            _lazyLoaded: false,
            _sourceStudy: study,
            _hasAcquisitionTimes: hasAcquisitionTimes,
            instances: [],
            displaySets: [],
            
            // Lazy loading method
            loadInstances: function() {
              if (this._lazyLoaded) {
                return this.instances;
              }

              const loadTiming = virtualSeriesProfiler.startTiming('instanceProcessingTime');
              
              const allInstances = [];
              for (const series of this._sourceStudy.series) {
                if (series.instances) {
                  allInstances.push(...series.instances);
                }
              }

              // Optimized sorting
              const sortTiming = virtualSeriesProfiler.startTiming('sortingTime');
              if (this._hasAcquisitionTimes) {
                allInstances.sort((a, b) => {
                  const timeA = a.AcquisitionTime ? parseInt(a.AcquisitionTime.replace(/:/g, '')) : 0;
                  const timeB = b.AcquisitionTime ? parseInt(b.AcquisitionTime.replace(/:/g, '')) : 0;
                  return timeA - timeB;
                });
              } else {
                allInstances.sort((a, b) => (a.InstanceNumber || 0) - (b.InstanceNumber || 0));
              }
              virtualSeriesProfiler.endTiming(sortTiming, 'sortingTime');
              
              this.instances = allInstances;
              this._lazyLoaded = true;
              
              virtualSeriesProfiler.endTiming(loadTiming, 'instanceProcessingTime');
              console.log(`[VirtualSeries] Lazy loaded ${allInstances.length} instances`);
              
              return this.instances;
            }
          };

          // Performance monitoring for large studies
          if (totalInstanceCount > 500) {
            console.warn(`[VirtualSeries] Large study detected: ${totalInstanceCount} instances`);
          }

          return {
            ...study,
            series: [virtualSeries, ...study.series],
          };
        });

        virtualSeriesProfiler.endTiming(profileTiming, 'mapStudiesTime');
        return enhancedStudies;
        
      } catch (error) {
        console.error('[VirtualSeries] mapStudies error:', error);
        virtualSeriesProfiler.endTiming(profileTiming, 'mapStudiesTime');
        throw error;
      }
    },

    // Enhanced data source metadata
    _virtualSeriesConfig: {
      name,
      enableVirtualSeries,
      virtualSeriesMinInstances,
      version: '1.0.0'
    }
  };

  console.log('[VirtualSeries] Virtual Series Data Source created successfully');
  return enhancedDataSource;
}

/**
 * Factory function for creating Virtual Series data source instances
 * This is the function that gets called by OHIF's data source system
 */
export function createVirtualSeriesApi(configuration) {
  return createVirtualSeriesDataSource(configuration);
} 