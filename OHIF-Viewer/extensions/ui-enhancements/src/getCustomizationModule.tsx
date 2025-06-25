import React from 'react';
import GlobalPatientHeader from './components/GlobalPatientHeader/GlobalPatientHeader';
import StudyAwareViewport from './components/StudyAwareViewport/StudyAwareViewport';

/**
 * Customization module for UI enhancements
 * Provides custom components and overrides
 */
export default function getCustomizationModule() {
  return [
    {
      id: 'ohif.header',
      component: GlobalPatientHeader,
    },
    {
      id: 'OHIFCornerstoneViewport',
      component: StudyAwareViewport,
    },
    {
      name: 'enhanced-theme',
      target: 'theme',
      content: {
        colors: {
          primary: '#60A5FA',
          background: '#111827',
          panel: '#1F2937',
          textPrimary: '#F9FAFB',
          textSecondary: '#9CA3AF',
          border: '#374151',
          warning: '#FACC15',
          success: '#22C55E',
          error: '#F87171',
        },
      },
    },
  ];
} 