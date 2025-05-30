import React from 'react';

interface FretboardProps {
  currentlyPlaying?: { fret: number; stringIndex: number }[];
}

const Fretboard: React.FC<FretboardProps> = ({ currentlyPlaying = [] }) => {
  // === ADJUSTABLE VISUAL VARIABLES ===
  const dotSize = 15; // Radius of the dots in pixels (increase = bigger dots)
  
  // Calculate position for a dot on the fretboard based on the reference image
  const getDotPosition = (fret: number, stringIndex: number) => {
    // === ADJUSTABLE POSITIONING VARIABLES ===
    const horizontalStartOffset = 430; // How much to shift all positions left (increase = more left)
    const verticalStartOffset = 15; // How much to shift all positions up/down (positive = down, negative = up)
    const stringSpacing = 50; // Vertical distance between strings (increase = more spread out)
    const horizontalScaleFactor = 3.1; // Multiply fret spacing (increase = more spread out horizontally)
    
    // Image dimensions (same as original fretboard)
    const imageWidth = 1172; // Original image width
    const imageHeight = 152; // Original image height
    const displayWidth = 800; // Our display width
    const displayHeight = 120; // Our display height
    
    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;
    
    // String positions - calculated from center with adjustable spacing and offset
    const centerY = 75 * scaleY; // Center string (A)
    const stringPositionsY = [
      (centerY - stringSpacing + verticalStartOffset) * scaleY,  // Hi D (top string, index 2 in our data)
      (centerY + verticalStartOffset) * scaleY,                  // A (middle string, index 1 in our data)  
      (centerY + stringSpacing + verticalStartOffset) * scaleY   // Low D (bottom string, index 0 in our data)
    ];
    
    // Base fret positions before scaling and shifting
    const baseFretPositions = [275, 365, 445, 490, 560, 620, 655, 680, 705, 840, 875, 905, 935];
    
    // Apply horizontal scaling and shifting
    const fretPositions = baseFretPositions.map((basePos, index) => {
      if (index === 0) {
        // Open string position (0th fret) - only apply start offset
        return (basePos - horizontalStartOffset) * scaleX;
      } else {
        // Fretted positions - apply both scaling and offset
        const scaledDistance = (basePos - baseFretPositions[0]) * horizontalScaleFactor;
        return (baseFretPositions[0] + scaledDistance - horizontalStartOffset) * scaleX;
      }
    });
    
    let x: number;
    if (fret <= 12 && fret >= 0) {
      x = fretPositions[fret];
    } else {
      // Fallback for frets beyond 12
      const lastFretSpacing = (fretPositions[12] - fretPositions[11]);
      x = fretPositions[12] + (fret - 12) * lastFretSpacing;
    }
    
    // Get the Y position for this string (reverse index since Hi D = index 2 but top string)
    const visualStringIndex = 2 - stringIndex;
    const y = stringPositionsY[visualStringIndex];
    
    return { x, y };
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '1200px' }}>
        {/* Background image */}
        <img 
          src="/fretboard.png" 
          alt="Fretboard" 
          style={{ 
            width: '100%', 
            height: 'auto',
            maxHeight: '80px',
            objectFit: 'contain',
            border: '1px solid #444'
          }} 
        />
        
        {/* SVG overlay for dots only */}
        <svg 
          width="100%" 
          height="80" 
          viewBox="0 0 800 120"
          preserveAspectRatio="xMidYMid meet"
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
                r={dotSize}
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