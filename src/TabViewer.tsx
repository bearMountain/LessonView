import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import './TabViewer.css';
import type { Tab, Duration, NoteStack } from './types/notestack';
import { DURATION_VISUALS } from './components/types';
import type { useNoteStackEditor } from './hooks/useNoteStackEditor';

interface TabViewerProps {
  editor: ReturnType<typeof useNoteStackEditor>;
}

// String configuration for 3-string strumstick
const stringLabels = ['D', 'A', 'd']; // Display order: Hi D, A, Low D
const stringIndices = [2, 1, 0]; // Data indices: Hi D=2, A=1, Low D=0

// Convert ticks to display position
const PIXELS_PER_TICK = 0.05;

/**
 * TabViewer Component - Pure functional component
 * Receives single state object and dispatch mechanism
 */
const TabViewer: React.FC<TabViewerProps> = ({ editor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tabDisplayRef = useRef<HTMLDivElement>(null);
  
  // Destructure what we need from the editor state
  const { state, layoutItems, totalWidth: baseWidth } = editor;
  const { 
    tab, 
    currentPosition, 
    selectedDuration, 
    zoom = 1, 
    isPlaying, 
    selectedStacks,
    bpm 
  } = state;
  
  // === Layout Constants ===
  const layout = useMemo(() => {
    const stringSpacing = 60 * zoom;
    const leftMargin = 80 * zoom;
    const rightMargin = 80 * zoom;
    const topMargin = 40 * zoom;
    const bottomMargin = 40 * zoom;
    
    // Scale the base width by zoom level
    const zoomedWidth = baseWidth * zoom;
    const totalHeight = (topMargin + bottomMargin + (2 * stringSpacing));
    
    return {
      stringSpacing,
      leftMargin,
      rightMargin,
      topMargin,
      bottomMargin,
      totalWidth: zoomedWidth,
      totalHeight,
      pixelsPerTick: PIXELS_PER_TICK * zoom
    };
  }, [zoom, baseWidth]);

  // === Helper Functions ===
  const getStringY = (stringIndex: number) => {
    const displayIndex = stringIndices.indexOf(stringIndex);
    return layout.topMargin + (displayIndex * layout.stringSpacing);
  };

  const getPositionX = (musicalPosition: number) => {
    return layout.leftMargin + (musicalPosition * layout.pixelsPerTick);
  };

  const getCursorPosition = () => {
    const position = {
      x: getPositionX(currentPosition),
      y: getStringY(1) // Default to middle string (A)
    };
    
    // Debug logging
    console.log('getCursorPosition:', {
      currentPosition,
      x: position.x,
      y: position.y,
      stringIndex: 1,
      stringY: getStringY(1)
    });
    
    return position;
  };

  // === Measure Lines Calculation ===
  const measureLines = useMemo(() => {
    const lines: number[] = [];
    const ticksPerMeasure = 3840; // 4/4 time, 960 ticks per quarter note
    
    const maxPosition = Math.max(
      ...tab.map((stack: NoteStack) => stack.musicalPosition),
      currentPosition + ticksPerMeasure
    );
    
    for (let pos = ticksPerMeasure; pos <= maxPosition; pos += ticksPerMeasure) {
      lines.push(pos);
    }
    
    return lines;
  }, [tab, currentPosition]);

  // === Event Handlers ===
  const handleZoom = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(4.0, zoom + zoomDelta));
      editor.setZoom(newZoom);
    }
  }, [zoom, editor]);

  // Add non-passive wheel event listener
  useEffect(() => {
    const tabDisplay = tabDisplayRef.current;
    if (tabDisplay) {
      tabDisplay.addEventListener('wheel', handleZoom, { passive: false });
      return () => {
        tabDisplay.removeEventListener('wheel', handleZoom);
      };
    }
  }, [handleZoom]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('SVG Click:', { x, y, leftMargin: layout.leftMargin });
    
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
    
    console.log('Closest String:', { closestStringIndex, minDistance });
    
    // Convert click position to musical position (ticks)
    const clickPosition = Math.max(0, (x - layout.leftMargin) / layout.pixelsPerTick);
    
    // Snap to nearest quarter note (960 ticks)
    const snappedPosition = Math.round(clickPosition / 960) * 960;
    
    console.log('Position Calculation:', { 
      clickPosition, 
      snappedPosition,
      pixelsPerTick: layout.pixelsPerTick 
    });
    
    // Set cursor position
    editor.setCursorPosition(snappedPosition);
    
    if (e.shiftKey) {
      // Handle selection
      const stack = tab.find((s: NoteStack) => s.musicalPosition === snappedPosition);
      if (stack && !selectedStacks.includes(stack.id)) {
        console.log('Would select stack:', stack.id);
        // TODO: Add selection action to editor
      }
    }
  };

  // Handle keyboard input for adding notes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('handleKeyDown:', { key: e.key, currentPosition });
    
    // Number keys 0-9 for frets
    if (e.key >= '0' && e.key <= '9') {
      const fret = parseInt(e.key);
      const defaultString = 1; // Middle string (A)
      console.log('Adding note:', { currentPosition, defaultString, fret, selectedDuration });
      editor.addNote(currentPosition, defaultString, fret, selectedDuration);
    }
    
    // Delete key to remove notes
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const defaultString = 1;
      console.log('Removing note:', { currentPosition, defaultString });
      editor.removeNote(currentPosition, defaultString);
    }
    
    // Arrow keys for navigation
    if (e.key === 'ArrowLeft') {
      console.log('Moving cursor left from:', currentPosition);
      editor.moveCursorLeft();
    }
    if (e.key === 'ArrowRight') {
      console.log('Moving cursor right from:', currentPosition);
      editor.moveCursorRight();
    }
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
    <div className="tab-viewer" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={() => editor.setZoom(Math.max(0.25, zoom - 0.25))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => editor.setZoom(Math.min(4.0, zoom + 0.25))}>+</button>
        <span style={{ marginLeft: '20px', fontSize: '12px', color: '#666' }}>
          BPM: {bpm} | Position: {currentPosition} ticks
        </span>
      </div>

      {/* Tab Display */}
      <div 
        ref={tabDisplayRef}
        className="tab-display"
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
          {tab.map((stack: NoteStack) => {
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
                {stack.notes.map((note: any, noteIndex: number) => {
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
              stroke="#ccc"
              strokeWidth="2"
              opacity="0.6"
            />
            <circle
              cx={getCursorPosition().x}
              cy={getCursorPosition().y}
              r="15"
              fill="none"
              stroke="#ccc"
              strokeWidth="2"
              opacity="0.6"
            />
          </g>

          {/* Playback Position */}
          {isPlaying && currentPosition !== undefined && (
            <line
              x1={getPositionX(currentPosition)}
              y1={getStringY(2) - 15}
              x2={getPositionX(currentPosition)}
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
        {isPlaying ? ' ▶️ Playing' : ' ⏸️ Stopped'} |
        Layout Items: {layoutItems.length}
      </div>
    </div>
  );
};

export default TabViewer; 