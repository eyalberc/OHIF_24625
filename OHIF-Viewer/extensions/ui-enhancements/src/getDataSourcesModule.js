/**
 * FR-4: "Scroll All" Virtual Series
 * Enhanced data source that adds virtual "All Images" series
 */
import { DICOMwebDataSource } from '@ohif/extension-default';

const VIRTUAL_SERIES_UID_IDENTIFIER = '.all-images';

class EnhancedDicomWebDataSource extends DICOMwebDataSource {
  async mapStudies(studies) {
    const mappedStudies = await super.mapStudies(studies);

    return mappedStudies.map(study => {
      // Create virtual "All Images" series
      const allImagesSeries = {
        SeriesInstanceUID: `${study.StudyInstanceUID}${VIRTUAL_SERIES_UID_IDENTIFIER}`,
        SeriesNumber: '9999',
        SeriesDescription: 'All Images ∞',
        Modality: 'VIRTUAL',
        isVirtualSeries: true,
        instances: [],
        totalImageCount: 0,
      };

      let allInstances = [];
      let totalImages = 0;

      if (study.series && study.series.length > 0) {
        study.series.forEach(series => {
          if (series.instances) {
            allInstances = allInstances.concat(series.instances);
            totalImages += series.instances.length;
          }
        });

        allInstances.sort((a, b) => {
          if (a.AcquisitionTime && b.AcquisitionTime) {
            return a.AcquisitionTime.localeCompare(b.AcquisitionTime);
          }
          return (a.InstanceNumber || 0) - (b.InstanceNumber || 0);
        });

        allImagesSeries.instances = allInstances;
        allImagesSeries.totalImageCount = totalImages;
      }

      const enhancedStudy = {
        ...study,
        series: [allImagesSeries, ...(study.series || [])],
      };

      return enhancedStudy;
    });
  }

  retrieve = {
    series: {
      ...this.retrieve.series,
      src: (query, options) => {
        if (query.SeriesInstanceUID && query.SeriesInstanceUID.endsWith(VIRTUAL_SERIES_UID_IDENTIFIER)) {
          // This is now handled by the instances being pre-populated in mapStudies.
          // The retrieve pipeline will find them there. No special logic needed here.
          return;
        }
        return super.retrieve.series.src(query, options);
      },
    },
  };
}

export default function getDataSourcesModule() {
  return [
    {
      name: 'enhanced-dicom-web',
      type: 'web',
      create: ({ servicesManager }) => {
        return new EnhancedDicomWebDataSource({
          servicesManager,
        });
      },
    },
  ];
} 