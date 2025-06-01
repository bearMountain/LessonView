import React, { useState, useRef } from 'react'
import './App.css'
import TabViewer from './TabViewer'
import Fretboard from './Fretboard'
import Controls from './Controls'
import MainLayout from './components/layout/MainLayout'
import PlaybackBar from './components/transport/PlaybackBar'
import ProfessionalToolbar from './components/toolbar/ProfessionalToolbar'
import type { ControlsRef } from './Controls'
import type { Note, NoteDuration, NoteType, CursorPosition, TabData } from './types'
import { DURATION_SLOTS, addNoteToGrid, removeNoteFromGrid, getNotesAtSlot, findNextAvailableSlot, createTie, getAllTies, removeTie } from './types'

// Start with empty tab data
const initialTabData: TabData = [];

function App() {
  const [tabData, setTabData] = useState<TabData>(initialTabData);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ timeSlot: 0, stringIndex: 2 }); // Start on Hi D string
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ fret: number; stringIndex: number }[]>([]);
  const [tempo, setTempo] = useState<number>(120); // Default 120 BPM
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [showFretboard, setShowFretboard] = useState<boolean>(true);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter'); // Default note duration
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('note'); // Default to note
  const [timeSignature, setTimeSignature] = useState<string>('4/4'); // Default time signature
  const [zoom, setZoom] = useState<number>(1.0);
  const [currentPlaybackTimeSlot, setCurrentPlaybackTimeSlot] = useState<number>(-1);
  const [countInEnabled, setCountInEnabled] = useState<boolean>(false);
  const [selectedNotes, setSelectedNotes] = useState<Array<{ timeSlot: number; stringIndex: number }>>([]);
  const [firstSelectedNote, setFirstSelectedNote] = useState<{ timeSlot: number; stringIndex: number } | null>(null);
  const controlsRef = useRef<ControlsRef>(null);

  const handleAddNote = (fret: number | null, duration: NoteDuration = selectedDuration, type: NoteType = selectedNoteType) => {
    setTabData(prevTabData => {
      // Place note directly at cursor position (user controls placement)
      const startSlot = cursorPosition.timeSlot;
      
      // Create new note
      const newNote: Note = {
        type,
        fret,
        duration,
        stringIndex: cursorPosition.stringIndex,
        startSlot: startSlot
      };

      // Add note to grid (this will replace any existing note at this position)
      return addNoteToGrid(prevTabData, newNote);
    });
  };

  const handleRemoveNote = () => {
    setTabData(prevTabData => {
      // Find note at current cursor position
      const notesAtCursor = getNotesAtSlot(prevTabData, cursorPosition.timeSlot, cursorPosition.stringIndex);
      
      if (notesAtCursor.length > 0) {
        // Remove the first note found at this position
        const noteToRemove = notesAtCursor[0];
        return removeNoteFromGrid(prevTabData, noteToRemove);
      }
      
      return prevTabData; // No note to remove
    });
  };

  const moveCursor = (direction: 'left' | 'right' | 'up' | 'down') => {
    setCursorPosition(prev => {
      const newPosition = { ...prev };
      
      switch (direction) {
        case 'left':
          newPosition.timeSlot = Math.max(0, prev.timeSlot - 1);
          break;
        case 'right':
          newPosition.timeSlot = prev.timeSlot + 1; // No upper limit - grid can grow
          break;
        case 'up':
          newPosition.stringIndex = Math.min(2, prev.stringIndex + 1); // Hi D is index 2
          break;
        case 'down':
          newPosition.stringIndex = Math.max(0, prev.stringIndex - 1); // Low D is index 0
          break;
      }
      
      return newPosition;
    });
  };

  const handleNotesPlaying = (notes: { fret: number; stringIndex: number }[]) => {
    setCurrentlyPlaying(notes);
  };

  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
  };

  const handleTimeSignatureChange = (signature: string) => {
    setTimeSignature(signature);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      controlsRef.current?.stopPlayback();
      setIsPlaying(false);
    } else {
      controlsRef.current?.playTab();
      setIsPlaying(true);
    }
  };

  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
  };

  const handleFretboardToggle = () => {
    setShowFretboard(!showFretboard);
  };

  const handleCountInToggle = () => {
    setCountInEnabled(!countInEnabled);
  };

  const handleTieModeChange = (enabled: boolean) => {
    // Check if we have exactly 2 notes selected
    if (selectedNotes.length === 2) {
      // Check if these notes currently have a tie
      const [note1, note2] = selectedNotes;
      const fromSlot = Math.min(note1.timeSlot, note2.timeSlot);
      const toSlot = Math.max(note1.timeSlot, note2.timeSlot);
      
      const existingTies = getAllTies(tabData);
      const existingTie = existingTies.find(tie => 
        tie.fromSlot === fromSlot && tie.toSlot === toSlot && tie.stringIndex === note1.stringIndex
      );
      
      if (existingTie) {
        // Remove the existing tie
        setTabData(prevTabData => removeTie(prevTabData, fromSlot, toSlot, note1.stringIndex));
      } else {
        // Create a new tie
        handleCreateTie();
      }
    }
    
    // Don't change tieMode state - it's now purely visual based on selection
  };

  const handleCreateTie = () => {
    if (selectedNotes.length === 2) {
      const [note1, note2] = selectedNotes;
      
      // Ensure same string and same fret
      if (note1.stringIndex !== note2.stringIndex) {
        console.log('Cannot tie notes on different strings');
        return;
      }
      
      const notes1 = getNotesAtSlot(tabData, note1.timeSlot, note1.stringIndex);
      const notes2 = getNotesAtSlot(tabData, note2.timeSlot, note2.stringIndex);
      
      if (notes1.length === 0 || notes2.length === 0) {
        console.log('Cannot tie: one or both notes do not exist');
        return;
      }
      
      if (notes1[0].fret !== notes2[0].fret) {
        console.log('Cannot tie notes with different frets');
        return;
      }
      
      // Create the tie (from earlier to later note)
      const fromSlot = Math.min(note1.timeSlot, note2.timeSlot);
      const toSlot = Math.max(note1.timeSlot, note2.timeSlot);
      
      // Check if tie already exists
      const existingTies = getAllTies(tabData);
      const existingTie = existingTies.find(tie => 
        tie.fromSlot === fromSlot && tie.toSlot === toSlot && tie.stringIndex === note1.stringIndex
      );
      
      setTabData(prevTabData => {
        if (existingTie) {
          // Remove existing tie
          return removeTie(prevTabData, fromSlot, toSlot, note1.stringIndex);
        } else {
          // Create new tie
          return createTie(prevTabData, fromSlot, toSlot, note1.stringIndex);
        }
      });
      
      // Don't clear selection after creating/removing tie - keep notes selected
    }
  };

  // Listen for playback state changes from Controls component
  const handlePlaybackStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  // Handle play from cursor (space bar shortcut)
  const handlePlayFromCursor = () => {
    if (!isPlaying) {
      controlsRef.current?.playTab();
      setIsPlaying(true);
    }
  };

  // Handle reset cursor to start (cmd+enter shortcut) 
  const handleResetCursor = () => {
    setCursorPosition({ timeSlot: 0, stringIndex: 2 }); // Reset to start, Hi D string
  };

  // Calculate current time display (simplified for now)
  const currentTime = "0:00";
  const totalTime = tabData.length > 0 ? `0:${Math.floor(tabData.length / 16).toString().padStart(2, '0')}` : "0:00"; // 16 slots per measure

  // Calculate the current tie state based on selected notes
  const getCurrentTieState = (): boolean => {
    if (selectedNotes.length !== 2) return false;
    
    const [note1, note2] = selectedNotes;
    
    // Ensure same string
    if (note1.stringIndex !== note2.stringIndex) return false;
    
    // Check for existing tie
    const fromSlot = Math.min(note1.timeSlot, note2.timeSlot);
    const toSlot = Math.max(note1.timeSlot, note2.timeSlot);
    
    const existingTies = getAllTies(tabData);
    const existingTie = existingTies.find(tie => 
      tie.fromSlot === fromSlot && tie.toSlot === toSlot && tie.stringIndex === note1.stringIndex
    );
    
    return !!existingTie;
  };

  return (
    <MainLayout
      toolbar={
        <ProfessionalToolbar
          selectedDuration={selectedDuration}
          onDurationChange={setSelectedDuration}
          tempo={tempo}
          onTempoChange={setTempo}
          timeSignature={timeSignature}
          onTimeSignatureChange={setTimeSignature}
          selectedNoteType={selectedNoteType}
          onNoteTypeChange={setSelectedNoteType}
          tieMode={getCurrentTieState()}
          onTieModeChange={handleTieModeChange}
        />
      }
      leftSidebar={
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
            Tools
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            Note palettes and editing tools will go here
          </p>
        </div>
      }
      centerWorkspace={
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Floating zoom controls */}
          <div className="floating-zoom-controls">
            <button 
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
              title="Zoom Out (Ctrl + Mouse Wheel)"
            >
              🔍-
            </button>
            <span className="zoom-display">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              title="Zoom In (Ctrl + Mouse Wheel)"
            >
              🔍+
            </button>
            <button 
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
          
          <TabViewer 
            tabData={tabData} 
            cursorPosition={cursorPosition}
            onAddNote={handleAddNote}
            onRemoveNote={handleRemoveNote}
            onMoveCursor={moveCursor}
            onCursorClick={(timeSlot: number, stringIndex: number, shiftHeld?: boolean) => {
              setCursorPosition({ timeSlot, stringIndex });
              
              if (shiftHeld) {
                // Shift+click: handle pair selection for ties
                const noteKey = { timeSlot, stringIndex };
                const existingIndex = selectedNotes.findIndex(n => n.timeSlot === timeSlot && n.stringIndex === stringIndex);
                
                if (existingIndex >= 0) {
                  // Deselect if already selected
                  setSelectedNotes(prev => prev.filter((_, i) => i !== existingIndex));
                  setFirstSelectedNote(null);
                } else {
                  // Add to selection
                  if (firstSelectedNote) {
                    // We have a first note, create the pair
                    setSelectedNotes([firstSelectedNote, noteKey]);
                    setFirstSelectedNote(null); // Clear first selection since we now have a pair
                  } else if (selectedNotes.length === 2) {
                    // We already have a pair, replace with new pair starting from this note
                    setFirstSelectedNote(noteKey);
                    setSelectedNotes([]);
                  } else {
                    // Start new selection with this note
                    setFirstSelectedNote(noteKey);
                    setSelectedNotes([]);
                  }
                }
              } else {
                // Normal click: track as first selection (no highlights yet)
                const notes = getNotesAtSlot(tabData, timeSlot, stringIndex);
                if (notes.length > 0) {
                  // Clicked on an existing note, track it as first selection
                  setFirstSelectedNote({ timeSlot, stringIndex });
                  setSelectedNotes([]); // Clear any existing pair selection
                } else {
                  // Clicked on empty space, clear selections
                  setFirstSelectedNote(null);
                  setSelectedNotes([]);
                }
              }
            }}
            onPlayPreviewNote={(fret: number, stringIndex: number) => controlsRef.current?.playPreviewNote(fret, stringIndex)}
            selectedDuration={selectedDuration}
            onPlayFromCursor={handlePlayFromCursor}
            onTogglePlayback={handlePlayPause}
            onResetCursor={handleResetCursor}
            selectedNoteType={selectedNoteType}
            zoom={zoom}
            onZoomChange={setZoom}
            isPlaying={isPlaying}
            currentPlaybackTimeSlot={currentPlaybackTimeSlot}
            tieMode={getCurrentTieState()}
            selectedNotes={selectedNotes}
            onCreateTie={handleCreateTie}
          />
        </div>
      }
      rightSidebar={
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
            Properties
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            Note and measure properties will go here
          </p>
        </div>
      }
      fretboard={showFretboard ? (
        <div style={{ width: '100%' }}>
          <Fretboard currentlyPlaying={currentlyPlaying} />
        </div>
      ) : null}
      bottomPanel={
        <>
          {/* Professional Playback Bar */}
          <PlaybackBar
            isPlaying={isPlaying}
            tempo={tempo}
            currentTime={currentTime}
            totalTime={totalTime}
            trackTitle="Untitled"
            onPlayPause={handlePlayPause}
            onTempoChange={handleTempoChange}
            onLoopToggle={handleLoopToggle}
            onFretboardToggle={handleFretboardToggle}
            onCountInToggle={handleCountInToggle}
            isLooping={isLooping}
            showFretboard={showFretboard}
            countInEnabled={countInEnabled}
          />
          
          {/* Hidden Controls component for audio functionality */}
          <div style={{ display: 'none' }}>
            <Controls 
              ref={controlsRef}
              tabData={tabData} 
              cursorPosition={cursorPosition}
              onNotesPlaying={handleNotesPlaying}
              tempo={tempo}
              onTempoChange={handleTempoChange}
              onPlaybackStateChange={handlePlaybackStateChange}
              onCurrentTimeSlotChange={setCurrentPlaybackTimeSlot}
              countInEnabled={countInEnabled}
              timeSignature={timeSignature}
            />
          </div>
        </>
      }
    />
  )
}

export default App
