// NoteStack Architecture Demonstration Component
// This component demonstrates the new NoteStack architecture in action

import React, { useEffect, useState } from 'react';
import { useNoteStackEditor } from '../hooks/useNoteStackEditor';
import { getStrumstickPlayer } from '../services/StrumstickPlayer';
import { createSampleNoteStackTab } from '../services/ArchitectureBridge';
import type { Duration } from '../types/notestack';

const NoteStackDemo: React.FC = () => {
  const editor = useNoteStackEditor();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Initialize with sample data
  useEffect(() => {
    const sampleTab = createSampleNoteStackTab();
    editor.loadTab(sampleTab);
    console.log('🎵 Loaded sample NoteStack tab:', sampleTab);
  }, []);

  // Setup player
  useEffect(() => {
    const player = getStrumstickPlayer();
    player.setBPM(editor.state.bpm);
    player.loadTab(editor.state.tab);
    player.setPositionChangeCallback((position) => {
      editor.setCursorPosition(position);
    });
    setIsPlayerReady(true);
    
    return () => {
      player.dispose();
    };
  }, [editor.state.tab, editor.state.bpm]);

  const handlePlay = async () => {
    const player = getStrumstickPlayer();
    if (editor.state.isPlaying) {
      player.pause();
      editor.setPlaying(false);
    } else {
      await player.play();
      editor.setPlaying(true);
    }
  };

  const handleAddNote = (string: number, fret: number) => {
    const position = editor.state.currentPosition;
    editor.addNote(position, string, fret);
    console.log(`🎵 Added note: string ${string}, fret ${fret} at position ${position}`);
  };

  const handleRemoveNote = (string: number) => {
    const position = editor.state.currentPosition;
    editor.removeNote(position, string);
    console.log(`🎵 Removed note: string ${string} at position ${position}`);
  };

  const handleMoveCursor = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      editor.moveCursorLeft();
    } else {
      editor.moveCursorRight();
    }
  };

  const handleDurationChange = (duration: Duration) => {
    editor.setSelectedDuration(duration);
    console.log(`🎵 Selected duration: ${duration}`);
  };

  const durations: Duration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      <h1>🎸 NoteStack Architecture Demo</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
        <h3>Current State</h3>
        <p><strong>Stacks in Tab:</strong> {editor.state.tab.length}</p>
        <p><strong>Current Position:</strong> {editor.state.currentPosition} ticks</p>
        <p><strong>BPM:</strong> {editor.state.bpm}</p>
        <p><strong>Selected Duration:</strong> {editor.state.selectedDuration}</p>
        <p><strong>Is Playing:</strong> {editor.state.isPlaying ? 'Yes' : 'No'}</p>
        <p><strong>Total Width:</strong> {editor.totalWidth}px</p>
      </div>

      {/* Transport Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Transport</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handlePlay}
            disabled={!isPlayerReady}
            style={{ 
              padding: '10px 20px',
              backgroundColor: editor.state.isPlaying ? '#ff4444' : '#44aa44',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {editor.state.isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button 
            onClick={() => editor.setCursorPosition(0)}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⏮️ Reset
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Navigation</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleMoveCursor('left')}>⬅️ Left</button>
          <button onClick={() => handleMoveCursor('right')}>➡️ Right</button>
        </div>
      </div>

      {/* Duration Selection */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Duration Selection</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {durations.map(duration => (
            <button
              key={duration}
              onClick={() => handleDurationChange(duration)}
              style={{
                padding: '8px 12px',
                backgroundColor: editor.state.selectedDuration === duration ? '#4169e1' : '#e0e0e0',
                color: editor.state.selectedDuration === duration ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Note Input */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Add/Remove Notes at Current Position</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>String 0 (Low D):</strong>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[0, 1, 2, 3, 4, 5].map(fret => (
              <button 
                key={fret}
                onClick={() => handleAddNote(0, fret)}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {fret}
              </button>
            ))}
            <button 
              onClick={() => handleRemoveNote(0)}
              style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white' }}
            >
              Remove
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>String 1 (A):</strong>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[0, 1, 2, 3, 4, 5].map(fret => (
              <button 
                key={fret}
                onClick={() => handleAddNote(1, fret)}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {fret}
              </button>
            ))}
            <button 
              onClick={() => handleRemoveNote(1)}
              style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white' }}
            >
              Remove
            </button>
          </div>
        </div>
        
        <div>
          <strong>String 2 (Hi D):</strong>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[0, 1, 2, 3, 4, 5].map(fret => (
              <button 
                key={fret}
                onClick={() => handleAddNote(2, fret)}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {fret}
              </button>
            ))}
            <button 
              onClick={() => handleRemoveNote(2)}
              style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white' }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Visual Display */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Tab Structure (NoteStacks)</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
          {editor.state.tab.length === 0 ? (
            <p>No notes in tab</p>
          ) : (
            editor.state.tab.map((stack, index) => (
              <div 
                key={stack.id} 
                style={{ 
                  padding: '8px', 
                  marginBottom: '5px', 
                  backgroundColor: stack.musicalPosition === editor.state.currentPosition ? '#ffffcc' : '#ffffff',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <div><strong>Stack {index + 1}:</strong> {stack.id}</div>
                <div>Position: {stack.musicalPosition} ticks ({Math.floor(stack.musicalPosition / 960)} beats)</div>
                <div>Duration: {stack.duration}</div>
                <div>Notes: {stack.notes.length === 0 ? 'None' : stack.notes.map(note => `String ${note.string}, Fret ${note.fret}`).join('; ')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Layout Information */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Layout Information</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
          {editor.layoutItems.map((item, index) => (
            <div key={item.id} style={{ marginBottom: '5px' }}>
              <strong>Stack {index + 1}:</strong> Musical Position {item.musicalPosition} → Display X {Math.round(item.displayX)}px
            </div>
          ))}
        </div>
      </div>

      {/* Visual Tablature Display */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffffff', border: '2px solid #333', borderRadius: '8px' }}>
        <h3>Visual Tablature (Tab Lines)</h3>
        <div style={{ position: 'relative', height: '120px', overflowX: 'auto', backgroundColor: '#fafafa', border: '1px solid #ddd' }}>
          {/* String lines */}
          {[0, 1, 2].map(stringIndex => {
            const y = 30 + (stringIndex * 30);
            return (
              <div
                key={`string-${stringIndex}`}
                style={{
                  position: 'absolute',
                  left: '0',
                  right: '0',
                  top: `${y}px`,
                  height: '1px',
                  backgroundColor: '#333',
                  zIndex: 1
                }}
              />
            );
          })}
          
          {/* String labels */}
          {['Hi D', 'A', 'Low D'].map((label, index) => (
            <div
              key={`label-${index}`}
              style={{
                position: 'absolute',
                left: '5px',
                top: `${25 + (index * 30)}px`,
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: '#fafafa',
                padding: '0 4px',
                zIndex: 2
              }}
            >
              {label}
            </div>
          ))}
          
          {/* Cursor position indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${60 + (editor.state.currentPosition / 960) * 40}px`,
              top: '15px',
              bottom: '15px',
              width: '2px',
              backgroundColor: '#ff0000',
              zIndex: 3
            }}
          />
          
          {/* Notes on the tab */}
          {editor.layoutItems.map((stack, stackIndex) => {
            const x = 60 + (stack.musicalPosition / 960) * 40; // Simple position calculation for demo
            
            return stack.notes.map((note, noteIndex) => {
              const y = 25 + (note.string * 30); // String position
              
              return (
                <div
                  key={`${stack.id}-${noteIndex}`}
                  style={{
                    position: 'absolute',
                    left: `${x - 8}px`,
                    top: `${y - 8}px`,
                    width: '16px',
                    height: '16px',
                    backgroundColor: stack.musicalPosition === editor.state.currentPosition ? '#ff4444' : '#0066cc',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    zIndex: 4,
                    border: '1px solid #333'
                  }}
                >
                  {note.fret}
                </div>
              );
            });
          })}
          
          {/* Position markers */}
          {[0, 1, 2, 3, 4].map(beat => (
            <div
              key={`marker-${beat}`}
              style={{
                position: 'absolute',
                left: `${60 + (beat * 40)}px`,
                top: '5px',
                fontSize: '10px',
                color: '#666'
              }}
            >
              {beat}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <strong>Legend:</strong> Numbers on circles = fret numbers, Red cursor shows current position, Blue circles = notes at other positions
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h3>✅ Architecture Features Demonstrated</h3>
        <ul>
          <li>✅ NoteStack data structure with musical positioning in ticks</li>
          <li>✅ Separation of musical timing from visual layout</li>
          <li>✅ Functional operations (add/remove notes, cursor movement)</li>
          <li>✅ Tone.js integration for playback</li>
          <li>✅ Real-time state management with React hooks</li>
          <li>✅ Layout calculation for visual rendering</li>
          <li>✅ Duration-based note management</li>
        </ul>
      </div>
    </div>
  );
};

export default NoteStackDemo; 