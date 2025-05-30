import React from 'react';
import type { NoteDuration, NoteType } from '../../types';

interface NoteValuePaletteProps {
  selectedDuration: NoteDuration;
  onDurationChange: (duration: NoteDuration) => void;
  selectedNoteType?: NoteType;
  onNoteTypeChange?: (type: NoteType) => void;
}

interface NoteValue {
  duration: NoteDuration;
  noteSymbol: string;
  restSymbol: string;
  name: string;
}

const NoteValuePalette: React.FC<NoteValuePaletteProps> = ({
  selectedDuration,
  onDurationChange,
  selectedNoteType = 'note',
  onNoteTypeChange,
}) => {
  const noteValues: NoteValue[] = [
    {
      duration: 'whole',
      noteSymbol: '𝅝',
      restSymbol: '𝄻', // Whole rest
      name: 'Whole',
    },
    {
      duration: 'half',
      noteSymbol: '𝅗𝅥',
      restSymbol: '𝄼', // Half rest
      name: 'Half',
    },
    {
      duration: 'quarter',
      noteSymbol: '♩',
      restSymbol: '𝄽', // Quarter rest
      name: 'Quarter',
    },
    {
      duration: 'eighth',
      noteSymbol: '♪',
      restSymbol: '𝄾', // Eighth rest
      name: 'Eighth',
    },
    {
      duration: 'sixteenth',
      noteSymbol: '𝅘𝅥𝅯',
      restSymbol: '𝄿', // Sixteenth rest
      name: 'Sixteenth',
    },
  ];

  return (
    <div className="note-value-palette">
      <span className="note-value-palette__label">Duration:</span>
      <div className="note-value-palette__buttons">
        {noteValues.map((noteValue) => (
          <div key={noteValue.duration} className="note-value-pair">
            {/* Note button */}
            <button
              className={`note-value-button ${
                selectedDuration === noteValue.duration && selectedNoteType === 'note' 
                  ? 'note-value-button--active' : ''
              }`}
              onClick={() => {
                onDurationChange(noteValue.duration);
                if (onNoteTypeChange) onNoteTypeChange('note');
              }}
              title={`${noteValue.name} Note`}
              aria-label={`${noteValue.name} Note`}
            >
              <span className="note-value-button__symbol">
                {noteValue.noteSymbol}
              </span>
              <span className="note-value-button__text">
                {noteValue.duration}
              </span>
            </button>
            
            {/* Rest button */}
            <button
              className={`note-value-button note-value-button--rest ${
                selectedDuration === noteValue.duration && selectedNoteType === 'rest' 
                  ? 'note-value-button--active' : ''
              }`}
              onClick={() => {
                onDurationChange(noteValue.duration);
                if (onNoteTypeChange) onNoteTypeChange('rest');
              }}
              title={`${noteValue.name} Rest`}
              aria-label={`${noteValue.name} Rest`}
            >
              <span className="note-value-button__symbol">
                {noteValue.restSymbol}
              </span>
              <span className="note-value-button__text">
                rest
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteValuePalette; 