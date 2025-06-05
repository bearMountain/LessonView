import React, { useRef, useMemo } from 'react';
import './TabViewer.css';
import type { Tab, Duration, NoteStack } from '../types/notestack';
import { DURATION_VISUALS } from './types';

interface TabViewerProps {
  tab: Tab; // Direct NoteStack data
  currentPosition: number; // Position in ticks
  onAddNote: (fret: number | null, duration?: string, type?: 'note' | 'rest') => void;
  onRemoveNote: () => void;
  onMoveCursor: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onCursorClick: (position: number, stringIndex: number, shiftHeld?: boolean) => void;
  onPlayPreviewNote?: (fret: number, stringIndex: number) => void;
  selectedDuration: Duration;
  selectedNoteType: 'note' | 'rest';
  currentToolMode: 'note' | 'measureLine' | 'select';
  onTogglePlayback?: () => void;
  onResetCursor?: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isPlaying?: boolean;
  currentPlaybackPosition?: number; // Position in ticks
  selectedStacks?: string[]; // Selected stack IDs
  onCreateTie?: () => void;
  isSynthMuted?: boolean;
  onSynthMuteToggle?: () => void;
  bpm: number;
}

// String configuration for 3-string strumstick
const stringLabels = ['D', 'A', 'd']; // Display order: Hi D, A, Low D
const stringIndices = [2, 1, 0]; // Data indices: Hi D=2, A=1, Low D=0

// Convert ticks to display position
const PIXELS_PER_TICK = 0.05;

/**
 * TabViewer Component - NoteStack-native rendering component
 * Works directly with NoteStack data structure
 */
const TabViewer: React.FC<TabViewerProps> = ({ 
  tab,
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
  currentPlaybackPosition,
  selectedStacks,
  onCreateTie,
  isSynthMuted,
  onSynthMuteToggle,
  currentToolMode,
  bpm
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // === Layout Constants ===
  const layout = useMemo(() => {
    const stringSpacing = 60 * zoom;
    const leftMargin = 80 * zoom;
    const rightMargin = 80 * zoom;
    const topMargin = 40 * zoom;
    const bottomMargin = 40 * zoom;
    
    // Calculate total width based on musical positions
    const maxPosition = Math.max(
      ...tab.map(stack => stack.musicalPosition),
      currentPosition + 3840 // Add extra space (1 measure)
    );
    const totalWidth = leftMargin + (maxPosition * PIXELS_PER_TICK * zoom) + rightMargin;
    const totalHeight = (topMargin + bottomMargin + (2 * stringSpacing)) * zoom;
    
    return {
      stringSpacing,
      leftMargin,
      rightMargin,
      topMargin,
      bottomMargin,
      totalWidth,
      totalHeight,
      pixelsPerTick: PIXELS_PER_TICK * zoom
    };
  }, [zoom, tab, currentPosition]);

  // === Helper Functions ===
  const getStringY = (stringIndex: number) => {
    const displayIndex = stringIndices.indexOf(stringIndex);
    return layout.topMargin + (displayIndex * layout.stringSpacing);
  };

  const getPositionX = (musicalPosition: number) => {
    return layout.leftMargin + (musicalPosition * layout.pixelsPerTick);
  };

  const getCursorPosition = () => ({
    x: getPositionX(currentPosition),
    y: getStringY(1) // Default to middle string (A)
  });

  // === Measure Lines Calculation ===
  const measureLines = useMemo(() => {
    const lines: number[] = [];
    const ticksPerMeasure = 3840; // 4/4 time, 960 ticks per quarter note
    
    const maxPosition = Math.max(
      ...tab.map(stack => stack.musicalPosition),
      currentPosition + ticksPerMeasure
    );
    
    for (let pos = ticksPerMeasure; pos <= maxPosition; pos += ticksPerMeasure) {
      lines.push(pos);
    }
    
    return lines;
  }, [tab, currentPosition]);

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
    
    // Convert click position to musical position (ticks)
    const clickPosition = Math.max(0, (x - layout.leftMargin) / layout.pixelsPerTick);
    
    // Snap to nearest quarter note (960 ticks)
    const snappedPosition = Math.round(clickPosition / 960) * 960;
    
    onCursorClick(snappedPosition, closestStringIndex, e.shiftKey);
  };

  // === Note Stem Rendering ===
  const renderNoteStem = (duration: Duration, x: number, y: number, stringIndex: number) => {
    const visual = DURATION_VISUALS[duration];
    if (visual.stemHeight === 0) return null;
    
    const stemHeight = 30;
    const stemDirection = stringIndex <= 1 ? 1 : -1; // Up for low strings, down for high
    const stemX = x;
    const stemY1 = y;
    const stemY2 = y + (stemDirection * stemHeight);
    
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
    );
  };

  // === Main Render ===
  return (
    <div className="tab-viewer">
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoomChange(Math.min(4.0, zoom + 0.25))}>+</button>
        <span style={{ marginLeft: '20px', fontSize: '12px', color: '#666' }}>
          BPM: {bpm} | Position: {currentPosition} ticks
        </span>
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
            
            return (
              <line
                key={`string-${stringIndex}`}
                x1={layout.leftMargin}
                y1={y}
                x2={layout.totalWidth - layout.rightMargin}
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
          {measureLines.map((position) => {
            const x = getPositionX(position);
            const topY = getStringY(2) - 10;
            const bottomY = getStringY(0) + 10;
            
            return (
              <line
                key={`measure-${position}`}
                className="measure-line"
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

          {/* NoteStacks - Render vertical stacks of notes */}
          {tab.map((stack) => {
            const stackX = getPositionX(stack.musicalPosition);
            const isSelected = selectedStacks?.includes(stack.id);
            const visual = DURATION_VISUALS[stack.duration];
            
            return (
              <g key={stack.id} className="note-stack">
                {/* Stack selection highlight */}
                {isSelected && (
                  <rect
                    x={stackX - 20}
                    y={getStringY(2) - 20}
                    width={40}
                    height={getStringY(0) - getStringY(2) + 40}
                    fill="none"
                    stroke="#007acc"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    opacity="0.6"
                  />
                )}
                
                {/* Notes in the stack */}
                {stack.notes.map((note, noteIndex) => {
                  const y = getStringY(note.string);
                  
                  return (
                    <g key={`${stack.id}-note-${noteIndex}`} className="note-symbol">
                      <circle
                        cx={stackX}
                        cy={y}
                        r="12"
                        fill={visual.isOpen ? "white" : "#000"}
                        stroke="#000"
                        strokeWidth="2"
                      />
                      
                      {renderNoteStem(stack.duration, stackX, y, note.string)}
                      
                      <text
                        x={stackX}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill={visual.isOpen ? "#000" : "#fff"}
                      >
                        {note.fret}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Cursor Position */}
          <g className="current-position">
            <line
              x1={getCursorPosition().x}
              y1={getStringY(2) - 15}
              x2={getCursorPosition().x}
              y2={getStringY(0) + 15}
              stroke="#ff6b35"
              strokeWidth="3"
              opacity="0.8"
            />
            <circle
              cx={getCursorPosition().x}
              cy={getCursorPosition().y}
              r="8"
              fill="#ff6b35"
              opacity="0.8"
            />
          </g>

          {/* Playback Position */}
          {isPlaying && currentPlaybackPosition !== undefined && (
            <line
              x1={getPositionX(currentPlaybackPosition)}
              y1={getStringY(2) - 15}
              x2={getPositionX(currentPlaybackPosition)}
              y2={getStringY(0) + 15}
              stroke="#4caf50"
              strokeWidth="2"
              opacity="0.7"
            />
          )}
        </svg>
      </div>

      {/* Status Bar */}
      <div style={{ 
        padding: '8px', 
        backgroundColor: '#f5f5f5', 
        borderTop: '1px solid #ddd',
        fontSize: '12px',
        color: '#666'
      }}>
        Stacks: {tab.length} | 
        Selected: {selectedStacks?.length || 0} | 
        Duration: {selectedDuration} |
        {isPlaying ? ' ▶️ Playing' : ' ⏸️ Stopped'}
        {isSynthMuted && ' 🔇 Muted'}
      </div>
    </div>
  );
};

export default TabViewer; 