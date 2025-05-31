import React, { useState, useEffect, useRef } from 'react';
import './TabViewer.css';
import type { Note, NoteDuration, CursorPosition, TabData, NoteType } from './types';
import { DURATION_VISUALS, DURATION_SLOTS, getSlotX, getMeasureLineX, getMeasureBoundaries, getNotesAtSlot, getAllTies } from './types';

interface TabViewerProps {
  tabData: TabData;
  cursorPosition: CursorPosition;
  onAddNote: (fret: number | null, duration?: NoteDuration, type?: 'note' | 'rest') => void;
  onRemoveNote: () => void;
  onMoveCursor: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onCursorClick: (timeSlot: number, stringIndex: number, shiftHeld?: boolean) => void;
  onPlayPreviewNote?: (fret: number, stringIndex: number) => void;
  selectedDuration: NoteDuration;
  selectedNoteType: NoteType;
  onPlayFromCursor?: () => void;
  onTogglePlayback?: () => void;
  onResetCursor?: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isPlaying?: boolean;
  currentPlaybackTimeSlot?: number;
  tieMode?: boolean;
  selectedNotes?: Array<{ timeSlot: number; stringIndex: number }>;
  onCreateTie?: () => void;
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
  selectedNoteType,
  onPlayFromCursor,
  onTogglePlayback,
  onResetCursor,
  zoom,
  onZoomChange,
  isPlaying,
  currentPlaybackTimeSlot,
  tieMode,
  selectedNotes,
  onCreateTie
}) => {
  const [currentFretInput, setCurrentFretInput] = useState<string>(''); // Track current fret being typed
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Layout constants with zoom
  const stringSpacing = 60 * zoom;
  const leftMargin = 80 * zoom;
  const rightMargin = 80 * zoom;
  const topMargin = 40 * zoom;
  const bottomMargin = 40 * zoom;
  const slotWidth = 20 * zoom; // Width of each sixteenth note slot

  // Calculate total width needed
  const minSlots = Math.max(tabData.length, cursorPosition.timeSlot + 8); // Show at least 8 slots ahead of cursor
  const totalWidth = leftMargin + (minSlots * slotWidth) + rightMargin;
  const totalHeight = (topMargin + bottomMargin + (2 * stringSpacing)) * zoom;

  // Calculate Y position for a string
  const getStringY = (stringIndex: number) => {
    // Convert data index to display index
    const displayIndex = stringIndices.indexOf(stringIndex);
    return topMargin + (displayIndex * stringSpacing);
  };

  // Get cursor position in pixels
  const getCursorX = () => {
    return getSlotX(cursorPosition.timeSlot, leftMargin, slotWidth);
  };

  const getCursorY = () => {
    return getStringY(cursorPosition.stringIndex);
  };

  // Load existing note into currentFretInput when cursor moves to it
  const loadExistingNote = () => {
    // Check if there's a note at the current cursor position
    const notesAtCursor = getNotesAtSlot(tabData, cursorPosition.timeSlot, cursorPosition.stringIndex);
    
    if (notesAtCursor.length > 0) {
      const existingNote = notesAtCursor[0];
      if (existingNote.type === 'note' && existingNote.fret !== null) {
        // Load the existing fret value into input for editing
        setCurrentFretInput(existingNote.fret.toString());
        // Play preview sound for the existing note
        if (onPlayPreviewNote) {
          onPlayPreviewNote(existingNote.fret, cursorPosition.stringIndex);
        }
      } else {
        // Rest or null fret, clear input
        setCurrentFretInput('');
      }
    } else {
      // No note at this position, clear input
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
          // Move cursor by the duration of the current note type
          const slotsToMove = DURATION_SLOTS[selectedDuration];
          for (let i = 0; i < slotsToMove; i++) {
            onMoveCursor('right');
          }
          break;
        case ' ':
          e.preventDefault();
          // Space bar: Toggle playback (play/pause)
          if (onTogglePlayback) {
            onTogglePlayback();
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
        case 't':
        case 'T':
          e.preventDefault();
          if (onCreateTie) {
            onCreateTie();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDuration, selectedNoteType, currentFretInput, onAddNote, onMoveCursor, onRemoveNote]);

  // Zoom event handlers
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        onZoomChange(Math.max(0.6, Math.min(3, zoom + delta)));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        svgRef.current?.setAttribute('data-initial-distance', distance.toString());
        svgRef.current?.setAttribute('data-initial-zoom', zoom.toString());
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const initialDistance = parseFloat(svgRef.current?.getAttribute('data-initial-distance') || '0');
        const initialZoom = parseFloat(svgRef.current?.getAttribute('data-initial-zoom') || '1');
        
        if (initialDistance > 0) {
          const scale = distance / initialDistance;
          const newZoom = Math.max(0.6, Math.min(3, initialZoom * scale));
          onZoomChange(newZoom);
        }
      }
    };

    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleWheel, { passive: false });
      svg.addEventListener('touchstart', handleTouchStart, { passive: false });
      svg.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        svg.removeEventListener('wheel', handleWheel);
        svg.removeEventListener('touchstart', handleTouchStart);
        svg.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [zoom, onZoomChange]);

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
    
    // Determine time slot by converting X position
    const relativeX = x - leftMargin - slotWidth; // Account for the padding in getSlotX
    const clickedTimeSlot = Math.max(0, Math.round(relativeX / slotWidth));
    
    // First, check if we clicked directly on an existing note (within a reasonable radius)
    let clickedOnExistingNote = false;
    let noteTimeSlot = clickedTimeSlot;
    
    for (let slot = Math.max(0, clickedTimeSlot - 1); slot <= clickedTimeSlot + 1; slot++) {
      const notesAtSlot = getNotesAtSlot(tabData, slot, closestStringIndex);
      if (notesAtSlot.length > 0) {
        const noteAtSlot = notesAtSlot[0];
        if (noteAtSlot.startSlot === slot) {
          // Check if click is close to the note position
          const noteX = getSlotX(slot, leftMargin, slotWidth);
          const distance = Math.abs(x - noteX);
          if (distance < slotWidth * 0.8) { // Within 80% of slot width
            noteTimeSlot = slot;
            clickedOnExistingNote = true;
            break;
          }
        }
      }
    }
    
    // Handle tie selection with shift-click
    if (e.shiftKey && clickedOnExistingNote) {
      // Shift-click on existing note: handle tie selection
      const noteKey = { timeSlot: noteTimeSlot, stringIndex: closestStringIndex };
      const existingIndex = selectedNotes?.findIndex(n => n.timeSlot === noteTimeSlot && n.stringIndex === closestStringIndex) ?? -1;
      
      if (existingIndex >= 0) {
        // Deselect if already selected
        if (selectedNotes) {
          const newSelection = selectedNotes.filter((_, i) => i !== existingIndex);
          onCursorClick(noteTimeSlot, closestStringIndex, true); // This will trigger handleNoteSelection with updated array
        }
      } else {
        // Select note (max 2 notes for tie)
        if (selectedNotes) {
          if (selectedNotes.length >= 2) {
            // Replace first with second, add new
            onCursorClick(noteTimeSlot, closestStringIndex, true); // This will update selection
          } else {
            onCursorClick(noteTimeSlot, closestStringIndex, true); // This will add to selection
          }
        } else {
          onCursorClick(noteTimeSlot, closestStringIndex, true); // First selection
        }
      }
      
      // Don't clear input when shift-clicking for tie selection
      // Focus the SVG element so keyboard input works after mouse click
      svgRef.current.focus();
      return;
    }
    
    // Normal click behavior (move cursor)
    if (clickedOnExistingNote) {
      onCursorClick(noteTimeSlot, closestStringIndex, false);
    } else {
      // If we didn't click on an existing note, use smart positioning
      let finalTimeSlot = clickedTimeSlot;
      
      // Look backwards from the clicked position to find the most recent note on this string
      let mostRecentNote: Note | null = null;
      let mostRecentNoteSlot = -1;
      
      for (let slot = clickedTimeSlot; slot >= 0; slot--) {
        const notesAtSlot = getNotesAtSlot(tabData, slot, closestStringIndex);
        if (notesAtSlot.length > 0) {
          const noteAtSlot = notesAtSlot[0];
          // Only consider notes that actually start at this slot
          if (noteAtSlot.startSlot === slot) {
            mostRecentNote = noteAtSlot;
            mostRecentNoteSlot = slot;
            break;
          }
        }
      }
      
      // If we found a recent note and clicked to the right of it, 
      // position cursor where the next note should go
      if (mostRecentNote && clickedTimeSlot > mostRecentNoteSlot) {
        const noteDurationSlots = DURATION_SLOTS[mostRecentNote.duration];
        finalTimeSlot = mostRecentNoteSlot + noteDurationSlots;
      }
      
      onCursorClick(finalTimeSlot, closestStringIndex, false);
    }
    
    // Clear input when clicking to new position (unless shift-clicking for ties)
    if (!e.shiftKey) {
      setCurrentFretInput('');
    }
    
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
      <div className="tab-scroll-container" style={{ overflow: 'auto', width: '100%', height: '100%', position: 'relative' }}>
        <svg 
          ref={svgRef}
          width={totalWidth} 
          height={totalHeight} 
          className="tab-svg"
          onClick={handleSvgClick}
          tabIndex={0}
          style={{ minWidth: '100%', minHeight: '300px' }}
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
            const endX = totalWidth - rightMargin;
            
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

          {/* Measure separators */}
          {measureBoundaries.map((slotPosition) => {
            const x = getMeasureLineX(slotPosition, leftMargin, slotWidth);
            const topY = getStringY(2) - 10; // Hi D
            const bottomY = getStringY(0) + 10; // Low D
            
            return (
              <line
                key={`measure-${slotPosition}`}
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

          {/* Notes and rests - iterate through all slots */}
          {tabData.map((cell, slotIndex) => {
            return cell.notes.map((note, noteIndex) => {
              const x = getSlotX(slotIndex, leftMargin, slotWidth);
              const y = getStringY(note.stringIndex);
              const visual = DURATION_VISUALS[note.duration];
              
              if (note.type === 'rest') {
                // Render rest symbol
                return (
                  <g key={`rest-${slotIndex}-${noteIndex}`}>
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
                  <g key={`note-${slotIndex}-${noteIndex}`}>
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

          {/* Ties - render curved lines between tied notes */}
          {getAllTies(tabData).map((tie, index) => {
            const fromX = getSlotX(tie.fromSlot, leftMargin, slotWidth);
            const toX = getSlotX(tie.toSlot, leftMargin, slotWidth);
            const y = getStringY(tie.stringIndex);
            
            // Create a curved path for the tie
            const midX = (fromX + toX) / 2;
            const curveHeight = 20; // Height of the tie curve
            const path = `M ${fromX} ${y} Q ${midX} ${y - curveHeight} ${toX} ${y}`;
            
            return (
              <path
                key={`tie-${index}`}
                d={path}
                stroke="#000"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
            );
          })}

          {/* Selected notes highlighting (for tie mode) */}
          {tieMode && selectedNotes && selectedNotes.map((selectedNote, index) => {
            const x = getSlotX(selectedNote.timeSlot, leftMargin, slotWidth);
            const y = getStringY(selectedNote.stringIndex);
            
            return (
              <circle
                key={`selected-${index}`}
                cx={x}
                cy={y}
                r="18"
                fill="none"
                stroke="#007acc"
                strokeWidth="3"
                strokeDasharray="4,2"
                opacity="0.8"
              />
            );
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

          {/* Playback indicator - shows current playing position */}
          {isPlaying && currentPlaybackTimeSlot !== undefined && currentPlaybackTimeSlot >= 0 && (
            <g className="playback-indicator">
              <line
                x1={getSlotX(currentPlaybackTimeSlot, leftMargin, slotWidth)}
                y1={getStringY(2) - 30} // Above the Hi D string
                x2={getSlotX(currentPlaybackTimeSlot, leftMargin, slotWidth)}
                y2={getStringY(0) + 30} // Below the Low D string
                stroke="rgba(128, 128, 128, 0.7)"
                strokeWidth="2"
                opacity="0.8"
                strokeDasharray="none"
              />
              <circle
                cx={getSlotX(currentPlaybackTimeSlot, leftMargin, slotWidth)}
                cy={getStringY(1)} // Center on A string
                r="3"
                fill="rgba(128, 128, 128, 0.7)"
                opacity="0.8"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default TabViewer; 