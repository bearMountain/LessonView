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
    
    // Adjusted vertical positions - closer together
    const stringPositionsY = [
      45 * scaleY,  // Hi D (top string, index 2 in our data)
      75 * scaleY,  // A (middle string, index 1 in our data)  
      105 * scaleY  // Low D (bottom string, index 0 in our data)
    ];
    
    // Shifted horizontal positions - moved to the left
    const leftShift = 20 * scaleX; // Amount to shift left
    const fretPositions = [
      (285 - leftShift) * scaleX,   // 0th fret (open)
      (375 - leftShift) * scaleX,   // 1st fret
      (455 - leftShift) * scaleX,   // 2nd fret
      (525 - leftShift) * scaleX,   // 3rd fret
      (590 - leftShift) * scaleX,   // 4th fret
      (650 - leftShift) * scaleX,   // 5th fret
      (705 - leftShift) * scaleX,   // 6th fret
      (755 - leftShift) * scaleX,   // 7th fret
      (800 - leftShift) * scaleX,   // 8th fret
      (840 - leftShift) * scaleX,   // 9th fret
      (875 - leftShift) * scaleX,   // 10th fret
      (905 - leftShift) * scaleX,   // 11th fret
      (935 - leftShift) * scaleX    // 12th fret
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