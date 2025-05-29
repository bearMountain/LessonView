import React from 'react';

interface FretboardProps {
  currentlyPlaying?: { fret: number; stringIndex: number }[];
}

const Fretboard: React.FC<FretboardProps> = ({ currentlyPlaying = [] }) => {
  // Calculate position for a dot on the fretboard based on the image proportions
  const getDotPosition = (fret: number, stringIndex: number) => {
    // Image dimensions and layout (adjust these based on actual image)
    const imageWidth = 1172;
    const imageHeight = 152;
    const scaleFactorX = 800 / imageWidth; // Scale to fit our display size
    const scaleFactorY = 120 / imageHeight;
    
    // Approximate positions based on the fretboard image layout
    const nutPosition = 95 * scaleFactorX; // Where the nut starts
    const fretSpacing = 85 * scaleFactorX; // Approximate spacing between frets
    const stringStartY = 25 * scaleFactorY; // Y position of first string
    const stringSpacing = 35 * scaleFactorY; // Spacing between strings
    
    let x: number;
    if (fret === 0) {
      // Open string - place dot just before the nut
      x = nutPosition - 20;
    } else {
      // Fretted note - place dot in the middle of the fret space
      x = nutPosition + (fret - 1) * fretSpacing + (fretSpacing / 2);
    }
    
    // Reverse the string order to match our data structure (Hi D = index 2 -> top string)
    const visualStringIndex = 2 - stringIndex;
    const y = stringStartY + (visualStringIndex * stringSpacing);
    
    return { x, y };
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Fretboard</h3>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Create an inline SVG with fretboard design similar to the uploaded image */}
        <svg width="800" height="120" style={{ border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
          {/* Fretboard background */}
          <rect x="0" y="0" width="800" height="120" fill="url(#woodGrain)" />
          
          {/* Define wood grain pattern */}
          <defs>
            <pattern id="woodGrain" x="0" y="0" width="100%" height="100%">
              <rect width="100%" height="100%" fill="#d4a574" />
              <path d="M0,20 Q200,25 400,20 T800,20" stroke="#c49660" strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M0,40 Q250,45 500,40 T800,40" stroke="#c49660" strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M0,60 Q300,65 600,60 T800,60" stroke="#c49660" strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M0,80 Q350,85 700,80 T800,80" stroke="#c49660" strokeWidth="1" fill="none" opacity="0.3" />
            </pattern>
          </defs>
          
          {/* Nut */}
          <rect x="90" y="10" width="8" height="100" fill="#f8f8f8" stroke="#ddd" strokeWidth="1" />
          
          {/* Fret wires */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((fret) => (
            <line
              key={fret}
              x1={90 + fret * 52}
              y1={10}
              x2={90 + fret * 52}
              y2={110}
              stroke="#c0c0c0"
              strokeWidth="3"
            />
          ))}
          
          {/* Strings */}
          {['Hi D', 'A', 'Low D'].map((string, index) => (
            <line
              key={string}
              x1={98}
              y1={30 + index * 30}
              x2={750}
              y2={30 + index * 30}
              stroke="#e6e6e6"
              strokeWidth="2"
            />
          ))}
          
          {/* Fret position dots */}
          {[3, 5, 7, 9].map((fret) => (
            <circle
              key={`dot-${fret}`}
              cx={90 + (fret - 0.5) * 52}
              cy={60}
              r="4"
              fill="#fff"
              opacity="0.6"
            />
          ))}
          
          {/* 12th fret double dots */}
          <circle cx={90 + 11.5 * 52} cy={45} r="4" fill="#fff" opacity="0.6" />
          <circle cx={90 + 11.5 * 52} cy={75} r="4" fill="#fff" opacity="0.6" />
          
          {/* Fret numbers */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((fret) => (
            <text
              key={`num-${fret}`}
              x={90 + (fret - 0.5) * 52}
              y={125}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {fret}
            </text>
          ))}
          
          {/* String labels */}
          {['Hi D', 'A', 'Low D'].map((string, index) => (
            <text
              key={string}
              x={75}
              y={35 + index * 30}
              textAnchor="end"
              fontSize="12"
              fill="#333"
              fontWeight="bold"
            >
              {string}
            </text>
          ))}
          
          {/* Playing dots */}
          {currentlyPlaying.map((note, index) => {
            const { x, y } = getDotPosition(note.fret, note.stringIndex);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="8"
                fill="#ff0000"
                stroke="#990000"
                strokeWidth="2"
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