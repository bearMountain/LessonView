import React, { useState } from 'react';

interface TempoControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

const TempoControls: React.FC<TempoControlsProps> = ({
  tempo,
  onTempoChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tempo.toString());

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
    </div>
  );
};

export default TempoControls; 