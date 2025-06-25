import React, { useState, useEffect } from 'react';

interface StudyAwareViewportProps {
  viewportData?: any;
  children?: React.ReactNode;
  servicesManager?: any;
  viewportId?: string;
}

/**
 * FR-3: Study Comparison Highlighting
 * Wrapper component that adds study-aware styling to viewports
 * Updated with real current/prior study detection logic
 */
const StudyAwareViewport: React.FC<StudyAwareViewportProps> = ({ 
  viewportData, 
  children, 
  servicesManager,
  viewportId
}) => {
  const [studyType, setStudyType] = useState<'current' | 'prior' | 'default'>('default');
  const [studyDate, setStudyDate] = useState<string | null>(null);

  // Function to determine if this is current or prior study
  const determineStudyType = (studyInstanceUID: string): 'current' | 'prior' | 'default' => {
    if (!servicesManager?.services?.DicomMetadataStore || !studyInstanceUID) {
      return 'default';
    }

    const { DicomMetadataStore } = servicesManager.services;
    
    try {
      // Get all available studies
      const allStudyUIDs = DicomMetadataStore.getStudyInstanceUIDs();
      
      if (allStudyUIDs.length <= 1) {
        return 'current'; // Only one study, treat as current
      }

      // Get study dates for comparison
      const studiesWithDates = allStudyUIDs.map(uid => {
        const study = DicomMetadataStore.getStudy(uid);
        return {
          uid,
          date: study?.StudyDate || '19700101', // Fallback date
          study
        };
      }).filter(s => s.study); // Filter out invalid studies

      // Sort studies by date (newest first)
      studiesWithDates.sort((a, b) => {
        const dateA = parseInt(a.date) || 0;
        const dateB = parseInt(b.date) || 0;
        return dateB - dateA; // Descending order (newest first)
      });

      // Current study is the newest (first in sorted array)
      const currentStudyUID = studiesWithDates[0]?.uid;
      
      if (studyInstanceUID === currentStudyUID) {
        return 'current';
      } else {
        return 'prior';
      }
    } catch (error) {
      console.warn('Error determining study type:', error);
      return 'default';
    }
  };

  // Function to get study date for display
  const getStudyDate = (studyInstanceUID: string): string | null => {
    if (!servicesManager?.services?.DicomMetadataStore || !studyInstanceUID) {
      return null;
    }

    try {
      const { DicomMetadataStore } = servicesManager.services;
      const study = DicomMetadataStore.getStudy(studyInstanceUID);
      return study?.StudyDate || null;
    } catch (error) {
      console.warn('Error getting study date:', error);
      return null;
    }
  };

  // Function to format study date for display
  const formatStudyDate = (date: string | null): string => {
    if (!date || date.length !== 8) return 'Date: N/A';
    
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${month}/${day}/${year}`;
  };

  // Update study type when viewport data changes
  useEffect(() => {
    if (viewportData?.StudyInstanceUID) {
      const type = determineStudyType(viewportData.StudyInstanceUID);
      const date = getStudyDate(viewportData.StudyInstanceUID);
      setStudyType(type);
      setStudyDate(date);
    } else {
      setStudyType('default');
      setStudyDate(null);
    }
  }, [viewportData?.StudyInstanceUID, servicesManager]);

  // Subscribe to study changes for real-time updates
  useEffect(() => {
    if (!servicesManager?.services?.DicomMetadataStore) return;

    const { DicomMetadataStore } = servicesManager.services;

    const handleStudyChanges = () => {
      if (viewportData?.StudyInstanceUID) {
        const type = determineStudyType(viewportData.StudyInstanceUID);
        const date = getStudyDate(viewportData.StudyInstanceUID);
        setStudyType(type);
        setStudyDate(date);
      }
    };

    // Subscribe to study events
    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.STUDY_ADDED,
      handleStudyChanges
    );

    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.INSTANCES_ADDED,
      handleStudyChanges
    );

    // Cleanup subscriptions
    return () => {
      DicomMetadataStore.unsubscribe(
        DicomMetadataStore.EVENTS.STUDY_ADDED,
        handleStudyChanges
      );
      
      DicomMetadataStore.unsubscribe(
        DicomMetadataStore.EVENTS.INSTANCES_ADDED,
        handleStudyChanges
      );
    };
  }, [servicesManager, viewportData?.StudyInstanceUID]);

  // Get appropriate CSS classes
  const borderClass = studyType === 'current' ? 'viewport-current-study' : 
                      studyType === 'prior' ? 'viewport-prior-study' : '';

  const overlayClass = studyType === 'current' ? 'viewport-overlay-current' : 
                       studyType === 'prior' ? 'viewport-overlay-prior' : '';

  return (
    <div 
      className={`study-aware-viewport ${borderClass}`}
      role="region"
      aria-label={`${studyType} study viewport`}
    >
      {children}
      {/* Study date overlay with enhanced information */}
      {studyDate && (
        <div 
          className={`viewport-overlay ${overlayClass}`}
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: studyType === 'current' ? 'var(--color-primary)' : 'var(--color-warning)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          <div>{studyType === 'current' ? 'Current' : 'Prior'} Study</div>
          <div>{formatStudyDate(studyDate)}</div>
        </div>
      )}
    </div>
  );
};

export default StudyAwareViewport; 