import React from 'react';

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
  // Determine if this is current or prior study based on viewport data
  const getStudyType = (): 'current' | 'prior' | 'default' => {
    if (!viewportData?.StudyInstanceUID) return 'default';
    
    // Logic to determine if this is current or prior study
    // This would need to be connected to OHIF's study management
    return 'current'; // Placeholder - would be dynamic
  };

  const studyType = getStudyType();
  const borderClass = studyType === 'current' ? 'viewport-current-study' : 
                      studyType === 'prior' ? 'viewport-prior-study' : '';

  return (
    <div className={`study-aware-viewport ${borderClass}`}>
      {children}
      {/* Study date overlay */}
      {viewportData?.StudyDate && (
        <div className={`viewport-overlay ${studyType === 'current' ? 'viewport-overlay-current' : 'viewport-overlay-prior'}`}>
          Study Date: {viewportData.StudyDate}
        </div>
      )}
    </div>
  );
};

export default StudyAwareViewport; 