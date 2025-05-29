import React from 'react';

interface FretboardProps {
  currentlyPlaying?: { fret: number; stringIndex: number }[];
}

const Fretboard: React.FC<FretboardProps> = ({ currentlyPlaying = [] }) => {
  const strings = ['Low D', 'A', 'Hi D'];
  const frets = Array.from({ length: 13 }, (_, i) => i); // Frets 0-12

  // Calculate position for a dot on the fretboard
  const getDotPosition = (fret: number, stringIndex: number) => {
    const fretWidth = 60;
    const stringHeight = 40;
    const x = fret === 0 ? 30 : (fret * fretWidth) - 30; // Open string or between frets
    const y = stringIndex * stringHeight + 20;
    return { x, y };
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Fretboard</h3>
      <svg width="800" height="150" style={{ border: '1px solid #ccc' }}>
        {/* Draw fret lines */}
        {frets.slice(1).map((fret) => (
          <line
            key={fret}
            x1={fret * 60}
            y1={0}
            x2={fret * 60}
            y2={120}
            stroke="#666"
            strokeWidth="2"
          />
        ))}
        
        {/* Draw strings */}
        {strings.map((string, index) => (
          <line
            key={string}
            x1={0}
            y1={index * 40 + 20}
            x2={780}
            y2={index * 40 + 20}
            stroke="#333"
            strokeWidth="1"
          />
        ))}
        
        {/* Draw fret numbers */}
        {frets.slice(1).map((fret) => (
          <text
            key={fret}
            x={fret * 60 - 30}
            y={135}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            {fret}
          </text>
        ))}
        
        {/* Draw string labels */}
        {strings.map((string, index) => (
          <text
            key={string}
            x={-10}
            y={index * 40 + 25}
            textAnchor="end"
            fontSize="12"
            fill="#333"
          >
            {string}
          </text>
        ))}
        
        {/* Draw dots for currently playing notes */}
        {currentlyPlaying.map((note, index) => {
          const { x, y } = getDotPosition(note.fret, note.stringIndex);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="8"
              fill="#ff4444"
              stroke="#cc0000"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Fretboard; 