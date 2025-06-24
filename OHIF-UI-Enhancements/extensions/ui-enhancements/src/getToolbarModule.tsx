import React from 'react';

/**
 * FR-2: Redesigned Primary Toolbar
 * Enhanced toolbar with enlarged buttons and flattened hierarchy
 */
export default function getToolbarModule() {
  return [
    {
      name: 'enhanced-toolbar',
      evaluateIfEnabled: () => true,
      definition: {
        id: 'enhanced-toolbar-primary',
        uiType: 'ohif.toolbar',
        props: {
          servicesManager: undefined,
          buttonSize: 'large', // Use large buttons (40x40px)
          className: 'enhanced-toolbar',
        },
        buttons: [
          // Flattened hierarchy - commonly used tools directly visible
          {
            id: 'Layout',
            uiType: 'ohif.button',
            props: {
              groupId: 'view-tools',
              itemId: 'Layout',
              className: 'toolbar-button-enlarged',
              interactionType: 'tool',
              commands: [
                {
                  commandName: 'setViewportGridLayout',
                  context: 'VIEWER',
                },
              ],
            },
          },
          {
            id: 'WindowLevel',
            uiType: 'ohif.button',
            props: {
              groupId: 'view-tools',
              itemId: 'WindowLevel',
              className: 'toolbar-button-enlarged',
              interactionType: 'tool',
            },
          },
          {
            id: 'Length',
            uiType: 'ohif.button',
            props: {
              groupId: 'measurement-tools',
              itemId: 'Length',
              className: 'toolbar-button-enlarged',
              interactionType: 'tool',
            },
          },
          {
            id: 'EllipticalROI',
            uiType: 'ohif.button',
            props: {
              groupId: 'measurement-tools',
              itemId: 'EllipticalROI',
              className: 'toolbar-button-enlarged',
              interactionType: 'tool',
            },
          },
          {
            id: 'Annotation',
            uiType: 'ohif.button',
            props: {
              groupId: 'measurement-tools',
              itemId: 'Annotation',
              className: 'toolbar-button-enlarged',  
              interactionType: 'tool',
            },
          },
          {
            id: 'Pan',
            uiType: 'ohif.button',
            props: {
              groupId: 'interaction-tools',
              itemId: 'Pan',
              className: 'toolbar-button-enlarged',
              interactionType: 'tool',
            },
          },
          {
            id: 'Zoom',
            uiType: 'ohif.button',
            props: {
              groupId: 'interaction-tools',
              itemId: 'Zoom',
              className: 'toolbar-button-enlarged',
              interactionType: 'tool',
            },
          },
          {
            id: 'Reset',
            uiType: 'ohif.button',
            props: {
              groupId: 'interaction-tools',
              itemId: 'Reset',
              className: 'toolbar-button-enlarged',
              interactionType: 'action',
              commands: [
                {
                  commandName: 'resetViewport',
                  context: 'VIEWER',
                },
              ],
            },
          },
          // Contextual tools - only shown when relevant
          {
            id: 'PETCTFusion',
            uiType: 'ohif.button',
            props: {
              groupId: 'contextual-tools',
              itemId: 'PETCTFusion',
              className: 'toolbar-button-enlarged',
              interactionType: 'action',
              // Only display when PET/CT study is active
              display: (context: any) => {
                const { DisplaySetService } = context.services;
                const displaySets = DisplaySetService.getActiveDisplaySets();
                return displaySets.some((ds: any) => 
                  ds.Modality === 'PT' || ds.Modality === 'CT'
                );
              },
            },
          },
          {
            id: 'ViewPDF',
            uiType: 'ohif.button',
            props: {
              groupId: 'contextual-tools',
              itemId: 'ViewPDF',
              className: 'toolbar-button-enlarged',
              interactionType: 'action',
              // Only display when PDF is available
              display: (context: any) => {
                const { DisplaySetService } = context.services;
                const displaySets = DisplaySetService.getActiveDisplaySets();
                return displaySets.some((ds: any) => 
                  ds.SOPClassUID === '1.2.840.10008.5.1.4.1.1.104.1' // PDF Storage
                );
              },
            },
          },
        ],
      },
    },
  ];
} 