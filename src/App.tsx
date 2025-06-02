import { useState, useRef, useEffect } from 'react'
import './App.css'
import TabViewer from './TabViewer'
import Fretboard from './Fretboard'
import Controls from './Controls'
import MainLayout from './components/layout/MainLayout'
import PlaybackBar from './components/transport/PlaybackBar'
import ProfessionalToolbar from './components/toolbar/ProfessionalToolbar'
import VideoPlayer from './components/video/VideoPlayer'
import SplitPane from './components/layout/SplitPane'
import { SyncEngineProvider, useSyncEngine } from './components/sync/SyncEngine'
import type { ControlsRef } from './Controls'
import type { Note, NoteDuration, NoteType, CursorPosition, TabData } from './types'
import { addNoteToGrid, removeNoteFromGrid, getNotesAtSlot, createTie, getAllTies, removeTie } from './types'

// Start with empty tab data
const initialTabData: TabData = [];

// Main App Content Component (needs to be inside SyncEngineProvider)
function AppContent() {
  const [tabData, setTabData] = useState<TabData>(initialTabData);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ timeSlot: 0, stringIndex: 2 }); // Start on Hi D string
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ fret: number; stringIndex: number }[]>([]);
  const [tempo, setTempo] = useState<number>(120); // Default 120 BPM
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
  
  // Video sync state
  const [videoSource, setVideoSource] = useState<string>('/videos/test-vid-1.MP4');
  const [splitRatio, setSplitRatio] = useState<number>(0.4); // 40% video, 60% tab viewer
  
  const controlsRef = useRef<ControlsRef>(null);
  
  // Use sync engine
  const syncEngine = useSyncEngine();
  
  // Sync engine integration
  const isPlaying = syncEngine.state.isPlaying;
  const currentVideoTime = syncEngine.state.currentPosition.seconds;
  const videoPlaybackRate = syncEngine.getVideoPlaybackRate();

  // Initialize video config
  useEffect(() => {
    syncEngine.setVideoConfig({
      source: videoSource,
      recordedBPM: 120, // TODO: Make this configurable per video
    });
    syncEngine.setTabBPM(tempo);
    syncEngine.setTimeSignature(timeSignature);
  }, [videoSource, syncEngine]);

  // Sync tempo changes
  useEffect(() => {
    syncEngine.setTabBPM(tempo);
  }, [tempo, syncEngine]);

  // Sync time signature changes
  useEffect(() => {
    syncEngine.setTimeSignature(timeSignature);
  }, [timeSignature, syncEngine]);

  // Sync current playback position from Controls component
  useEffect(() => {
    if (currentPlaybackTimeSlot >= 0) {
      syncEngine.updatePosition(currentPlaybackTimeSlot);
    }
  }, [currentPlaybackTimeSlot, syncEngine]);

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
    // Sync engine will automatically recalculate video playback rate
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause both tab and video at current positions
      controlsRef.current?.stopPlayback();
      syncEngine.pause();
    } else {
      // Resume both from current sync position
      // Note: Controls component will handle starting from current position
      controlsRef.current?.playTab();
      syncEngine.play();
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

  const handleTieModeChange = () => {
    // Removed unused parameter - function not currently used
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

  // Video event handlers
  const handleVideoTimeUpdate = (time: number) => {
    // Video reports its time updates during playback
    // We don't need to update sync engine as it's handling this
  };

  const handleVideoDurationChange = (duration: number) => {
    // Video duration loaded - could be used for validation
    console.log('Video duration:', duration);
  };

  const handleVideoPlayStateChange = (playing: boolean) => {
    // Video player reports state changes - for error handling
    if (playing !== isPlaying) {
      console.log('Video/sync state mismatch - video:', playing, 'sync:', isPlaying);
    }
  };

  // Handle cursor clicks - this should seek both video and tab
  const handleCursorClick = (timeSlot: number, stringIndex: number, shiftHeld?: boolean) => {
    setCursorPosition({ timeSlot, stringIndex });
    
    // Seek sync engine to this position (will update video)
    syncEngine.seekToSlot(timeSlot);
    
    // If currently playing, restart playback from new position
    if (isPlaying) {
      controlsRef.current?.stopPlayback();
      controlsRef.current?.playTab();
    }
    
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
  };

  // Sync play/pause with existing Controls component
  const handlePlaybackStateChange = (playing: boolean) => {
    // Controls component reports playback state changes
    if (playing !== isPlaying) {
      if (playing) {
        syncEngine.play();
      } else {
        syncEngine.pause();
      }
    }
  };

  // Handle reset cursor to start (cmd+enter shortcut) 
  const handleResetCursor = () => {
    setCursorPosition({ timeSlot: 0, stringIndex: 2 }); // Reset to start, Hi D string
    syncEngine.seekToSlot(0); // Reset sync engine time as well
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
      centerWorkspace={
        <SplitPane
          defaultSplitRatio={splitRatio}
          minPaneSize={200}
          orientation="horizontal"
          onSplitChange={setSplitRatio}
        >
          <VideoPlayer
            source={videoSource}
            currentTime={currentVideoTime}
            isPlaying={isPlaying}
            playbackRate={videoPlaybackRate}
            onTimeUpdate={handleVideoTimeUpdate}
            onDurationChange={handleVideoDurationChange}
            onPlayStateChange={handleVideoPlayStateChange}
          />
          <div style={{ position: 'relative', width: '100%', height: '100%', padding: '24px' }}>
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
              onCursorClick={handleCursorClick}
              onPlayPreviewNote={(fret: number, stringIndex: number) => controlsRef.current?.playPreviewNote(fret, stringIndex)}
              selectedDuration={selectedDuration}
              onTogglePlayback={handlePlayPause}
              onResetCursor={handleResetCursor}
              selectedNoteType={selectedNoteType}
              zoom={zoom}
              onZoomChange={setZoom}
              isPlaying={isPlaying}
              currentPlaybackTimeSlot={currentPlaybackTimeSlot}
              selectedNotes={selectedNotes}
              onCreateTie={handleCreateTie}
            />
          </div>
        </SplitPane>
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

// Main App component with SyncEngineProvider
function App() {
  return (
    <SyncEngineProvider>
      <AppContent />
    </SyncEngineProvider>
  );
}

export default App
