import React from 'react';
import GlobalPatientHeader from './components/GlobalPatientHeader/GlobalPatientHeader';

/**
 * Customization module for UI enhancements
 * Provides custom components and overrides
 */
export default function getCustomizationModule() {
  return [
    {
      name: 'global-patient-header',
      target: 'header',
      content: GlobalPatientHeader,
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