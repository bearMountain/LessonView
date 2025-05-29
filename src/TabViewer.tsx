import React from 'react';
import './TabViewer.css';

interface TabViewerProps {
  tabData: (number | null)[][][];
  onUpdateTab: (measureIndex: number, beatIndex: number, stringIndex: number, value: number | null) => void;
}

// Strings in reverse order (Hi D on top)
const stringNames = ['Hi D', 'A', 'Low D'];

const TabViewer: React.FC<TabViewerProps> = ({ tabData, onUpdateTab }) => {
  const handleFretChange = (
    measureIndex: number,
    beatIndex: number,
    stringIndex: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value === '' ? null : parseInt(event.target.value);
    if (value === null || (value >= 0 && value <= 12)) {
      // Convert display index to data index (reverse the string order)
      const dataStringIndex = 2 - stringIndex;
      onUpdateTab(measureIndex, beatIndex, dataStringIndex, value);
    }
  };

  return (
    <div className="tab-viewer">
      <div className="tab-header">
        {stringNames.map((name) => (
          <div key={name} className="string-name">{name}</div>
        ))}
      </div>
      <div className="tab-content">
        {/* Display each string as a row */}
        {stringNames.map((stringName, displayStringIndex) => (
          <div key={stringName} className="measures-row">
            {tabData.map((measure, measureIndex) => (
              <div key={measureIndex} className="measure">
                {measure.map((beat, beatIndex) => {
                  // Get the fret for this string (reversed)
                  const dataStringIndex = 2 - displayStringIndex;
                  const fret = beat[dataStringIndex];
                  return (
                    <div key={beatIndex} className="fret">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={fret === null ? '' : fret}
                        onChange={(e) => handleFretChange(measureIndex, beatIndex, displayStringIndex, e)}
                        className="fret-input"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabViewer; 