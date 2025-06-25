import React, { useState, useEffect } from 'react';

interface PatientData {
  PatientName?: string;
  PatientID?: string;
  PatientBirthDate?: string;
}

interface GlobalPatientHeaderProps {
  servicesManager?: any;
}

/**
 * FR-1: Global Patient Header
 * Persistent header showing patient information to prevent clinical errors
 * Updated to use correct OHIF v3 DicomMetadataStore service
 */
const GlobalPatientHeader: React.FC<GlobalPatientHeaderProps> = ({ servicesManager }) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  // Function to update patient data from study
  const updatePatientDataFromStudy = (studyInstanceUID?: string) => {
    if (!servicesManager?.services?.DicomMetadataStore) return;
    
    const { DicomMetadataStore } = servicesManager.services;
    let study;
    
    if (studyInstanceUID) {
      study = DicomMetadataStore.getStudy(studyInstanceUID);
    } else {
      // Get the first available study
      const studyUIDs = DicomMetadataStore.getStudyInstanceUIDs();
      if (studyUIDs.length > 0) {
        study = DicomMetadataStore.getStudy(studyUIDs[0]);
      }
    }
    
    if (study) {
      setPatientData({
        PatientName: study.PatientName,
        PatientID: study.PatientID,
        PatientBirthDate: study.PatientBirthDate || study.StudyDate,
      });
    }
  };

  useEffect(() => {
    if (!servicesManager?.services?.DicomMetadataStore) return;
    
    const { DicomMetadataStore } = servicesManager.services;
    
    // Initial data load
    updatePatientDataFromStudy();
    
    // Subscribe to study events for real-time updates
    const handleStudyAdded = (event: any) => {
      updatePatientDataFromStudy(event.StudyInstanceUID);
    };
    
    const handleInstancesAdded = (event: any) => {
      updatePatientDataFromStudy(event.StudyInstanceUID);
    };
    
    // Subscribe to DicomMetadataStore events
    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.STUDY_ADDED,
      handleStudyAdded
    );
    
    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.INSTANCES_ADDED,
      handleInstancesAdded
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      DicomMetadataStore.unsubscribe(
        DicomMetadataStore.EVENTS.STUDY_ADDED,
        handleStudyAdded
      );
      
      DicomMetadataStore.unsubscribe(
        DicomMetadataStore.EVENTS.INSTANCES_ADDED,
        handleInstancesAdded
      );
    };
  }, [servicesManager]);

  // Format patient birth date for display
  const formatBirthDate = (date: string | undefined): string => {
    if (!date) return 'DOB: N/A';
    
    // DICOM date format is YYYYMMDD
    if (date.length === 8) {
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      return `DOB: ${month}/${day}/${year}`;
    }
    
    return `DOB: ${date}`;
  };

  // Handle preferences/settings
  const handlePreferences = () => {
    if (servicesManager?.services?.UIModalService) {
      servicesManager.services.UIModalService.show({
        content: 'UserPreferences',
        title: 'User Preferences',
      });
    }
  };

  if (!patientData) {
    return (
      <div className="global-patient-header" role="banner" aria-label="Patient Information Header">
        <div className="patient-info">
          <div className="patient-name">No Patient Selected</div>
        </div>
        <div className="app-controls">
          <button 
            onClick={handlePreferences}
            className="preferences-btn"
            title="User Preferences"
            aria-label="Open user preferences"
          >
            <span role="img" aria-hidden="true">⚙️</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="global-patient-header" role="banner" aria-label="Patient Information Header">
      <div className="patient-info">
        <div className="patient-name" style={{ fontSize: '16px', fontWeight: '600' }}>
          {patientData.PatientName || 'Unknown Patient'}
        </div>
        <div className="patient-demographics" style={{ fontSize: '14px' }}>
          <span>MRN: {patientData.PatientID || 'N/A'}</span>
          <span>{formatBirthDate(patientData.PatientBirthDate)}</span>
        </div>
      </div>
      
      <div className="app-controls">
        <button 
          onClick={handlePreferences}
          className="preferences-btn"
          title="User Preferences"
          aria-label="Open user preferences"
        >
          <span role="img" aria-hidden="true">⚙️</span>
        </button>
        <button 
          onClick={() => window.close()}
          className="exit-btn"
          title="Exit Application"
          aria-label="Exit application"
        >
          <span role="img" aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
};

export default GlobalPatientHeader; 