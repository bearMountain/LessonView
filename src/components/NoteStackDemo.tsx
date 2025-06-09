// NoteStack Architecture Demonstration Component
// This component demonstrates the new NoteStack architecture in action

import React, { useEffect, useState, useCallback } from 'react';
import { useNoteStackEditor } from '../hooks/useNoteStackEditor';
import { getStrumstickPlayer } from '../services/StrumstickPlayer';
import { createSampleNoteStackTab } from '../services/ArchitectureBridge';
import type { Duration } from '../types/notestack';

const NoteStackDemo: React.FC = () => {
  const editor = useNoteStackEditor();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Function to ensure scrolling works - call this repeatedly
  const ensureScrolling = useCallback(() => {
    // Apply to body
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('max-height', 'none', 'important');
    
    // Apply to html
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.documentElement.style.setProperty('max-height', 'none', 'important');
    
    // Apply to root
    const appElement = document.getElementById('root');
    if (appElement) {
      appElement.style.setProperty('height', 'auto', 'important');
      appElement.style.setProperty('overflow', 'visible', 'important');
      appElement.style.setProperty('max-height', 'none', 'important');
    }
    
    console.log('🔄 Scroll styles reapplied');
  }, []);
  
  // Initial setup and periodic reapplication
  useEffect(() => {
    ensureScrolling();
    
    // Reapply every 100ms to combat any interference
    const interval = setInterval(ensureScrolling, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [ensureScrolling]);
  
  // Also reapply after any state changes that might affect scrolling
  useEffect(() => {
    ensureScrolling();
  }, [editor.state.currentPosition, editor.state.isPlaying, ensureScrolling]);
  
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
    // Ensure scrolling after interaction
    setTimeout(ensureScrolling, 50);
  };

  const handleAddNote = (string: number, fret: number) => {
    const position = editor.state.currentPosition;
    editor.addNote(position, string, fret);
    console.log(`🎵 Added note: string ${string}, fret ${fret} at position ${position}`);
    // Ensure scrolling after interaction
    setTimeout(ensureScrolling, 50);
  };

  const handleRemoveNote = (string: number) => {
    const position = editor.state.currentPosition;
    editor.removeNote(position, string);
    console.log(`🎵 Removed note: string ${string} at position ${position}`);
    // Ensure scrolling after interaction
    setTimeout(ensureScrolling, 50);
  };

  const handleMoveCursor = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      editor.moveCursorLeft();
    } else {
      editor.moveCursorRight();
    }
    // Ensure scrolling after interaction
    setTimeout(ensureScrolling, 50);
  };

  const handleDurationChange = (duration: Duration) => {
    editor.setSelectedDuration(duration);
    console.log(`🎵 Selected duration: ${duration}`);
    // Ensure scrolling after interaction
    setTimeout(ensureScrolling, 50);
    
    // Return focus to TabViewer to maintain keyboard input
    setTimeout(() => {
      const tabViewer = document.querySelector('.tab-viewer') as HTMLElement;
      if (tabViewer) {
        tabViewer.focus();
      }
    }, 0);
  };

  const handleScrollToBottom = () => {
    ensureScrolling();
    setTimeout(() => {
      window.scrollTo({ 
        top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const handleScrollToTop = () => {
    ensureScrolling();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const durations: Duration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];

  return (
    <div style={{ 
      padding: '20px',
      minHeight: '200vh', // Force content to be taller than viewport
      backgroundColor: '#ffffff',
      color: '#333333',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ color: '#2c3e50' }}>🎸 NoteStack Architecture Demo</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #bbdefb',
        color: '#1565c0'
      }}>
        <h3 style={{ color: '#0d47a1', marginTop: 0 }}>Current State</h3>
        <p><strong>Stacks in Tab:</strong> {editor.state.tab.length}</p>
        <p><strong>Current Position:</strong> {editor.state.currentPosition} ticks</p>
        <p><strong>BPM:</strong> {editor.state.bpm}</p>
        <p><strong>Selected Duration:</strong> {editor.state.selectedDuration}</p>
        <p><strong>Is Playing:</strong> {editor.state.isPlaying ? 'Yes' : 'No'}</p>
        <p><strong>Total Width:</strong> {editor.totalWidth}px</p>
      </div>

      {/* Transport Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Transport</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePlay}
            disabled={!isPlayerReady}
            style={{ 
              padding: '10px 20px',
              backgroundColor: editor.state.isPlaying ? '#f44336' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {editor.state.isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button 
            onClick={() => {
              editor.setCursorPosition(0);
              setTimeout(ensureScrolling, 50);
            }}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⏮️ Reset
          </button>
          
          <button 
            onClick={handleScrollToBottom}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⬇️ Scroll to Bottom
          </button>
          
          <button 
            onClick={handleScrollToTop}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⬆️ Scroll to Top
          </button>
          
          <button 
            onClick={() => {
              ensureScrolling();
              console.log('🔄 Manual scroll fix applied');
            }}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#e91e63',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔧 Fix Scrolling
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Navigation</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleMoveCursor('left')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⬅️ Left
          </button>
          <button 
            onClick={() => handleMoveCursor('right')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ➡️ Right
          </button>
        </div>
      </div>

      {/* Duration Selection */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Duration Selection</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {durations.map(duration => (
            <button
              key={duration}
              onClick={() => handleDurationChange(duration)}
              style={{
                padding: '8px 12px',
                backgroundColor: editor.state.selectedDuration === duration ? '#3f51b5' : '#e0e0e0',
                color: editor.state.selectedDuration === duration ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Note Input */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Add/Remove Notes at Current Position</h3>
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#1976d2' }}>String 0 (Low D):</strong>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[0, 1, 2, 3, 4, 5].map(fret => (
              <button 
                key={fret}
                onClick={() => handleAddNote(0, fret)}
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {fret}
              </button>
            ))}
            <button 
              onClick={() => handleRemoveNote(0)}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f44336', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#1976d2' }}>String 1 (A):</strong>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[0, 1, 2, 3, 4, 5].map(fret => (
              <button 
                key={fret}
                onClick={() => handleAddNote(1, fret)}
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {fret}
              </button>
            ))}
            <button 
              onClick={() => handleRemoveNote(1)}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f44336', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        </div>
        
        <div>
          <strong style={{ color: '#1976d2' }}>String 2 (Hi D):</strong>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[0, 1, 2, 3, 4, 5].map(fret => (
              <button 
                key={fret}
                onClick={() => handleAddNote(2, fret)}
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {fret}
              </button>
            ))}
            <button 
              onClick={() => handleRemoveNote(2)}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f44336', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Visual Tablature Display */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#ffffff', 
        border: '2px solid #2c3e50', 
        borderRadius: '8px',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Visual Tablature (Tab Lines)</h3>
        <div style={{ 
          position: 'relative', 
          height: '120px', 
          overflowX: 'auto', 
          backgroundColor: '#fafafa', 
          border: '1px solid #bbb',
          minWidth: '400px'
        }}>
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
                  height: '2px',
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
                top: `${23 + (index * 30)}px`,
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: '#fafafa',
                color: '#2c3e50',
                padding: '2px 6px',
                border: '1px solid #ccc',
                borderRadius: '3px',
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
              width: '3px',
              backgroundColor: '#f44336',
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
                    left: `${x - 10}px`,
                    top: `${y - 10}px`,
                    width: '20px',
                    height: '20px',
                    backgroundColor: stack.musicalPosition === editor.state.currentPosition ? '#f44336' : '#1976d2',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 4,
                    border: '2px solid #333'
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
                fontSize: '12px',
                color: '#2c3e50',
                fontWeight: 'bold'
              }}
            >
              {beat}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
          <strong>Legend:</strong> Numbers on circles = fret numbers, Red cursor shows current position, Blue circles = notes at other positions
        </div>
      </div>

      {/* Visual Display */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Tab Structure (NoteStacks)</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '14px', fontFamily: 'monospace' }}>
          {editor.state.tab.length === 0 ? (
            <p style={{ color: '#666' }}>No notes in tab</p>
          ) : (
            editor.state.tab.map((stack, index) => (
              <div 
                key={stack.id} 
                style={{ 
                  padding: '12px', 
                  marginBottom: '8px', 
                  backgroundColor: stack.musicalPosition === editor.state.currentPosition ? '#fff3cd' : '#ffffff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  color: '#333'
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
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#333'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Layout Information</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '14px', fontFamily: 'monospace' }}>
          {editor.layoutItems.map((item, index) => (
            <div key={item.id} style={{ marginBottom: '8px', color: '#555' }}>
              <strong>Stack {index + 1}:</strong> Musical Position {item.musicalPosition} → Display X {Math.round(item.displayX)}px
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        border: '1px solid #c8e6c9',
        color: '#2e7d32'
      }}>
        <h3 style={{ color: '#1b5e20', marginTop: 0 }}>✅ Architecture Features Demonstrated</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li>✅ NoteStack data structure with musical positioning in ticks</li>
          <li>✅ Separation of musical timing from visual layout</li>
          <li>✅ Functional operations (add/remove notes, cursor movement)</li>
          <li>✅ Tone.js integration for playback</li>
          <li>✅ Real-time state management with React hooks</li>
          <li>✅ Layout calculation for visual rendering</li>
          <li>✅ Duration-based note management</li>
        </ul>
      </div>

      {/* Scroll Test & Debug Info */}
      <div style={{ 
        marginTop: '40px', 
        padding: '30px', 
        backgroundColor: '#ff5722', 
        borderRadius: '8px',
        color: 'white',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        🎯 BOTTOM OF PAGE - If you can see this text clearly, scrolling is working! 🎯
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          Page height: {typeof window !== 'undefined' ? document.body.scrollHeight : 'unknown'}px | 
          Window height: {typeof window !== 'undefined' ? window.innerHeight : 'unknown'}px |
          Scroll position: {typeof window !== 'undefined' ? window.scrollY : 'unknown'}px
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          Body overflow: {typeof window !== 'undefined' ? getComputedStyle(document.body).overflow : 'unknown'} |
          HTML overflow: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).overflow : 'unknown'}
        </div>
      </div>
      
      {/* Extra content to ensure page is scrollable */}
      <div style={{ height: '500px', backgroundColor: '#f0f0f0', margin: '20px 0', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#2c3e50' }}>Extra Content for Scrolling Test</h3>
        <p>This is additional content to ensure the page has enough height to require scrolling.</p>
        <p>If you can scroll to see this content after interacting with the tab controls, then the scrolling fix is working!</p>
        {Array.from({length: 20}, (_, i) => (
          <p key={i} style={{ margin: '10px 0', color: '#555' }}>
            Test line {i + 1} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </div>
  );
};

export default NoteStackDemo; 