/**
 * FR-4: "Scroll All" Virtual Series
 * Enhanced data source that adds virtual "All Images" series
 */
export default function getDataSourcesModule() {
  return [
    {
      name: 'enhanced-dicom-web',
      wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
      qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      
      /**
       * Enhanced mapStudies function that adds virtual "All Images" series
       */
      mapStudies: (studies) => {
        return studies.map(study => {
          // Create virtual "All Images" series
          const allImagesSeries = {
            SeriesInstanceUID: `${study.StudyInstanceUID}.all-images`,
            SeriesNumber: '999999', // Ensure it sorts to top
            SeriesDescription: 'All Images',
            SeriesDate: study.StudyDate,
            SeriesTime: study.StudyTime,
            Modality: 'VIRTUAL',
            instances: [],
            displaySets: [],
            isVirtualSeries: true,
            totalImageCount: 0,
          };

          // Collect all instances from all series
          let allInstances = [];
          let totalImages = 0;

          if (study.series && study.series.length > 0) {
            study.series.forEach(series => {
              if (series.instances) {
                allInstances = allInstances.concat(series.instances);
                totalImages += series.instances.length;
              }
            });

            // Sort instances by acquisition time or instance number
            allInstances.sort((a, b) => {
              // Try to sort by AcquisitionTime first
              if (a.AcquisitionTime && b.AcquisitionTime) {
                return a.AcquisitionTime.localeCompare(b.AcquisitionTime);
              }
              // Fall back to InstanceNumber
              return (a.InstanceNumber || 0) - (b.InstanceNumber || 0);
            });

            allImagesSeries.instances = allInstances;
            allImagesSeries.totalImageCount = totalImages;
          }

          // Add virtual series as first item
          const enhancedStudy = {
            ...study,
            series: [allImagesSeries, ...(study.series || [])],
          };

          return enhancedStudy;
        });
      },

      /**
       * Enhanced retrieve function for virtual series
       */
      retrieve: {
        series: {
          enabled: true,
          src: (query, options) => {
            // Handle virtual "All Images" series
            if (query.SeriesInstanceUID && query.SeriesInstanceUID.endsWith('.all-images')) {
              const studyUID = query.SeriesInstanceUID.replace('.all-images', '');
              
              // Retrieve all series for the study and combine them
              return new Promise((resolve, reject) => {
                // This would need to be implemented to fetch all series
                // and combine them into a single scrollable stack
                resolve([]);
              });
            }

            // Standard series retrieval for non-virtual series
            return this.standardRetrieve(query, options);
          },
        },
      },
    },
  ];
} 