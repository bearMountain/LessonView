import React, { useRef, useMemo } from 'react';
import './TabViewer.css';
import type { Note, NoteDuration, CursorPosition, TabData, NoteType, ToolMode, CustomMeasureLine } from './types';
import { DURATION_VISUALS, getSlotX, getMeasureLineX, getNotesAtSlot, getAllTies, getVisualNoteX, getVisualSlotX } from './types';

// Import our hooks for clean functionality
import { useTabEditor, useNoteInput, useNavigation, usePlayback } from './hooks';

interface TabViewerProps {
  tabData: TabData;
  currentPosition: CursorPosition;
  onAddNote: (fret: number | null, duration?: NoteDuration, type?: 'note' | 'rest') => void;
  onRemoveNote: () => void;
  onMoveCursor: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onCursorClick: (timeSlot: number, stringIndex: number, shiftHeld?: boolean, clickedOnMeasureLine?: boolean) => void;
  onPlayPreviewNote?: (fret: number, stringIndex: number) => void;
  selectedDuration: NoteDuration;
  selectedNoteType: NoteType;
  currentToolMode: ToolMode;
  customMeasureLines: CustomMeasureLine[];
  onTogglePlayback?: () => void;
  onResetCursor?: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isPlaying?: boolean;
  currentPlaybackTimeSlot?: number;
  selectedNotes?: Array<{ timeSlot: number; stringIndex: number }>;
  onCreateTie?: () => void;
  isSynthMuted?: boolean;
  onSynthMuteToggle?: () => void;
  noteAtCurrentPosition?: Note | null;
}

// String configuration for 3-string strumstick
const stringLabels = ['d', 'A', 'D']; // Display order: Hi D, A, Low D
const stringIndices = [2, 1, 0]; // Data indices: Hi D=2, A=1, Low D=0

/**
 * TabViewer Component - Pure rendering component for tablature display
 * Uses functional architecture with hooks for all state management and interactions
 */
const TabViewer: React.FC<TabViewerProps> = ({ 
  tabData, 
  currentPosition, 
  onAddNote, 
  onRemoveNote,
  onMoveCursor,
  onCursorClick,
  onPlayPreviewNote,
  selectedDuration,
  onTogglePlayback,
  onResetCursor,
  selectedNoteType,
  zoom,
  onZoomChange,
  isPlaying,
  currentPlaybackTimeSlot,
  selectedNotes,
  onCreateTie,
  isSynthMuted,
  onSynthMuteToggle,
  noteAtCurrentPosition,
  currentToolMode,
  customMeasureLines
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // === Layout Constants ===
  const layout = useMemo(() => {
    const stringSpacing = 60 * zoom;
    const leftMargin = 80 * zoom;
    const rightMargin = 80 * zoom;
    const topMargin = 40 * zoom;
    const bottomMargin = 40 * zoom;
    const slotWidth = 20 * zoom;
    
    // Calculate total dimensions
    const minSlots = Math.max(tabData.length, currentPosition.timeSlot + 8);
    const totalWidth = leftMargin + (minSlots * slotWidth) + rightMargin;
    const totalHeight = (topMargin + bottomMargin + (2 * stringSpacing)) * zoom;
    
    return {
      stringSpacing,
      leftMargin,
      rightMargin,
      topMargin,
      bottomMargin,
      slotWidth,
      totalWidth,
      totalHeight
    };
  }, [zoom, tabData.length, currentPosition.timeSlot]);

  // === Helper Functions ===
  const getStringY = (stringIndex: number) => {
    const displayIndex = stringIndices.indexOf(stringIndex);
    return layout.topMargin + (displayIndex * layout.stringSpacing);
  };

  const getCursorPosition = () => ({
    x: getVisualSlotX(currentPosition.timeSlot, customMeasureLines, layout.leftMargin, layout.slotWidth),
    y: getStringY(currentPosition.stringIndex)
  });

  // === Event Handlers ===
  const handleZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(4.0, zoom + zoomDelta));
      onZoomChange(newZoom);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find closest string
    let closestStringIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < stringIndices.length; i++) {
      const stringY = getStringY(stringIndices[i]);
      const distance = Math.abs(y - stringY);
      if (distance < minDistance) {
        minDistance = distance;
        closestStringIndex = stringIndices[i];
      }
    }
    
    // Find closest time slot
    const adjustedX = x - layout.leftMargin;
    let closestSlot = Math.round(adjustedX / layout.slotWidth);
    
    // Check for measure line click
    const measureLine = customMeasureLines.find(ml => {
      const measureX = getMeasureLineX(ml.slot, layout.leftMargin, layout.slotWidth, customMeasureLines);
      return Math.abs(x - measureX) < 10;
    });
    
    const clickedOnMeasureLine = !!measureLine;
    if (clickedOnMeasureLine && measureLine) {
      closestSlot = measureLine.slot;
    }
    
    closestSlot = Math.max(0, closestSlot);
    onCursorClick(closestSlot, closestStringIndex, e.shiftKey, clickedOnMeasureLine);
  };

  // === Measure Boundaries Calculation ===
  const measureBoundaries = useMemo(() => {
    const boundaries: number[] = [];
    
    // Add custom measure lines
    customMeasureLines.forEach(ml => {
      boundaries.push(ml.slot);
    });
    
    // Add calculated measure boundaries if no custom lines
    if (customMeasureLines.length === 0) {
      // Calculate based on 4/4 time signature (16 slots per measure)
      for (let slot = 16; slot < Math.max(tabData.length, currentPosition.timeSlot + 32); slot += 16) {
        boundaries.push(slot);
      }
    }
    
    return boundaries.sort((a, b) => a - b);
  }, [customMeasureLines, tabData.length, currentPosition.timeSlot]);

  // === Note Stem Rendering ===
  const renderNoteStem = (note: Note, x: number, y: number) => {
    const visual = DURATION_VISUALS[note.duration]
    if (visual.stemHeight === 0) return null
    
    const stemHeight = 30
    const stemDirection = note.stringIndex <= 1 ? 1 : -1 // Up for low strings, down for high
    const stemX = x + (visual.isOpen ? 0 : 0)
    const stemY1 = y
    const stemY2 = y + (stemDirection * stemHeight)
    
    return (
      <g>
        <line
          x1={stemX}
          y1={stemY1}
          x2={stemX}
          y2={stemY2}
          stroke="#000"
          strokeWidth="2"
        />
        {visual.hasFlag && (
          <path
            d={`M ${stemX} ${stemY2} Q ${stemX + 15} ${stemY2 - 10} ${stemX + 12} ${stemY2 + 5}`}
            fill="#000"
          />
        )}
      </g>
    )
  }

  // === Main Render ===
  return (
    <div className="tab-viewer">
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoomChange(Math.min(4.0, zoom + 0.25))}>+</button>
      </div>

      {/* Tab Display */}
      <div 
        className="tab-display"
        onWheel={handleZoom}
        style={{ overflow: 'auto', maxHeight: '500px' }}
      >
        <svg
          ref={svgRef}
          width={layout.totalWidth}
          height={layout.totalHeight}
          onClick={handleSvgClick}
          style={{ cursor: 'pointer' }}
        >
          {/* String Lines */}
          {stringIndices.map((stringIndex) => {
            const y = getStringY(stringIndex);
            const endX = layout.leftMargin + (Math.max(tabData.length, currentPosition.timeSlot + 8) * layout.slotWidth);
            
            return (
              <line
                key={`string-${stringIndex}`}
                x1={layout.leftMargin}
                y1={y}
                x2={endX}
                y2={y}
                stroke="#333"
                strokeWidth="2"
              />
            );
          })}

          {/* String Labels */}
          {stringIndices.map((stringIndex) => {
            const displayIndex = stringIndices.indexOf(stringIndex);
            const y = getStringY(stringIndex);
            
            return (
              <text
                key={`label-${stringIndex}`}
                x={layout.leftMargin - 20}
                y={y + 5}
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#333"
              >
                {stringLabels[displayIndex]}
              </text>
            );
          })}

          {/* Measure Lines */}
          {measureBoundaries.map((slotPosition) => {
            const x = getMeasureLineX(slotPosition, layout.leftMargin, layout.slotWidth, customMeasureLines);
            const topY = getStringY(2) - 10;
            const bottomY = getStringY(0) + 10;
            
            return (
              <line
                key={`measure-${slotPosition}`}
                className="measure-line"
                data-slot={slotPosition}
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

          {/* Notes and Rests */}
          {tabData.map((cell, slotIndex) => {
            return cell.notes.map((note, noteIndex) => {
              const x = getVisualNoteX(note, customMeasureLines, layout.leftMargin, layout.slotWidth);
              const y = getStringY(note.stringIndex);
              const visual = DURATION_VISUALS[note.duration];
              
              if (note.type === 'rest') {
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
                return (
                  <g key={`note-${slotIndex}-${noteIndex}`} className="note-symbol" data-slot={note.startSlot} data-string={note.stringIndex}>
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
                    
                    {note.isDotted && (
                      <circle
                        cx={x + 20}
                        cy={y}
                        r="3"
                        fill="#000"
                      />
                    )}
                  </g>
                );
              }
            });
          })}

          {/* Ties */}
          {getAllTies(tabData).map((tie, index) => {
            const fromX = getSlotX(tie.fromSlot, layout.leftMargin, layout.slotWidth);
            const toX = getSlotX(tie.toSlot, layout.leftMargin, layout.slotWidth);
            const y = getStringY(tie.stringIndex);
            
            const midX = (fromX + toX) / 2;
            const curveHeight = 20;
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

          {/* Selected Notes Highlighting */}
          {selectedNotes && selectedNotes.map((selectedNote, index) => {
            const x = getVisualSlotX(selectedNote.timeSlot, customMeasureLines, layout.leftMargin, layout.slotWidth);
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

          {/* Cursor Position */}
          <g className="current-position">
            <circle
              cx={getCursorPosition().x}
              cy={getCursorPosition().y}
              r="16"
              fill="none"
              stroke="#ff6b35"
              strokeWidth="3"
              opacity={noteAtCurrentPosition ? "0.9" : "0.6"}
            />
            {noteAtCurrentPosition && (
              <circle
                cx={getCursorPosition().x}
                cy={getCursorPosition().y}
                r="12"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="2"
                opacity="0.5"
              />
            )}
          </g>

          {/* Playback Indicator */}
          {currentPlaybackTimeSlot !== undefined && currentPlaybackTimeSlot >= 0 && (
            <g className="playback-indicator">
              <line
                x1={getSlotX(currentPlaybackTimeSlot, layout.leftMargin, layout.slotWidth)}
                y1={getStringY(2) - 30}
                x2={getSlotX(currentPlaybackTimeSlot, layout.leftMargin, layout.slotWidth)}
                y2={getStringY(0) + 30}
                stroke={isPlaying ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 165, 0, 0.8)"}
                strokeWidth="2"
                opacity="0.8"
                strokeDasharray={isPlaying ? "none" : "5,3"}
              />
              <circle
                cx={getSlotX(currentPlaybackTimeSlot, layout.leftMargin, layout.slotWidth)}
                cy={getStringY(1)}
                r="3"
                fill={isPlaying ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 165, 0, 0.8)"}
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