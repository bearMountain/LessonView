import React from 'react';

interface FretboardProps {
  currentlyPlaying?: { fret: number; stringIndex: number }[];
}

const Fretboard: React.FC<FretboardProps> = ({ currentlyPlaying = [] }) => {
  // Calculate position for a dot on the fretboard based on the actual image
  const getDotPosition = (fret: number, stringIndex: number) => {
    // These values should be adjusted based on your actual fretboard.png dimensions and layout
    const imageWidth = 1172; // Original image width from your upload
    const imageHeight = 152; // Original image height from your upload
    const displayWidth = 800; // Our display width
    const displayHeight = 120; // Our display height
    
    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;
    
    // Approximate positions based on the fretboard image layout
    // You may need to adjust these values to match your specific image
    const nutX = 95 * scaleX; // Where the nut/beginning starts
    const fretSpacing = 85 * scaleX; // Spacing between frets
    const firstStringY = 30 * scaleY; // Y position of first string (Hi D)
    const stringSpacing = 30 * scaleY; // Spacing between strings
    
    let x: number;
    if (fret === 0) {
      // Open string - place dot just before the nut
      x = nutX - 15;
    } else {
      // Fretted note - place dot in the middle of the fret space
      x = nutX + (fret - 1) * fretSpacing + (fretSpacing / 2);
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