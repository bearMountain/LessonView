import React from 'react';

interface FretboardProps {
  currentlyPlaying?: { fret: number; stringIndex: number }[];
}

const Fretboard: React.FC<FretboardProps> = ({ currentlyPlaying = [] }) => {
  // Calculate position for a dot on the fretboard based on the reference image
  const getDotPosition = (fret: number, stringIndex: number) => {
    // Image dimensions (same as original fretboard)
    const imageWidth = 1172; // Original image width
    const imageHeight = 152; // Original image height
    const displayWidth = 800; // Our display width
    const displayHeight = 120; // Our display height
    
    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;
    
    // Based on the reference image with red dots:
    // Analyzing the vertical positions of the 3 dots on the 0th fret
    const stringPositionsY = [
      40 * scaleY,  // Hi D (top string, index 2 in our data)
      75 * scaleY,  // A (middle string, index 1 in our data)  
      110 * scaleY  // Low D (bottom string, index 0 in our data)
    ];
    
    // Analyzing the horizontal positions from the dots across the top string
    const openStringX = 285 * scaleX; // Position for open string (0th fret)
    const fretPositions = [
      285 * scaleX,   // 0th fret (open)
      375 * scaleX,   // 1st fret
      455 * scaleX,   // 2nd fret
      525 * scaleX,   // 3rd fret
      590 * scaleX,   // 4th fret
      650 * scaleX,   // 5th fret
      705 * scaleX,   // 6th fret
      755 * scaleX,   // 7th fret
      800 * scaleX,   // 8th fret
      840 * scaleX,   // 9th fret
      875 * scaleX,   // 10th fret
      905 * scaleX,   // 11th fret
      935 * scaleX    // 12th fret
    ];
    
    let x: number;
    if (fret <= 12 && fret >= 0) {
      x = fretPositions[fret];
    } else {
      // Fallback for frets beyond 12
      x = fretPositions[12] + (fret - 12) * 25 * scaleX;
    }
    
    // Get the Y position for this string (reverse index since Hi D = index 2 but top string)
    const visualStringIndex = 2 - stringIndex;
    const y = stringPositionsY[visualStringIndex];
    
    return { x, y };
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Fretboard</h3>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Background image */}
        <img 
          src="/fretboard.png" 
          alt="Fretboard" 
          style={{ 
            width: '800px', 
            height: '120px',
            border: '1px solid #ccc'
          }} 
        />
        
        {/* SVG overlay for dots only */}
        <svg 
          width="800" 
          height="120" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            pointerEvents: 'none' 
          }}
        >
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