import React, { useState, useEffect, useRef } from 'react';
import './TabViewer.css';
import type { Note, NoteDuration, CursorPosition, TabData, TimePosition } from './types';
import { DURATION_VISUALS, DURATION_VALUES, calculateTimePosition, getMeasureBoundaries } from './types';

interface TabViewerProps {
  tabData: TabData;
  cursorPosition: CursorPosition;
  onAddNote: (fret: number | null, duration?: NoteDuration, type?: 'note' | 'rest') => void;
  onRemoveNote: () => void;
  onMoveCursor: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onCursorClick: (timeIndex: number, stringIndex: number) => void;
  onPlayPreviewNote?: (fret: number, stringIndex: number) => void;
  selectedDuration: NoteDuration;
  onPlayFromCursor?: () => void;
  onResetCursor?: () => void;
}

// String labels (reversed order - Hi D on top)
const stringLabels = ['d', 'A', 'D']; // Display order: Hi D, A, Low D
const stringIndices = [2, 1, 0]; // Data indices: Hi D=2, A=1, Low D=0

const TabViewer: React.FC<TabViewerProps> = ({ 
  tabData, 
  cursorPosition, 
  onAddNote, 
  onRemoveNote,
  onMoveCursor,
  onCursorClick,
  onPlayPreviewNote,
  selectedDuration,
  onPlayFromCursor,
  onResetCursor
}) => {
  const [selectedNoteType, setSelectedNoteType] = useState<'note' | 'rest'>('note');
  const [currentFretInput, setCurrentFretInput] = useState<string>(''); // Track current fret being typed
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Calculate dimensions
  const baseBeatWidth = 80; // Base width for a quarter note
  const stringSpacing = 40;
  const leftMargin = 80; // More space for cursor
  const topMargin = 100; // Space for controls
  const rightMargin = 100;
  const minWidth = 800; // Minimum width for empty tab
  
  // Calculate total width based on time position durations
  const calculateTotalWidth = () => {
    let totalWidth = leftMargin + rightMargin;
    
    if (tabData.length === 0) {
      // Empty tab: allocate space for many beat positions to maintain full width
      totalWidth += 16 * baseBeatWidth; // Space for 16 quarter note positions
    } else {
      // Calculate width based on existing notes
      tabData.forEach(timePos => {
        totalWidth += DURATION_VALUES[timePos.duration] * baseBeatWidth;
      });
      
      // Always ensure we have space for at least 8 more beat positions beyond existing content
      const minExtraBeats = 8;
      totalWidth += minExtraBeats * baseBeatWidth;
    }
    
    return Math.max(minWidth, totalWidth);
  };
  
  const totalWidth = calculateTotalWidth();
  const totalHeight = topMargin + (stringLabels.length * stringSpacing) + 100;

  // Calculate X position for a time position
  const getTimeX = (timeIndex: number) => {
    if (timeIndex === 0) return leftMargin;
    
    const position = calculateTimePosition(tabData, timeIndex);
    return leftMargin + (position * baseBeatWidth);
  };

  // Calculate Y position for a string
  const getStringY = (stringIndex: number) => {
    // Convert data index to display index
    const displayIndex = stringIndices.indexOf(stringIndex);
    return topMargin + (displayIndex * stringSpacing);
  };

  // Get cursor position in pixels
  const getCursorX = () => {
    // Match note positioning: position cursor at center of time position
    if (cursorPosition.timeIndex < tabData.length) {
      // If we're at an existing time position, center the cursor within that duration
      const timePosition = tabData[cursorPosition.timeIndex];
      return getTimeX(cursorPosition.timeIndex) + DURATION_VALUES[timePosition.duration] * baseBeatWidth / 2;
    } else {
      // If we're at a new position, center within a default quarter note duration
      return getTimeX(cursorPosition.timeIndex) + DURATION_VALUES['quarter'] * baseBeatWidth / 2;
    }
  };

  const getCursorY = () => {
    return getStringY(cursorPosition.stringIndex);
  };

  // Load existing note into currentFretInput when cursor moves to it
  const loadExistingNote = () => {
    // Check if there's a note at the current cursor position
    if (cursorPosition.timeIndex < tabData.length) {
      const timePosition = tabData[cursorPosition.timeIndex];
      const existingNote = timePosition.notes.find(
        note => note.stringIndex === cursorPosition.stringIndex && note.type === 'note' && note.fret !== null
      );
      
      if (existingNote && existingNote.fret !== null) {
        // Load the existing fret value into input for editing
        setCurrentFretInput(existingNote.fret.toString());
        // Play preview sound for the existing note
        if (onPlayPreviewNote) {
          onPlayPreviewNote(existingNote.fret, cursorPosition.stringIndex);
        }
      } else {
        // No note at this position, clear input
        setCurrentFretInput('');
      }
    } else {
      // Position beyond existing data, clear input
      setCurrentFretInput('');
    }
  };

  // Load existing note when cursor position changes and input is clear
  useEffect(() => {
    if (currentFretInput === '') {
      loadExistingNote();
    }
  }, [cursorPosition]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentFretInput(''); // Clear input when moving
          onMoveCursor('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentFretInput(''); // Clear input when moving
          onMoveCursor('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCurrentFretInput(''); // Clear input when moving
          onMoveCursor('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCurrentFretInput(''); // Clear input when moving
          onMoveCursor('down');
          break;
        case 'Enter':
          e.preventDefault();
          if (e.metaKey || e.ctrlKey) {
            // Cmd+Enter / Ctrl+Enter: Reset cursor to start (no loadExistingNote call)
            if (onResetCursor) {
              onResetCursor();
            }
          } else if (selectedNoteType === 'rest') {
            onAddNote(null, selectedDuration, 'rest');
            setCurrentFretInput(''); // Clear input when moving
            onMoveCursor('down'); // Move down after placing rest
          } else if (currentFretInput) {
            // Finalize the current note and move down
            setCurrentFretInput(''); // Clear input when moving
            onMoveCursor('down');
          } else {
            // No current input, add a default note and move down
            onAddNote(0, selectedDuration, 'note');
            setCurrentFretInput(''); // Clear input when moving
            onMoveCursor('down'); // Move down after placing note
          }
          break;
        case 'Tab':
          e.preventDefault();
          setCurrentFretInput(''); // Always clear input when moving with Tab
          if (selectedNoteType === 'rest') {
            onAddNote(null, selectedDuration, 'rest');
          }
          onMoveCursor('right'); // Move right
          break;
        case ' ':
          e.preventDefault();
          // Space bar: Play from current cursor position
          if (onPlayFromCursor) {
            onPlayFromCursor();
          }
          break;
        case '0': case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          e.preventDefault();
          
          const newInput = currentFretInput + e.key;
          const potentialFret = parseInt(newInput);
          
          // Only allow up to 2 digits and frets up to 24
          if (newInput.length <= 2 && potentialFret <= 24) {
            setCurrentFretInput(newInput);
            
            // If this is the first digit, create a new note
            if (currentFretInput === '') {
              onAddNote(potentialFret, selectedDuration, 'note');
              // Play preview sound for the new note
              if (onPlayPreviewNote) {
                onPlayPreviewNote(potentialFret, cursorPosition.stringIndex);
              }
            } else {
              // Update existing note by calling onAddNote again (it will replace the note at current position)
              onAddNote(potentialFret, selectedDuration, 'note');
              // Play preview sound for the updated note
              if (onPlayPreviewNote) {
                onPlayPreviewNote(potentialFret, cursorPosition.stringIndex);
              }
            }
          }
          break;
        case 'Backspace':
          e.preventDefault();
          if (currentFretInput.length > 0) {
            const newInput = currentFretInput.slice(0, -1);
            setCurrentFretInput(newInput);
            
            if (newInput.length > 0) {
              const fret = parseInt(newInput);
              onAddNote(fret, selectedDuration, 'note');
            } else {
              // No digits left, remove the note entirely
              onRemoveNote();
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setCurrentFretInput('');
          break;
        case 'r':
          e.preventDefault();
          onAddNote(null, selectedDuration, 'rest');
          setCurrentFretInput('');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDuration, selectedNoteType, currentFretInput, onAddNote, onMoveCursor, onRemoveNote]);

  // Handle SVG click
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Determine which string was clicked
    let closestStringIndex = 2; // Default to Hi D
    let minDistance = Infinity;
    
    stringIndices.forEach(stringIndex => {
      const stringY = getStringY(stringIndex);
      const distance = Math.abs(y - stringY);
      if (distance < minDistance) {
        minDistance = distance;
        closestStringIndex = stringIndex;
      }
    });
    
    // Determine time position by finding the closest note center
    let timeIndex = 0;
    let timeMinDistance = Infinity;
    
    // Check distance to each existing time position
    for (let i = 0; i < tabData.length; i++) {
      const centerX = getTimeX(i) + DURATION_VALUES[tabData[i].duration] * baseBeatWidth / 2;
      const distance = Math.abs(x - centerX);
      
      if (distance < timeMinDistance) {
        timeMinDistance = distance;
        timeIndex = i;
      }
    }
    
    // Also check distance to the next potential position (after all existing notes)
    if (tabData.length > 0) {
      const nextPositionX = getTimeX(tabData.length);
      const nextCenterX = nextPositionX + DURATION_VALUES['quarter'] * baseBeatWidth / 2; // Assume quarter note for new position
      const distanceToNext = Math.abs(x - nextCenterX);
      
      if (distanceToNext < timeMinDistance) {
        timeIndex = tabData.length;
      }
    } else {
      // No existing data, check if click is close to the first potential position
      const firstPositionX = getTimeX(0);
      const firstCenterX = firstPositionX + DURATION_VALUES['quarter'] * baseBeatWidth / 2;
      timeIndex = 0; // Default to first position when no data exists
    }
    
    onCursorClick(timeIndex, closestStringIndex);
    
    // Clear input when clicking to new position
    setCurrentFretInput('');
    
    // Focus the SVG element so keyboard input works after mouse click
    svgRef.current.focus();
  };

  // Render note stem based on duration
  const renderNoteStem = (note: Note, x: number, y: number) => {
    const visual = DURATION_VISUALS[note.duration];
    
    if (visual.stemHeight === 0) return null; // No stem for whole notes
    
    const stemX = x - 8;
    const stemY1 = y;
    const stemY2 = y + visual.stemHeight;
    
    return (
      <g key={`stem-${x}-${y}`}>
        <line
          x1={stemX}
          y1={stemY1}
          x2={stemX}
          y2={stemY2}
          stroke="#000"
          strokeWidth="2"
        />
        
        {visual.hasFlag && Array.from({ length: visual.flagCount }, (_, i) => (
          <path
            key={`flag-${i}`}
            d={`M ${stemX} ${stemY2 - (i * 6)} Q ${stemX + 10} ${stemY2 - 4 - (i * 6)} ${stemX} ${stemY2 - 8 - (i * 6)}`}
            fill="#000"
            stroke="#000"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  };

  // Get measure boundaries for drawing measure lines
  const measureBoundaries = getMeasureBoundaries(tabData);

  return (
    <div className="tab-viewer">
      {/* Controls */}
      <div className="tab-controls">
        <div className="duration-selector">
          <label>Duration: </label>
          {(['whole', 'half', 'quarter', 'eighth', 'sixteenth'] as NoteDuration[]).map((duration) => (
            <label key={duration} style={{ marginLeft: '10px' }}>
              <input
                type="radio"
                name="duration"
                value={duration}
                checked={selectedDuration === duration}
                onChange={() => {}} // Read-only, controlled by toolbar
                disabled={true}
              />
              {duration}
            </label>
          ))}
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Duration controlled by toolbar above
          </div>
        </div>
        
        <div className="note-type-selector">
          <label>Type: </label>
          <label style={{ marginLeft: '10px' }}>
            <input
              type="radio"
              name="noteType"
              value="note"
              checked={selectedNoteType === 'note'}
              onChange={() => setSelectedNoteType('note')}
            />
            Note
          </label>
          <label style={{ marginLeft: '10px' }}>
            <input
              type="radio"
              name="noteType"
              value="rest"
              checked={selectedNoteType === 'rest'}
              onChange={() => setSelectedNoteType('rest')}
            />
            Rest
          </label>
        </div>
        
        <div className="instructions">
          <p>Click to place cursor • Arrow keys to navigate • Type digits to create/edit fret numbers • Enter to move down • Tab to move right • Backspace to edit • 'R' for rest • <strong>Space to play from cursor • Cmd+Enter to reset to start</strong></p>
        </div>
      </div>

      <svg 
        ref={svgRef}
        width={totalWidth} 
        height={totalHeight} 
        className="tab-svg"
        onClick={handleSvgClick}
        tabIndex={0}
      >
        {/* String labels */}
        {stringLabels.map((label, displayIndex) => {
          const stringIndex = stringIndices[displayIndex];
          return (
            <text
              key={`label-${stringIndex}`}
              x={leftMargin - 30}
              y={getStringY(stringIndex) + 5}
              textAnchor="middle"
              className="string-label-svg"
            >
              {label}
            </text>
          );
        })}

        {/* Horizontal string lines */}
        {stringIndices.map((stringIndex) => {
          const y = getStringY(stringIndex);
          const endX = totalWidth - rightMargin; // Always extend to full width
          
          return (
            <line
              key={`string-${stringIndex}`}
              x1={leftMargin}
              y1={y}
              x2={endX}
              y2={y}
              stroke="#333"
              strokeWidth="2"
            />
          );
        })}

        {/* Measure separators (only when we have enough beats) */}
        {measureBoundaries.map((beatPosition) => {
          const x = leftMargin + (beatPosition * baseBeatWidth);
          const topY = getStringY(2) - 10; // Hi D
          const bottomY = getStringY(0) + 10; // Low D
          
          return (
            <line
              key={`measure-${beatPosition}`}
              x1={x}
              y1={topY}
              x2={x}
              y2={bottomY}
              stroke="#666"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Notes and rests at each time position */}
        {tabData.map((timePosition, timeIndex) => {
          const centerX = getTimeX(timeIndex) + DURATION_VALUES[timePosition.duration] * baseBeatWidth / 2;
          
          return timePosition.notes.map((note, noteIndex) => {
            const x = centerX;
            const y = getStringY(note.stringIndex);
            const visual = DURATION_VISUALS[note.duration];
            
            if (note.type === 'rest') {
              // Render rest symbol
              return (
                <g key={`rest-${timeIndex}-${noteIndex}`}>
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize="16"
                    fill="#666"
                  >
                    𝄽
                  </text>
                </g>
              );
            } else {
              // Render note
              return (
                <g key={`note-${timeIndex}-${noteIndex}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={visual.isOpen ? "white" : "#000"}
                    stroke="#000"
                    strokeWidth="2"
                  />
                  
                  {renderNoteStem(note, x, y)}
                  
                  {note.fret !== null && (
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill={visual.isOpen ? "#000" : "#fff"}
                    >
                      {note.fret}
                    </text>
                  )}
                </g>
              );
            }
          });
        })}

        {/* Cursor */}
        <g className="cursor">
          <line
            x1={getCursorX()}
            y1={getCursorY() - 20}
            x2={getCursorX()}
            y2={getCursorY() + 20}
            stroke="#ff0000"
            strokeWidth="3"
          />
          <circle
            cx={getCursorX()}
            cy={getCursorY()}
            r="8"
            fill="none"
            stroke="#ff0000"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
};

export default TabViewer; 