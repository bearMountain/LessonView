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
  noteSvgPath: string;
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
      noteSvgPath: '/Note SVGS/Whole Note.svg',
      restSymbol: '𝄻', // Whole rest
      name: 'Whole',
    },
    {
      duration: 'half',
      noteSvgPath: '/Note SVGS/Half Note.svg',
      restSymbol: '𝄼', // Half rest
      name: 'Half',
    },
    {
      duration: 'quarter',
      noteSvgPath: '/Note SVGS/Quarter Note.svg',
      restSymbol: '𝄽', // Quarter rest
      name: 'Quarter',
    },
    {
      duration: 'eighth',
      noteSvgPath: '/Note SVGS/Eigth Note.svg',
      restSymbol: '𝄾', // Eighth rest
      name: 'Eighth',
    },
    {
      duration: 'sixteenth',
      noteSvgPath: '/Note SVGS/Sixteenth Note.svg',
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
              <img 
                src={noteValue.noteSvgPath} 
                alt={`${noteValue.name} note`}
                className="note-value-button__svg"
              />
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
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteValuePalette; 