import React, { useState, useRef } from 'react';
import './SaveLoadDialog.css';
import type { RecentFile, ProjectMetadata } from '../../services/FileManager';

export interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filename: string, metadata: Partial<ProjectMetadata>) => void;
  defaultTitle?: string;
  currentMetadata?: Partial<ProjectMetadata>;
}

export interface LoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (file: File) => void;
  recentFiles: RecentFile[];
  onLoadRecent?: (file: RecentFile) => void;
}

export interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasUnsavedChanges: boolean;
}

// Save Dialog Component
export const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultTitle = 'Untitled Song',
  currentMetadata = {}
}) => {
  const [title, setTitle] = useState(currentMetadata.title || defaultTitle);
  const [artist, setArtist] = useState(currentMetadata.artist || '');
  const [composer, setComposer] = useState(currentMetadata.composer || '');
  const [description, setDescription] = useState(currentMetadata.description || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | undefined>(
    currentMetadata.difficulty
  );

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a project title');
      return;
    }

    const metadata: Partial<ProjectMetadata> = {
      title: title.trim(),
      artist: artist.trim() || undefined,
      composer: composer.trim() || undefined,
      description: description.trim() || undefined,
      difficulty
    };

    // Generate filename from title
    const filename = title
      .trim()
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    onSave(filename, metadata);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Save Project</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="form-field">
            <label htmlFor="project-title">Project Title *</label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter project title..."
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="project-artist">Artist</label>
              <input
                id="project-artist"
                type="text"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Artist name..."
              />
            </div>
            <div className="form-field">
              <label htmlFor="project-composer">Composer</label>
              <input
                id="project-composer"
                type="text"
                value={composer}
                onChange={e => setComposer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Composer name..."
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Project description..."
              rows={3}
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-difficulty">Difficulty</label>
            <select
              id="project-difficulty"
              value={difficulty || ''}
              onChange={e => setDifficulty(e.target.value as any || undefined)}
            >
              <option value="">Not specified</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-button dialog-button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="dialog-button dialog-button--primary" 
            onClick={handleSave}
            disabled={!title.trim()}
          >
            Save Project
          </button>
        </div>
      </div>
    </div>
  );
};

// Load Dialog Component
export const LoadDialog: React.FC<LoadDialogProps> = ({
  isOpen,
  onClose,
  onLoad,
  recentFiles,
  onLoadRecent
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(file);
      onClose();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecentFileClick = (file: RecentFile) => {
    if (onLoadRecent) {
      onLoadRecent(file);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content dialog-content--large" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Open Project</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="load-options">
            <div className="load-section">
              <h3>Browse for File</h3>
              <div className="file-browser">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stab"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button className="browse-button" onClick={handleBrowseClick}>
                  <span className="browse-button__icon">📁</span>
                  <span>Choose File...</span>
                </button>
                <p className="file-hint">Strumstick Tab files (.stab)</p>
              </div>
            </div>

            {recentFiles.length > 0 && (
              <div className="load-section">
                <h3>Recent Projects</h3>
                <div className="recent-files">
                  {recentFiles.map((file, index) => (
                    <div
                      key={`${file.filename}-${index}`}
                      className="recent-file"
                      onClick={() => handleRecentFileClick(file)}
                    >
                      <div className="recent-file__icon">🎵</div>
                      <div className="recent-file__info">
                        <div className="recent-file__name">{file.metadata.title || file.filename}</div>
                        <div className="recent-file__details">
                          {file.metadata.artist && <span>{file.metadata.artist}</span>}
                          <span>{formatFileSize(file.size)}</span>
                          <span>{formatDate(file.lastOpened)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-button dialog-button--secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// New Project Confirmation Dialog
export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  hasUnsavedChanges
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">New Project</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-body">
          {hasUnsavedChanges ? (
            <div className="warning-message">
              <div className="warning-icon">⚠️</div>
              <div>
                <p><strong>You have unsaved changes!</strong></p>
                <p>Creating a new project will discard your current work. Are you sure you want to continue?</p>
              </div>
            </div>
          ) : (
            <p>Create a new empty project?</p>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-button dialog-button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`dialog-button ${hasUnsavedChanges ? 'dialog-button--danger' : 'dialog-button--primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {hasUnsavedChanges ? 'Discard Changes' : 'Create New Project'}
          </button>
        </div>
      </div>
    </div>
  );
}; 