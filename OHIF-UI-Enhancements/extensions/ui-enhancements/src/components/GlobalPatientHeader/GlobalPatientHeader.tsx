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
 */
const GlobalPatientHeader: React.FC<GlobalPatientHeaderProps> = ({ servicesManager }) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  useEffect(() => {
    // Use OHIF's StudyService to get current patient data
    if (servicesManager?.services?.StudyService) {
      const studyService = servicesManager.services.StudyService;
      const studies = studyService.getStudies();
      
      if (studies && studies.length > 0) {
        const currentStudy = studies[0];
        setPatientData({
          PatientName: currentStudy.PatientName,
          PatientID: currentStudy.PatientID,
          PatientBirthDate: currentStudy.PatientBirthDate,
        });
      }
    }
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
      <div className="global-patient-header">
        <div className="patient-info">
          <div className="patient-name">No Patient Selected</div>
        </div>
        <div className="app-controls">
          <button 
            onClick={handlePreferences}
            className="preferences-btn"
            title="Preferences"
          >
            ⚙️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="global-patient-header">
      <div className="patient-info">
        <div className="patient-name">
          {patientData.PatientName || 'Unknown Patient'}
        </div>
        <div className="patient-demographics">
          <span>MRN: {patientData.PatientID || 'N/A'}</span>
          <span>{formatBirthDate(patientData.PatientBirthDate)}</span>
        </div>
      </div>
      
      <div className="app-controls">
        <button 
          onClick={handlePreferences}
          className="preferences-btn"
          title="User Preferences"
        >
          ⚙️
        </button>
        <button 
          onClick={() => window.close()}
          className="exit-btn"
          title="Exit Application"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default GlobalPatientHeader; 