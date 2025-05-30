import React, { useState, useEffect, useRef } from 'react';
import './TabViewer.css';
import type { Note, NoteDuration, CursorPosition, TabData, TimePosition } from './types';
import { DURATION_VISUALS, DURATION_VALUES, calculateTimePosition, getMeasureBoundaries } from './types';

interface TabViewerProps {
  tabData: TabData;
  cursorPosition: CursorPosition;
  onAddNote: (fret: number | null, duration: NoteDuration, type: 'note' | 'rest') => void;
  onMoveCursor: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onCursorClick: (timeIndex: number, stringIndex: number) => void;
}

// String labels (reversed order - Hi D on top)
const stringLabels = ['d', 'A', 'D']; // Display order: Hi D, A, Low D
const stringIndices = [2, 1, 0]; // Data indices: Hi D=2, A=1, Low D=0

const TabViewer: React.FC<TabViewerProps> = ({ 
  tabData, 
  cursorPosition, 
  onAddNote, 
  onMoveCursor,
  onCursorClick 
}) => {
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [selectedNoteType, setSelectedNoteType] = useState<'note' | 'rest'>('note');
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
    if (tabData.length === 0) return minWidth;
    
    let totalWidth = leftMargin + rightMargin;
    tabData.forEach(timePos => {
      totalWidth += DURATION_VALUES[timePos.duration] * baseBeatWidth;
    });
    
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
    return getTimeX(cursorPosition.timeIndex);
  };

  const getCursorY = () => {
    return getStringY(cursorPosition.stringIndex);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onMoveCursor('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onMoveCursor('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          onMoveCursor('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onMoveCursor('down');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedNoteType === 'rest') {
            onAddNote(null, selectedDuration, 'rest');
          } else {
            // For now, add a default fret 0 - this could be enhanced with fret selection
            onAddNote(0, selectedDuration, 'note');
          }
          break;
        case '0': case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          e.preventDefault();
          const fret = parseInt(e.key);
          if (fret <= 12) {
            onAddNote(fret, selectedDuration, 'note');
          }
          break;
        case 'r':
          e.preventDefault();
          onAddNote(null, selectedDuration, 'rest');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDuration, selectedNoteType, onAddNote, onMoveCursor]);

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
    
    // Determine time position
    let timeIndex = 0;
    if (tabData.length > 0) {
      // Find closest time position
      for (let i = 0; i <= tabData.length; i++) {
        const timeX = getTimeX(i);
        if (x < timeX + baseBeatWidth / 2) {
          timeIndex = i;
          break;
        }
        timeIndex = i + 1;
      }
    }
    
    onCursorClick(timeIndex, closestStringIndex);
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
                onChange={(e) => setSelectedDuration(e.target.value as NoteDuration)}
              />
              {duration}
            </label>
          ))}
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
          <p>Click to place cursor • Arrow keys to navigate • Number keys (0-9) or Enter to add notes • 'R' for rest • Stack notes vertically!</p>
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
          const endX = tabData.length > 0 ? getTimeX(tabData.length) : totalWidth - rightMargin;
          
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