import React, { useState, useEffect } from 'react';

interface HangingProtocol {
  id: string;
  name: string;
  description?: string;
  modality?: string;
  bodyPart?: string;
  layout: {
    rows: number;
    columns: number;
  };
  viewports: Array<{
    seriesMatchingRules: string[];
    position: { row: number; col: number };
  }>;
}

interface HangingProtocolEditorProps {
  servicesManager?: any;
  onClose?: () => void;
}

/**
 * FR-5: User-Configurable Hanging Protocols
 * UI for creating and managing custom hanging protocols
 */
const HangingProtocolEditor: React.FC<HangingProtocolEditorProps> = ({ 
  servicesManager, 
  onClose 
}) => {
  const [protocols, setProtocols] = useState<HangingProtocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<HangingProtocol | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load existing hanging protocols
    if (servicesManager?.services?.HangingProtocolService) {
      const service = servicesManager.services.HangingProtocolService;
      const existingProtocols = service.getProtocols();
      setProtocols(existingProtocols || []);
    }
  }, [servicesManager]);

  const createNewProtocol = () => {
    const newProtocol: HangingProtocol = {
      id: `custom-${Date.now()}`,
      name: 'New Protocol',
      description: '',
      modality: '',
      bodyPart: '',
      layout: { rows: 1, columns: 2 },
      viewports: [
        { seriesMatchingRules: [], position: { row: 0, col: 0 } },
        { seriesMatchingRules: [], position: { row: 0, col: 1 } },
      ],
    };
    
    setSelectedProtocol(newProtocol);
    setIsEditing(true);
  };

  const saveProtocol = () => {
    if (!selectedProtocol) return;

    if (servicesManager?.services?.HangingProtocolService) {
      const service = servicesManager.services.HangingProtocolService;
      
      // Check if protocol exists
      const existingIndex = protocols.findIndex(p => p.id === selectedProtocol.id);
      if (existingIndex >= 0) {
        // Update existing
        const updatedProtocols = [...protocols];
        updatedProtocols[existingIndex] = selectedProtocol;
        setProtocols(updatedProtocols);
        service.updateProtocol(selectedProtocol);
      } else {
        // Add new
        const updatedProtocols = [...protocols, selectedProtocol];
        setProtocols(updatedProtocols);
        service.addProtocol(selectedProtocol);
      }
    }
    
    setIsEditing(false);
  };

  const deleteProtocol = (protocolId: string) => {
    if (confirm('Are you sure you want to delete this protocol?')) {
      const updatedProtocols = protocols.filter(p => p.id !== protocolId);
      setProtocols(updatedProtocols);
      
      if (servicesManager?.services?.HangingProtocolService) {
        servicesManager.services.HangingProtocolService.removeProtocol(protocolId);
      }
      
      if (selectedProtocol?.id === protocolId) {
        setSelectedProtocol(null);
        setIsEditing(false);
      }
    }
  };

  const updateSelectedProtocol = (updates: Partial<HangingProtocol>) => {
    if (selectedProtocol) {
      setSelectedProtocol({ ...selectedProtocol, ...updates });
    }
  };

  const renderLayoutGrid = () => {
    if (!selectedProtocol) return null;

    const { rows, columns } = selectedProtocol.layout;
    const grid = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const viewport = selectedProtocol.viewports.find(
          v => v.position.row === row && v.position.col === col
        );
        
        grid.push(
          <div 
            key={`${row}-${col}`}
            className="layout-cell"
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              border: '2px solid var(--color-border)',
              padding: '8px',
              minHeight: '60px',
              backgroundColor: viewport ? 'var(--color-panel)' : 'transparent',
            }}
          >
            {viewport && (
              <div>
                <small>Series Rules:</small>
                <ul>
                  {viewport.seriesMatchingRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div 
        className="layout-grid"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '4px',
          height: '200px',
          border: '1px solid var(--color-border)',
        }}
      >
        {grid}
      </div>
    );
  };

  return (
    <div className="hanging-protocol-editor" style={{ display: 'flex', height: '500px' }}>
      {/* Protocol List */}
      <div className="protocol-list" style={{ width: '300px', borderRight: '1px solid var(--color-border)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3>Hanging Protocols</h3>
          <button onClick={createNewProtocol}>+ New</button>
        </div>
        
        <div>
          {protocols.map(protocol => (
            <div 
              key={protocol.id}
              className={`protocol-item ${selectedProtocol?.id === protocol.id ? 'selected' : ''}`}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: selectedProtocol?.id === protocol.id ? 'var(--color-primary)' : 'transparent',
                marginBottom: '4px',
              }}
              onClick={() => setSelectedProtocol(protocol)}
            >
              <div>{protocol.name}</div>
              <small>{protocol.modality} - {protocol.bodyPart}</small>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProtocol(protocol.id);
                }}
                style={{ float: 'right' }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Editor */}
      <div className="protocol-editor" style={{ flex: 1, padding: '16px' }}>
        {selectedProtocol ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>Protocol Editor</h3>
              <div>
                <button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                {isEditing && (
                  <button onClick={saveProtocol} style={{ marginLeft: '8px' }}>
                    Save
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label>
                    Name:
                    <input
                      value={selectedProtocol.name}
                      onChange={(e) => updateSelectedProtocol({ name: e.target.value })}
                      style={{ marginLeft: '8px', padding: '4px' }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label>
                    Modality:
                    <select
                      value={selectedProtocol.modality || ''}
                      onChange={(e) => updateSelectedProtocol({ modality: e.target.value })}
                      style={{ marginLeft: '8px', padding: '4px' }}
                    >
                      <option value="">Any</option>
                      <option value="CT">CT</option>
                      <option value="MR">MR</option>
                      <option value="PT">PT</option>
                      <option value="US">US</option>
                      <option value="XA">XA</option>
                    </select>
                  </label>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label>
                    Body Part:
                    <input
                      value={selectedProtocol.bodyPart || ''}
                      onChange={(e) => updateSelectedProtocol({ bodyPart: e.target.value })}
                      placeholder="e.g., KNEE, CHEST"
                      style={{ marginLeft: '8px', padding: '4px' }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label>
                    Layout:
                    <select
                      value={`${selectedProtocol.layout.rows}x${selectedProtocol.layout.columns}`}
                      onChange={(e) => {
                        const [rows, columns] = e.target.value.split('x').map(Number);
                        updateSelectedProtocol({ 
                          layout: { rows, columns },
                          viewports: Array.from({ length: rows * columns }, (_, i) => ({
                            seriesMatchingRules: [],
                            position: { row: Math.floor(i / columns), col: i % columns },
                          })),
                        });
                      }}
                      style={{ marginLeft: '8px', padding: '4px' }}
                    >
                      <option value="1x1">1x1</option>
                      <option value="1x2">1x2</option>
                      <option value="2x1">2x1</option>
                      <option value="2x2">2x2</option>
                      <option value="2x3">2x3</option>
                      <option value="3x3">3x3</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>Name:</strong> {selectedProtocol.name}</p>
                <p><strong>Modality:</strong> {selectedProtocol.modality || 'Any'}</p>
                <p><strong>Body Part:</strong> {selectedProtocol.bodyPart || 'Any'}</p>
                <p><strong>Layout:</strong> {selectedProtocol.layout.rows}x{selectedProtocol.layout.columns}</p>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <h4>Layout Preview</h4>
              {renderLayoutGrid()}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <p>Select a protocol to edit or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HangingProtocolEditor; 