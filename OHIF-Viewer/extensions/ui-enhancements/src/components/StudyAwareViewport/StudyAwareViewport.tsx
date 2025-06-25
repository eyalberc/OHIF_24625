import React, { useState, useEffect } from 'react';

interface StudyAwareViewportProps {
  viewportData?: any;
  children?: React.ReactNode;
  servicesManager?: any;
}

/**
 * FR-3: Study Comparison Highlighting
 * Wrapper component that adds study-aware styling to viewports
 */
const StudyAwareViewport: React.FC<StudyAwareViewportProps> = ({ 
  viewportData, 
  children, 
  servicesManager 
}) => {
  const [studyType, setStudyType] = useState<'current' | 'prior' | 'default'>('default');
  const { DisplaySetService } = servicesManager.services;

  useEffect(() => {
    if (!viewportData?.StudyInstanceUID || !DisplaySetService) {
      setStudyType('default');
      return;
    }

    const allDisplaySets = DisplaySetService.getActiveDisplaySets();
    const uniqueStudyUIDs = [
      ...new Set(allDisplaySets.map(ds => ds.StudyInstanceUID)),
    ];

    if (uniqueStudyUIDs.length <= 1) {
      setStudyType('default');
      return;
    }

    // Simple logic: first study UID is 'current', others are 'prior'
    const currentStudyUID = uniqueStudyUIDs[0];
    if (viewportData.StudyInstanceUID === currentStudyUID) {
      setStudyType('current');
    } else {
      setStudyType('prior');
    }
  }, [viewportData, DisplaySetService]);

  const borderClass = studyType === 'current' ? 'viewport-current-study' : 
                      studyType === 'prior' ? 'viewport-prior-study' : '';

  return (
    <div className={`study-aware-viewport ${borderClass}`}>
      {children}
      {/* Study date overlay */}
      {viewportData?.StudyDate && (
        <div className="viewport-overlay">
          Study Date: {viewportData.StudyDate}
        </div>
      )}
    </div>
  );
};

export default StudyAwareViewport; 