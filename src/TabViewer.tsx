import React from 'react';
import './TabViewer.css';

interface TabViewerProps {
  tabData: (number | null)[][][];
  onUpdateTab: (measureIndex: number, beatIndex: number, stringIndex: number, value: number | null) => void;
}

// Strings in reverse order (Hi D on top) with simplified notation
const stringLabels = ['d', 'A', 'D'];

const TabViewer: React.FC<TabViewerProps> = ({ tabData, onUpdateTab }) => {
  // Calculate dimensions
  const beatWidth = 80;
  const measureGap = 40;
  const stringSpacing = 40;
  const leftMargin = 50;
  const topMargin = 30;
  const rightMargin = 50;
  
  // Calculate total width based on tab data
  const totalBeats = tabData.reduce((sum, measure) => sum + measure.length, 0);
  const totalMeasures = tabData.length;
  const totalWidth = leftMargin + (totalBeats * beatWidth) + ((totalMeasures - 1) * measureGap) + rightMargin;
  const totalHeight = topMargin + (stringLabels.length * stringSpacing) + 50;

  const handleFretChange = (
    measureIndex: number,
    beatIndex: number,
    stringIndex: number,
    value: string
  ) => {
    const numValue = value === '' ? null : parseInt(value);
    if (numValue === null || (numValue >= 0 && numValue <= 12)) {
      // Convert display index to data index (reverse the string order)
      const dataStringIndex = 2 - stringIndex;
      onUpdateTab(measureIndex, beatIndex, dataStringIndex, numValue);
    }
  };

  // Calculate X position for a beat
  const getBeatX = (measureIndex: number, beatIndex: number) => {
    let x = leftMargin;
    
    // Add width for previous measures
    for (let i = 0; i < measureIndex; i++) {
      x += tabData[i].length * beatWidth;
      if (i > 0) x += measureGap;
    }
    
    // Add current measure gap if not first measure
    if (measureIndex > 0) x += measureGap;
    
    // Add width for previous beats in current measure
    x += beatIndex * beatWidth;
    
    return x;
  };

  // Calculate Y position for a string
  const getStringY = (stringIndex: number) => {
    return topMargin + (stringIndex * stringSpacing);
  };

  return (
    <div className="tab-viewer">
      <svg width={totalWidth} height={totalHeight} className="tab-svg">
        {/* String labels */}
        {stringLabels.map((label, stringIndex) => (
          <text
            key={`label-${stringIndex}`}
            x={leftMargin - 30}
            y={getStringY(stringIndex) + 5}
            textAnchor="middle"
            className="string-label-svg"
          >
            {label}
          </text>
        ))}

        {/* Horizontal string lines */}
        {stringLabels.map((_, stringIndex) => {
          const y = getStringY(stringIndex);
          
          return (
            <g key={`string-${stringIndex}`}>
              {/* Create line segments broken by measures */}
              {tabData.map((measure, measureIndex) => {
                const startX = getBeatX(measureIndex, 0);
                const endX = getBeatX(measureIndex, measure.length - 1) + beatWidth - 10;
                
                return (
                  <line
                    key={`line-${stringIndex}-${measureIndex}`}
                    x1={startX}
                    y1={y}
                    x2={endX}
                    y2={y}
                    stroke="#333"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Measure separators */}
        {tabData.map((_, measureIndex) => {
          if (measureIndex === 0) return null;
          
          const x = getBeatX(measureIndex, 0) - measureGap / 2;
          const topY = getStringY(0) - 10;
          const bottomY = getStringY(stringLabels.length - 1) + 10;
          
          return (
            <line
              key={`separator-${measureIndex}`}
              x1={x}
              y1={topY}
              x2={x}
              y2={bottomY}
              stroke="#666"
              strokeWidth="2"
            />
          );
        })}

        {/* Fret numbers with white circles */}
        {tabData.map((measure, measureIndex) =>
          measure.map((beat, beatIndex) =>
            beat.map((fret, dataStringIndex) => {
              // Convert data index to display index (reverse)
              const displayStringIndex = 2 - dataStringIndex;
              const x = getBeatX(measureIndex, beatIndex) + beatWidth / 2;
              const y = getStringY(displayStringIndex);
              
              return (
                <g key={`beat-${measureIndex}-${beatIndex}-${dataStringIndex}`}>
                  {/* White circle background (only if there's a number) */}
                  {fret !== null && (
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="white"
                      stroke="#333"
                      strokeWidth="1"
                    />
                  )}
                  
                  {/* Fret number or input for editing */}
                  <foreignObject
                    x={x - 15}
                    y={y - 12}
                    width="30"
                    height="24"
                  >
                    <input
                      type="text"
                      value={fret === null ? '' : fret.toString()}
                      onChange={(e) => handleFretChange(measureIndex, beatIndex, displayStringIndex, e.target.value)}
                      className="fret-input-svg"
                      maxLength={2}
                    />
                  </foreignObject>
                </g>
              );
            })
          )
        )}
      </svg>
    </div>
  );
};

export default TabViewer; 