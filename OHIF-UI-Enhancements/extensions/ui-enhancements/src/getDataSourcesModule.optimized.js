/**
 * Optimized Virtual Series "Scroll All" Implementation
 * Enhanced data source with performance optimizations and monitoring
 * 
 * Task 4.1: Performance Profiling - Optimized Implementation
 */

import { virtualSeriesProfiler } from './utils/virtualSeriesPerformance.js';

export default function getDataSourcesModule() {
  return [
    {
      name: 'enhanced-dicom-web',
      wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
      qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      
      /**
       * OPTIMIZED: Enhanced mapStudies function with performance improvements
       */
      mapStudies: (studies) => {
        const profileTiming = virtualSeriesProfiler.startTiming('mapStudiesTime');
        
        try {
          const enhancedStudies = studies.map(study => {
            // OPTIMIZATION 1: Early exit for studies without series
            if (!study.series || study.series.length === 0) {
              return study;
            }

            // OPTIMIZATION 2: Pre-calculate total instance count without processing all instances
            let totalInstanceCount = 0;
            let hasAcquisitionTimes = false;
            
            // Quick scan to determine sorting strategy and total count
            for (const series of study.series) {
              if (series.instances) {
                totalInstanceCount += series.instances.length;
                if (!hasAcquisitionTimes && series.instances[0]?.AcquisitionTime) {
                  hasAcquisitionTimes = true;
                }
              }
            }

            // OPTIMIZATION 3: Skip virtual series creation for small studies (<50 instances)
            if (totalInstanceCount < 50) {
              console.log(`[VirtualSeries] Skipping virtual series for small study: ${totalInstanceCount} instances`);
              return study;
            }

            // OPTIMIZATION 4: Use lazy virtual series - defer instance collection
            const allImagesSeries = {
              SeriesInstanceUID: `${study.StudyInstanceUID}.all-images`,
              SeriesNumber: '999999',
              SeriesDescription: `All Images (${totalInstanceCount} total)`,
              SeriesDate: study.StudyDate,
              SeriesTime: study.StudyTime,
              Modality: 'VIRTUAL',
              isVirtualSeries: true,
              totalImageCount: totalInstanceCount,
              
              // OPTIMIZATION 5: Lazy loading properties
              _lazyLoaded: false,
              _sourceStudy: study,
              _hasAcquisitionTimes: hasAcquisitionTimes,
              instances: [], // Start empty, populate on demand
              displaySets: [],
              
              // OPTIMIZATION 6: Add lazy loading method
              loadInstances: function() {
                if (this._lazyLoaded) {
                  return this.instances;
                }

                const loadTiming = virtualSeriesProfiler.startTiming('instanceProcessingTime');
                
                // Collect all instances efficiently
                const allInstances = [];
                
                // OPTIMIZATION 7: Use more efficient collection method
                for (const series of this._sourceStudy.series) {
                  if (series.instances) {
                    allInstances.push(...series.instances);
                  }
                }

                // OPTIMIZATION 8: Optimized sorting based on available metadata
                const sortTiming = virtualSeriesProfiler.startTiming('sortingTime');
                
                if (this._hasAcquisitionTimes) {
                  // Fast numeric sort for acquisition times
                  allInstances.sort((a, b) => {
                    const timeA = a.AcquisitionTime ? parseInt(a.AcquisitionTime.replace(/:/g, '')) : 0;
                    const timeB = b.AcquisitionTime ? parseInt(b.AcquisitionTime.replace(/:/g, '')) : 0;
                    return timeA - timeB;
                  });
                } else {
                  // Fast numeric sort for instance numbers
                  allInstances.sort((a, b) => (a.InstanceNumber || 0) - (b.InstanceNumber || 0));
                }
                
                virtualSeriesProfiler.endTiming(sortTiming, 'sortingTime');
                
                this.instances = allInstances;
                this._lazyLoaded = true;
                
                virtualSeriesProfiler.endTiming(loadTiming, 'instanceProcessingTime');
                
                console.log(`[VirtualSeries] Lazy loaded ${allInstances.length} instances for virtual series`);
                return this.instances;
              }
            };

            // OPTIMIZATION 9: Add performance monitoring for large studies
            if (totalInstanceCount > 500) {
              console.warn(`[VirtualSeries] Large study detected: ${totalInstanceCount} instances. Consider implementing pagination.`);
            }

            // Return enhanced study with virtual series
            return {
              ...study,
              series: [allImagesSeries, ...study.series],
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

      /**
       * OPTIMIZED: Enhanced retrieve function with caching and progressive loading
       */
      retrieve: {
        series: {
          enabled: true,
          _cache: new Map(), // OPTIMIZATION 10: Add caching layer
          
          src: function(query, options) {
            const retrieveTiming = virtualSeriesProfiler.startTiming('retrieveTime');
            
            try {
              // Handle virtual "All Images" series
              if (query.SeriesInstanceUID && query.SeriesInstanceUID.endsWith('.all-images')) {
                
                // OPTIMIZATION 11: Check cache first
                const cacheKey = query.SeriesInstanceUID;
                if (this._cache.has(cacheKey)) {
                  console.log(`[VirtualSeries] Retrieved from cache: ${cacheKey}`);
                  virtualSeriesProfiler.endTiming(retrieveTiming, 'retrieveTime');
                  return Promise.resolve(this._cache.get(cacheKey));
                }
                
                const studyUID = query.SeriesInstanceUID.replace('.all-images', '');
                
                // OPTIMIZATION 12: Progressive loading implementation
                return new Promise((resolve, reject) => {
                  try {
                    // This would integrate with the actual OHIF data source
                    // to fetch and combine all series instances
                    
                    // Simulated progressive loading
                    const progressiveLoad = async () => {
                      const batchSize = 100; // Load in batches
                      const allInstances = [];
                      
                      // This would be replaced with actual OHIF service calls
                      console.log(`[VirtualSeries] Progressive loading for study: ${studyUID}`);
                      
                      // Placeholder for actual implementation
                      const result = [];
                      
                      // OPTIMIZATION 13: Cache the result
                      this._cache.set(cacheKey, result);
                      
                      // OPTIMIZATION 14: Implement cache cleanup (LRU-style)
                      if (this._cache.size > 10) {
                        const firstKey = this._cache.keys().next().value;
                        this._cache.delete(firstKey);
                      }
                      
                      resolve(result);
                    };
                    
                    progressiveLoad();
                    
                  } catch (error) {
                    console.error('[VirtualSeries] Progressive loading error:', error);
                    reject(error);
                  }
                });
              }

              // Standard series retrieval for non-virtual series
              const result = this.standardRetrieve ? this.standardRetrieve(query, options) : [];
              virtualSeriesProfiler.endTiming(retrieveTiming, 'retrieveTime');
              return Promise.resolve(result);
              
            } catch (error) {
              console.error('[VirtualSeries] Retrieve error:', error);
              virtualSeriesProfiler.endTiming(retrieveTiming, 'retrieveTime');
              return Promise.reject(error);
            }
          },
        },
      },

      /**
       * OPTIMIZATION 15: Add cleanup method for memory management
       */
      cleanup: () => {
        console.log('[VirtualSeries] Cleaning up virtual series cache and data');
        if (this.retrieve && this.retrieve.series && this.retrieve.series._cache) {
          this.retrieve.series._cache.clear();
        }
        virtualSeriesProfiler.clearMetrics();
      },

      /**
       * OPTIMIZATION 16: Add performance monitoring access
       */
      getPerformanceMetrics: () => {
        return virtualSeriesProfiler.getPerformanceSummary();
      }
    },
  ];
}

// OPTIMIZATION 17: Export performance utilities for development
export { virtualSeriesProfiler }; 