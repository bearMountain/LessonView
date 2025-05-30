import React, { useState } from 'react';

interface TempoControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

interface TempoMarking {
  name: string;
  bpm: number;
  range: [number, number];
}

const TempoControls: React.FC<TempoControlsProps> = ({
  tempo,
  onTempoChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tempo.toString());

  const tempoMarkings: TempoMarking[] = [
    { name: 'Largo', bpm: 50, range: [40, 60] },
    { name: 'Adagio', bpm: 70, range: [66, 76] },
    { name: 'Andante', bpm: 90, range: [76, 108] },
    { name: 'Moderato', bpm: 115, range: [108, 120] },
    { name: 'Allegro', bpm: 140, range: [120, 168] },
    { name: 'Presto', bpm: 180, range: [168, 200] },
  ];

  const getCurrentTempoMarking = (): string => {
    const marking = tempoMarkings.find(
      (marking) => tempo >= marking.range[0] && tempo <= marking.range[1]
    );
    return marking?.name || 'Custom';
  };

  const handleTempoIncrement = (delta: number) => {
    const newTempo = Math.max(30, Math.min(400, tempo + delta));
    onTempoChange(newTempo);
  };

  const handleTempoEdit = () => {
    setIsEditing(true);
    setEditValue(tempo.toString());
  };

  const handleTempoSubmit = () => {
    const newTempo = parseInt(editValue, 10);
    if (!isNaN(newTempo) && newTempo >= 30 && newTempo <= 400) {
      onTempoChange(newTempo);
    } else {
      setEditValue(tempo.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTempoSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(tempo.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="tempo-controls">
      <span className="tempo-controls__label">Tempo:</span>
      <div className="tempo-controls__main">
        <button
          className="tempo-button tempo-button--decrement"
          onClick={() => handleTempoIncrement(-5)}
          title="Decrease tempo by 5 BPM"
        >
          <span className="tempo-button__icon">−</span>
        </button>
        
        <div className="tempo-display" onClick={handleTempoEdit}>
          {isEditing ? (
            <input
              type="number"
              className="tempo-display__input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleTempoSubmit}
              onKeyDown={handleKeyDown}
              min="30"
              max="400"
              autoFocus
            />
          ) : (
            <span className="tempo-display__value" title="Click to edit tempo">
              {tempo}
            </span>
          )}
          <span className="tempo-display__unit">BPM</span>
        </div>
        
        <button
          className="tempo-button tempo-button--increment"
          onClick={() => handleTempoIncrement(5)}
          title="Increase tempo by 5 BPM"
        >
          <span className="tempo-button__icon">+</span>
        </button>
      </div>
      
      <div className="tempo-marking">
        <span className="tempo-marking__text">{getCurrentTempoMarking()}</span>
      </div>
      
      <div className="tempo-presets">
        {tempoMarkings.map((marking) => (
          <button
            key={marking.name}
            className={`tempo-preset ${
              tempo >= marking.range[0] && tempo <= marking.range[1]
                ? 'tempo-preset--active'
                : ''
            }`}
            onClick={() => onTempoChange(marking.bpm)}
            title={`${marking.name} (${marking.bpm} BPM)`}
          >
            {marking.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TempoControls; 