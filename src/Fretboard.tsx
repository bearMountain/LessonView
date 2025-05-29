import React from 'react';

const fretCount = 6;
const stringCount = 3;

const Fretboard: React.FC = () => {
  const width = 300;
  const height = 100;
  const fretSpacing = width / fretCount;
  const stringSpacing = height / (stringCount + 1);

  return (
    <div>
      <h2>Fretboard</h2>
      <svg width={width} height={height} style={{ background: '#f9f9f9', border: '1px solid #ccc' }}>
        {/* Frets */}
        {[...Array(fretCount + 1)].map((_, i) => (
          <line
            key={i}
            x1={i * fretSpacing}
            y1={0}
            x2={i * fretSpacing}
            y2={height}
            stroke="#888"
            strokeWidth={i === 0 ? 4 : 2}
          />
        ))}
        {/* Strings */}
        {[...Array(stringCount)].map((_, i) => (
          <line
            key={i}
            x1={0}
            y1={(i + 1) * stringSpacing}
            x2={width}
            y2={(i + 1) * stringSpacing}
            stroke="#444"
            strokeWidth={2}
          />
        ))}
      </svg>
    </div>
  );
};

export default Fretboard; 