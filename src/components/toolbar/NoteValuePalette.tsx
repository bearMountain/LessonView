import React from 'react';
import type { NoteDuration } from '../../types';

interface NoteValuePaletteProps {
  selectedDuration: NoteDuration;
  onDurationChange: (duration: NoteDuration) => void;
}

interface NoteValue {
  duration: NoteDuration;
  symbol: string;
  name: string;
  unicodeSymbol?: string;
}

const NoteValuePalette: React.FC<NoteValuePaletteProps> = ({
  selectedDuration,
  onDurationChange,
}) => {
  const noteValues: NoteValue[] = [
    {
      duration: 'whole',
      symbol: '𝅝',
      unicodeSymbol: '♩', // Fallback
      name: 'Whole Note',
    },
    {
      duration: 'half',
      symbol: '𝅗𝅥',
      unicodeSymbol: '♩',
      name: 'Half Note',
    },
    {
      duration: 'quarter',
      symbol: '♩',
      unicodeSymbol: '♩',
      name: 'Quarter Note',
    },
    {
      duration: 'eighth',
      symbol: '♪',
      unicodeSymbol: '♪',
      name: 'Eighth Note',
    },
    {
      duration: 'sixteenth',
      symbol: '𝅘𝅥𝅯',
      unicodeSymbol: '♬',
      name: 'Sixteenth Note',
    },
  ];

  return (
    <div className="note-value-palette">
      <span className="note-value-palette__label">Duration:</span>
      <div className="note-value-palette__buttons">
        {noteValues.map((noteValue) => (
          <button
            key={noteValue.duration}
            className={`note-value-button ${
              selectedDuration === noteValue.duration ? 'note-value-button--active' : ''
            }`}
            onClick={() => onDurationChange(noteValue.duration)}
            title={noteValue.name}
            aria-label={noteValue.name}
          >
            <span className="note-value-button__symbol">
              {noteValue.symbol}
            </span>
            <span className="note-value-button__text">
              {noteValue.duration}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NoteValuePalette; 