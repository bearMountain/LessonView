import React from 'react';

interface FretboardProps {
  currentlyPlaying?: { fret: number; stringIndex: number }[];
}

const Fretboard: React.FC<FretboardProps> = ({ currentlyPlaying = [] }) => {
  // Calculate position for a dot on the fretboard based on the uploaded image
  const getDotPosition = (fret: number, stringIndex: number) => {
    const fretboardStartX = 60; // Where the actual fretboard starts in the image
    const fretWidth = 70; // Width between frets in the image
    const stringSpacing = 35; // Vertical spacing between strings
    const firstStringY = 45; // Y position of the first string (Hi D)
    
    let x: number;
    if (fret === 0) {
      // Open string - place dot at the very beginning of the fretboard
      x = 20; 
    } else {
      // Fretted note - place dot between frets (in the middle of the fret space)
      x = fretboardStartX + (fret - 1) * fretWidth + (fretWidth / 2);
    }
    
    // Reverse the string order to match our data structure (Hi D = index 2 -> top string)
    const visualStringIndex = 2 - stringIndex;
    const y = firstStringY + (visualStringIndex * stringSpacing);
    
    return { x, y };
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Fretboard</h3>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* SVG fretboard as fallback */}
        <svg width="800" height="150" style={{ border: '1px solid #ccc' }}>
          {/* Draw nut (thick line at the beginning) */}
          <line
            x1={50}
            y1={20}
            x2={50}
            y2={130}
            stroke="#000"
            strokeWidth="6"
          />
          
          {/* Draw fret lines */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((fret) => (
            <line
              key={fret}
              x1={50 + fret * 70}
              y1={20}
              x2={50 + fret * 70}
              y2={130}
              stroke="#666"
              strokeWidth="2"
            />
          ))}
          
          {/* Draw strings */}
          {['Hi D', 'A', 'Low D'].map((string, index) => (
            <line
              key={string}
              x1={50}
              y1={45 + index * 35}
              x2={890}
              y2={45 + index * 35}
              stroke="#333"
              strokeWidth="2"
            />
          ))}
          
          {/* Draw fret numbers */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((fret) => (
            <text
              key={fret}
              x={50 + (fret - 1) * 70 + 35}
              y={165}
              textAnchor="middle"
              fontSize="14"
              fill="#666"
            >
              {fret}
            </text>
          ))}
          
          {/* Draw string labels */}
          {['Hi D', 'A', 'Low D'].map((string, index) => (
            <text
              key={string}
              x={35}
              y={50 + index * 35}
              textAnchor="end"
              fontSize="14"
              fill="#333"
              fontWeight="bold"
            >
              {string}
            </text>
          ))}
          
          {/* Draw position markers (dots at 3rd, 5th, 7th, 9th frets) */}
          {[3, 5, 7, 9].map((fret) => (
            <circle
              key={`marker-${fret}`}
              cx={50 + (fret - 1) * 70 + 35}
              cy={80}
              r="4"
              fill="#ddd"
            />
          ))}
          
          {/* Draw 12th fret double dots */}
          <circle cx={50 + 11 * 70 + 35} cy={65} r="4" fill="#ddd" />
          <circle cx={50 + 11 * 70 + 35} cy={95} r="4" fill="#ddd" />
          
          {/* Draw dots for currently playing notes */}
          {currentlyPlaying.map((note, index) => {
            const { x, y } = getDotPosition(note.fret, note.stringIndex);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="10"
                fill="#ff4444"
                stroke="#cc0000"
                strokeWidth="3"
                opacity="0.9"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default Fretboard; 