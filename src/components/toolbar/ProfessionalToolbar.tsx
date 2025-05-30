import React from 'react';
import './ProfessionalToolbar.css';
import NoteValuePalette from './NoteValuePalette';
import TimeSignatureSelector from './TimeSignatureSelector';
import TempoControls from './TempoControls';
import type { NoteDuration, NoteType } from '../../types';

interface ProfessionalToolbarProps {
  selectedDuration: NoteDuration;
  onDurationChange: (duration: NoteDuration) => void;
  selectedNoteType: NoteType;
  onNoteTypeChange: (type: NoteType) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  timeSignature: string;
  onTimeSignatureChange: (signature: string) => void;
}

interface ToolbarSection {
  id: string;
  title: string;
  component: React.ReactNode;
}

const ProfessionalToolbar: React.FC<ProfessionalToolbarProps> = ({
  selectedDuration,
  onDurationChange,
  selectedNoteType,
  onNoteTypeChange,
  tempo,
  onTempoChange,
  timeSignature,
  onTimeSignatureChange,
}) => {
  const sections: ToolbarSection[] = [
    {
      id: 'file',
      title: 'File',
      component: (
        <div className="toolbar-section__content">
          <button className="toolbar-button" title="New (Ctrl+N)">
            <span className="toolbar-button__icon">📄</span>
            <span className="toolbar-button__text">New</span>
          </button>
          <button className="toolbar-button" title="Open (Ctrl+O)">
            <span className="toolbar-button__icon">📁</span>
            <span className="toolbar-button__text">Open</span>
          </button>
          <button className="toolbar-button" title="Save (Ctrl+S)">
            <span className="toolbar-button__icon">💾</span>
            <span className="toolbar-button__text">Save</span>
          </button>
        </div>
      ),
    },
    {
      id: 'edit',
      title: 'Edit',
      component: (
        <div className="toolbar-section__content">
          <button className="toolbar-button" title="Undo (Ctrl+Z)">
            <span className="toolbar-button__icon">↶</span>
            <span className="toolbar-button__text">Undo</span>
          </button>
          <button className="toolbar-button" title="Redo (Ctrl+Y)">
            <span className="toolbar-button__icon">↷</span>
            <span className="toolbar-button__text">Redo</span>
          </button>
          <div className="toolbar-separator" />
          <button className="toolbar-button" title="Cut (Ctrl+X)">
            <span className="toolbar-button__icon">✂️</span>
            <span className="toolbar-button__text">Cut</span>
          </button>
          <button className="toolbar-button" title="Copy (Ctrl+C)">
            <span className="toolbar-button__icon">📋</span>
            <span className="toolbar-button__text">Copy</span>
          </button>
          <button className="toolbar-button" title="Paste (Ctrl+V)">
            <span className="toolbar-button__icon">📄</span>
            <span className="toolbar-button__text">Paste</span>
          </button>
        </div>
      ),
    },
    {
      id: 'notes',
      title: 'Notes',
      component: (
        <div className="toolbar-section__content">
          <NoteValuePalette
            selectedDuration={selectedDuration}
            onDurationChange={onDurationChange}
            selectedNoteType={selectedNoteType}
            onNoteTypeChange={onNoteTypeChange}
          />
        </div>
      ),
    },
    {
      id: 'time',
      title: 'Time',
      component: (
        <div className="toolbar-section__content">
          <TimeSignatureSelector
            value={timeSignature}
            onChange={onTimeSignatureChange}
          />
          <div className="toolbar-separator" />
          <TempoControls
            tempo={tempo}
            onTempoChange={onTempoChange}
          />
        </div>
      ),
    },
    {
      id: 'layout',
      title: 'Layout',
      component: (
        <div className="toolbar-section__content">
          <button className="toolbar-button" title="Zoom In (Ctrl++)">
            <span className="toolbar-button__icon">🔍</span>
            <span className="toolbar-button__text">Zoom In</span>
          </button>
          <button className="toolbar-button" title="Zoom Out (Ctrl+-)">
            <span className="toolbar-button__icon">🔍</span>
            <span className="toolbar-button__text">Zoom Out</span>
          </button>
          <button className="toolbar-button" title="Fit Width">
            <span className="toolbar-button__icon">↔️</span>
            <span className="toolbar-button__text">Fit Width</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="professional-toolbar">
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <div className="toolbar-section">
            <div className="toolbar-section__header">
              <span className="toolbar-section__title">{section.title}</span>
            </div>
            {section.component}
          </div>
          {index < sections.length - 1 && <div className="toolbar-section-separator" />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProfessionalToolbar; 