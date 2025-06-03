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
import { SaveDialog, LoadDialog, NewProjectDialog } from './components/ui/SaveLoadDialog'
import { FileManager, type AppState, type ProjectMetadata } from './services/FileManager'
import { AutoSave } from './services/AutoSave'
import type { ControlsRef } from './Controls'
import type { Note, NoteDuration, NoteType, CursorPosition, TabData } from './types'
import { addNoteToGrid, removeNoteFromGrid, getNotesAtSlot, createTie, getAllTies, removeTie, DURATION_SLOTS } from './types'

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
  
  // Add state for single note selection (for duration editing)
  const [selectedNoteForEditing, setSelectedNoteForEditing] = useState<{ timeSlot: number; stringIndex: number } | null>(null);
  
  // Video sync state
  const [videoSource, setVideoSource] = useState<string>('/videos/test-vid-1.mp4');
  const [splitRatio, setSplitRatio] = useState<number>(0.4); // 40% video, 60% tab viewer
  
  // Add state to track pause position
  const [pausedAtTimeSlot, setPausedAtTimeSlot] = useState<number>(-1);
  
  // Audio mute controls
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isSynthMuted, setIsSynthMuted] = useState<boolean>(false);
  
  // Save/Load state
  const [isModified, setIsModified] = useState<boolean>(false);
  const [currentProjectMetadata, setCurrentProjectMetadata] = useState<Partial<ProjectMetadata>>({});
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState<boolean>(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState<boolean>(false);
  
  const controlsRef = useRef<ControlsRef>(null);
  
  // File management services
  const fileManagerRef = useRef<FileManager>(new FileManager());
  const autoSaveRef = useRef<AutoSave>(new AutoSave(fileManagerRef.current));
  
  // Use sync engine
  const syncEngine = useSyncEngine();
  
  // Sync engine integration
  const isPlaying = syncEngine.state.isPlaying;

  // Initialize auto-save on mount
  useEffect(() => {
    console.log('🔄 Initializing auto-save service...');
    
    // Check for recovery data on startup
    const recoveryInfo = autoSaveRef.current.getRecoveryInfo();
    if (recoveryInfo.hasRecoveryData) {
      console.log('🔄 Recovery data found, offering to restore...');
      // TODO: Show recovery dialog
    }
    
    // Start auto-save
    autoSaveRef.current.start();
    
    return () => {
      autoSaveRef.current.stop();
    };
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    if (isModified) {
      const currentAppState: AppState = {
        tabData,
        tempo,
        timeSignature,
        cursorPosition,
        selectedDuration,
        selectedNoteType,
        zoom,
        showFretboard,
        countInEnabled,
        isLooping,
        splitRatio,
        videoSource,
        videoConfig: syncEngine.state.videoConfig || undefined,
        isSynthMuted,
        isVideoMuted
      };
      
      autoSaveRef.current.performAutoSave(currentAppState);
    }
  }, [tabData, tempo, timeSignature, isModified, selectedDuration, selectedNoteType, zoom, showFretboard, countInEnabled, isLooping, splitRatio, videoSource, isSynthMuted, isVideoMuted]);

  // Mark as modified when tab data changes
  useEffect(() => {
    if (tabData.length > 0 || currentProjectMetadata.title) {
      setIsModified(true);
      autoSaveRef.current.markDirty();
    }
  }, [tabData, tempo, timeSignature, selectedDuration, selectedNoteType, zoom, showFretboard, countInEnabled, isLooping, splitRatio]);

  // Save/Load handlers
  const handleSave = async () => {
    console.log('💾 Save button clicked');
    
    const currentAppState: AppState = {
      tabData,
      tempo,
      timeSignature,
      cursorPosition,
      selectedDuration,
      selectedNoteType,
      zoom,
      showFretboard,
      countInEnabled,
      isLooping,
      splitRatio,
      videoSource,
      videoConfig: syncEngine.state.videoConfig || undefined,
      isSynthMuted,
      isVideoMuted
    };

    const result = await fileManagerRef.current.saveProject(currentAppState, undefined, currentProjectMetadata);
    
    if (result.success) {
      console.log('✅ Project saved successfully');
      setIsModified(false);
      autoSaveRef.current.markClean();
      // TODO: Show success notification
    } else {
      console.error('❌ Save failed:', result.error);
      alert(`Failed to save project: ${result.error}`);
    }
  };

  const handleSaveAs = () => {
    console.log('💾 Save As clicked');
    setSaveDialogOpen(true);
  };

  const handleSaveDialog = async (filename: string, metadata: Partial<ProjectMetadata>) => {
    console.log('💾 Save dialog confirmed:', filename, metadata);
    
    const currentAppState: AppState = {
      tabData,
      tempo,
      timeSignature,
      cursorPosition,
      selectedDuration,
      selectedNoteType,
      zoom,
      showFretboard,
      countInEnabled,
      isLooping,
      splitRatio,
      videoSource,
      videoConfig: syncEngine.state.videoConfig || undefined,
      isSynthMuted,
      isVideoMuted
    };

    const result = await fileManagerRef.current.saveProject(currentAppState, filename, metadata);
    
    if (result.success) {
      console.log('✅ Project saved successfully');
      setCurrentProjectMetadata(metadata);
      setIsModified(false);
      autoSaveRef.current.markClean();
      // TODO: Show success notification
    } else {
      console.error('❌ Save failed:', result.error);
      alert(`Failed to save project: ${result.error}`);
    }
  };

  const handleLoad = () => {
    console.log('📂 Load button clicked');
    setLoadDialogOpen(true);
  };

  const handleLoadFile = async (file: File) => {
    console.log('📂 Loading file:', file.name);
    
    const result = await fileManagerRef.current.loadProject(file);
    
    if (result.success && result.data) {
      console.log('✅ Project loaded successfully');
      
      // Apply the loaded state
      const appState = fileManagerRef.current.deserializeState(result.data);
      
      if (appState.tabData) setTabData(appState.tabData);
      if (appState.tempo) setTempo(appState.tempo);
      if (appState.timeSignature) setTimeSignature(appState.timeSignature);
      if (appState.selectedDuration) setSelectedDuration(appState.selectedDuration);
      if (appState.selectedNoteType) setSelectedNoteType(appState.selectedNoteType);
      if (appState.zoom !== undefined) setZoom(appState.zoom);
      if (appState.showFretboard !== undefined) setShowFretboard(appState.showFretboard);
      if (appState.countInEnabled !== undefined) setCountInEnabled(appState.countInEnabled);
      if (appState.isLooping !== undefined) setIsLooping(appState.isLooping);
      if (appState.splitRatio !== undefined) setSplitRatio(appState.splitRatio);
      if (appState.videoSource) setVideoSource(appState.videoSource);
      if (appState.isSynthMuted !== undefined) setIsSynthMuted(appState.isSynthMuted);
      if (appState.isVideoMuted !== undefined) setIsVideoMuted(appState.isVideoMuted);
      
      // Update sync engine if video config exists
      if (appState.videoConfig) {
        syncEngine.setVideoConfig(appState.videoConfig);
      }
      
      // Reset cursor to beginning
      setCursorPosition({ timeSlot: 0, stringIndex: 2 });
      
      // Update project metadata
      setCurrentProjectMetadata(result.data.metadata);
      setIsModified(false);
      autoSaveRef.current.markClean();
      
      // TODO: Show success notification
    } else {
      console.error('❌ Load failed:', result.error);
      alert(`Failed to load project: ${result.error}`);
    }
  };

  const handleNew = () => {
    console.log('📄 New project button clicked');
    setNewProjectDialogOpen(true);
  };

  const handleNewProject = () => {
    console.log('📄 Creating new project');
    
    // Reset to initial state
    setTabData(initialTabData);
    setCursorPosition({ timeSlot: 0, stringIndex: 2 });
    setTempo(120);
    setTimeSignature('4/4');
    setSelectedDuration('quarter');
    setSelectedNoteType('note');
    setZoom(1.0);
    setShowFretboard(true);
    setCountInEnabled(false);
    setIsLooping(false);
    setSplitRatio(0.4);
    setVideoSource('/videos/test-vid-1.mp4');
    setIsSynthMuted(false);
    setIsVideoMuted(false);
    
    // Reset project metadata
    setCurrentProjectMetadata({});
    setIsModified(false);
    autoSaveRef.current.markClean();
    
    // Reset sync engine
    syncEngine.seekToSlot(0);
    
    console.log('✅ New project created');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              handleSaveAs();
            } else {
              handleSave();
            }
            break;
          case 'o':
            e.preventDefault();
            handleLoad();
            break;
          case 'n':
            e.preventDefault();
            handleNew();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProjectMetadata, tabData, tempo, timeSignature]);

  // Synchronize BPM changes with sync engine
  useEffect(() => {
    syncEngine.setTabBPM(tempo);
  }, [tempo, syncEngine]);

  // Synchronize time signature changes with sync engine
  useEffect(() => {
    syncEngine.setTimeSignature(timeSignature);
  }, [timeSignature, syncEngine]);

  // Set video config when component mounts or video source changes
  useEffect(() => {
    if (videoSource) {
      syncEngine.setVideoConfig({
        source: videoSource,
        recordedBPM: 120 // Default recorded BPM - could be configurable per video
      });
    }
  }, [videoSource, syncEngine]);

  // Handle play/pause button press (space bar or transport controls)
  const handlePlayPause = () => {
    console.log(`🎮 handlePlayPause called - current isPlaying: ${isPlaying}`);
    
    if (isPlaying) {
      // We're currently playing, so pause
      console.log('⏸️ Pausing playback...');
      
      // Store current position for resume
      setPausedAtTimeSlot(currentPlaybackTimeSlot);
      console.log(`📍 Storing pause position: ${currentPlaybackTimeSlot}`);
      
      // Pause sync engine first
      syncEngine.pause();
      
      // Then stop the Controls component (with clearVisualFeedback=false to preserve visual state)
      if (controlsRef.current) {
        controlsRef.current.stopPlayback(false); // false = don't clear visual feedback, just pause
      }
    } else {
      // We're currently paused/stopped, so play
      console.log('▶️ Starting playback...');
      
      // Determine where to start playback
      const startPosition = pausedAtTimeSlot >= 0 ? pausedAtTimeSlot : cursorPosition.timeSlot;
      console.log(`📍 Starting playback from position: ${startPosition} (paused: ${pausedAtTimeSlot}, cursor: ${cursorPosition.timeSlot})`);
      
      // Play sync engine first 
      syncEngine.play();
      
      // Then start the Controls component from the appropriate position
      if (controlsRef.current) {
        if (pausedAtTimeSlot >= 0) {
          // Resume from paused position
          controlsRef.current.playFromPosition(pausedAtTimeSlot);
          // Clear the paused position since we're now playing
          setPausedAtTimeSlot(-1);
        } else {
          // Start from cursor position (fresh start)
          controlsRef.current.playTab();
        }
      }
    }
  };

  // Sync play/pause with existing Controls component
  const handlePlaybackStateChange = (playing: boolean) => {
    console.log(`🔄 handlePlaybackStateChange called - Controls reports: ${playing}, current isPlaying: ${isPlaying}`);
    
    // Controls component reports playback state changes
    // Only sync if there's a real mismatch to prevent loops
    if (playing !== isPlaying) {
      console.log(`🔄 State mismatch detected - syncing states`);
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
    setPausedAtTimeSlot(-1); // Clear any paused position
    setCurrentPlaybackTimeSlot(-1); // Clear playback indicator
    syncEngine.seekToSlot(0); // Reset sync engine time as well
  };

  // Audio mute handlers
  const handleVideoMuteToggle = () => {
    setIsVideoMuted(!isVideoMuted);
  };

  const handleSynthMuteToggle = () => {
    setIsSynthMuted(!isSynthMuted);
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

  // Handle tie mode change
  const handleTieModeChange = (enabled: boolean) => {
    if (!enabled) {
      // Clear selection when turning off tie mode
      setSelectedNotes([]);
      setFirstSelectedNote(null);
    }
  };

  // Change note duration and shift subsequent notes
  const changeNoteDuration = (timeSlot: number, stringIndex: number, newDuration: NoteDuration) => {
    // Find the note at the specified position
    const notesAtPosition = getNotesAtSlot(tabData, timeSlot, stringIndex);
    if (notesAtPosition.length === 0) return;
    
    const noteToChange = notesAtPosition[0];
    const oldDuration = noteToChange.duration;
    const oldSlots = DURATION_SLOTS[oldDuration];
    const newSlots = DURATION_SLOTS[newDuration];
    const slotDifference = newSlots - oldSlots;
    
    // If no change needed, return
    if (slotDifference === 0) return;
    
    // Create new tab data
    let newTabData = [...tabData];
    
    // Remove the old note
    newTabData = removeNoteFromGrid(newTabData, noteToChange);
    
    // Create updated note with new duration
    const updatedNote: Note = {
      ...noteToChange,
      duration: newDuration
    };
    
    // If expanding the note (positive slotDifference), shift all subsequent notes forward
    if (slotDifference > 0) {
      // Collect all notes that start after this note's current end position
      const noteEndSlot = timeSlot + oldSlots;
      const notesToShift: Array<{ note: Note; oldSlot: number }> = [];
      
      // Find all notes that need to be shifted
      for (let slot = noteEndSlot; slot < newTabData.length; slot++) {
        if (newTabData[slot] && newTabData[slot].notes) {
          for (const note of newTabData[slot].notes) {
            if (note.startSlot === slot) { // Only shift notes that actually start at this slot
              notesToShift.push({ note, oldSlot: slot });
            }
          }
        }
      }
      
      // Remove all notes that need to be shifted
      for (const { note } of notesToShift) {
        newTabData = removeNoteFromGrid(newTabData, note);
      }
      
      // Add them back at their new positions
      for (const { note } of notesToShift) {
        const shiftedNote: Note = {
          ...note,
          startSlot: note.startSlot + slotDifference
        };
        newTabData = addNoteToGrid(newTabData, shiftedNote);
      }
    }
    
    // If shrinking the note (negative slotDifference), shift all subsequent notes backward
    else if (slotDifference < 0) {
      // Collect all notes that start after this note's new end position
      const newNoteEndSlot = timeSlot + newSlots;
      const notesToShift: Array<{ note: Note; oldSlot: number }> = [];
      
      // Find all notes that need to be shifted
      for (let slot = newNoteEndSlot; slot < newTabData.length; slot++) {
        if (newTabData[slot] && newTabData[slot].notes) {
          for (const note of newTabData[slot].notes) {
            if (note.startSlot === slot) { // Only shift notes that actually start at this slot
              notesToShift.push({ note, oldSlot: slot });
            }
          }
        }
      }
      
      // Remove all notes that need to be shifted
      for (const { note } of notesToShift) {
        newTabData = removeNoteFromGrid(newTabData, note);
      }
      
      // Add them back at their new positions (shifted backward)
      for (const { note } of notesToShift) {
        const newSlot = Math.max(newNoteEndSlot, note.startSlot + slotDifference);
        const shiftedNote: Note = {
          ...note,
          startSlot: newSlot
        };
        newTabData = addNoteToGrid(newTabData, shiftedNote);
      }
    }
    
    // Add the updated note
    newTabData = addNoteToGrid(newTabData, updatedNote);
    
    // Update the tab data
    setTabData(newTabData);
    
    // Clear the selected note since we've made the change
    setSelectedNoteForEditing(null);
  };

  // Handle duration change from toolbar
  const handleDurationChange = (newDuration: NoteDuration) => {
    // If we have a note selected for editing, change its duration
    if (selectedNoteForEditing) {
      changeNoteDuration(selectedNoteForEditing.timeSlot, selectedNoteForEditing.stringIndex, newDuration);
    } else {
      // Otherwise, just update the default duration for new notes
      setSelectedDuration(newDuration);
    }
  };

  // Add a note at the current cursor position with selected duration
  const addNote = (fret: number | null, duration?: NoteDuration, type?: 'note' | 'rest') => {
    const noteDuration = duration || selectedDuration;
    const noteType = type || selectedNoteType;
    
    const newNote: Note = {
      type: noteType,
      fret,
      duration: noteDuration,
      stringIndex: cursorPosition.stringIndex,
      startSlot: cursorPosition.timeSlot,
    };

    setTabData(prevData => addNoteToGrid(prevData, newNote));
  };

  // Remove note at current cursor position
  const removeNote = () => {
    const notesToRemove = getNotesAtSlot(tabData, cursorPosition.timeSlot, cursorPosition.stringIndex);
    
    if (notesToRemove.length > 0) {
      let newTabData = tabData;
      notesToRemove.forEach(note => {
        newTabData = removeNoteFromGrid(newTabData, note);
      });
      setTabData(newTabData);
    }
  };

  // Move cursor
  const moveCursor = (direction: 'left' | 'right' | 'up' | 'down') => {
    setCursorPosition(prev => {
      let newTimeSlot = prev.timeSlot;
      let newStringIndex = prev.stringIndex;

      switch (direction) {
        case 'left':
          newTimeSlot = Math.max(0, prev.timeSlot - 1);
          break;
        case 'right':
          newTimeSlot = prev.timeSlot + 1;
          break;
        case 'up':
          newStringIndex = Math.min(2, prev.stringIndex + 1); // Max Hi D (index 2)
          break;
        case 'down':
          newStringIndex = Math.max(0, prev.stringIndex - 1); // Min Low D (index 0)
          break;
      }

      return { timeSlot: newTimeSlot, stringIndex: newStringIndex };
    });
    
    // Clear selected note for editing when moving cursor manually
    setSelectedNoteForEditing(null);
  };

  // Handle cursor click (for manual positioning)
  const handleCursorClick = (timeSlot: number, stringIndex: number, shiftHeld?: boolean) => {
    // Check if we're in tie mode (when we have selected notes)
    const inTieMode = selectedNotes.length > 0;
    
    if (inTieMode && shiftHeld) {
      // Multi-select for tie creation
      const newSelection = { timeSlot, stringIndex };
      
      // Check if this position is already selected
      const alreadySelected = selectedNotes.some(note => 
        note.timeSlot === timeSlot && note.stringIndex === stringIndex
      );
      
      if (alreadySelected) {
        // Deselect
        setSelectedNotes(prev => prev.filter(note => 
          !(note.timeSlot === timeSlot && note.stringIndex === stringIndex)
        ));
        
        // Clear first note if we're deselecting it
        if (firstSelectedNote?.timeSlot === timeSlot && firstSelectedNote?.stringIndex === stringIndex) {
          setFirstSelectedNote(null);
        }
      } else {
        // Select (limit to 2 for tie creation)
        if (selectedNotes.length < 2) {
          setSelectedNotes(prev => [...prev, newSelection]);
          
          // Set as first note if none selected yet
          if (!firstSelectedNote) {
            setFirstSelectedNote(newSelection);
          }
        }
      }
    } else {
      // Normal cursor movement - clear any tie selection and paused state
      setCursorPosition({ timeSlot, stringIndex });
      setSelectedNotes([]);
      setFirstSelectedNote(null);
      
      // Check if we clicked on an existing note to select it for editing
      const notesAtPosition = getNotesAtSlot(tabData, timeSlot, stringIndex);
      if (notesAtPosition.length > 0) {
        // Select this note for duration editing
        setSelectedNoteForEditing({ timeSlot, stringIndex });
      } else {
        // Clear selection if clicking on empty space
        setSelectedNoteForEditing(null);
      }
      
      // Clear paused state and playback indicator when manually moving cursor
      setPausedAtTimeSlot(-1);
      setCurrentPlaybackTimeSlot(-1);
      
      // Update sync engine to new position
      syncEngine.seekToSlot(timeSlot);
    }
  };

  // Handle tie creation
  const handleCreateTie = () => {
    if (selectedNotes.length === 2) {
      const [note1, note2] = selectedNotes;
      
      // Ensure same string
      if (note1.stringIndex !== note2.stringIndex) {
        alert('Ties can only be created between notes on the same string');
        return;
      }
      
      const fromSlot = Math.min(note1.timeSlot, note2.timeSlot);
      const toSlot = Math.max(note1.timeSlot, note2.timeSlot);
      
      // Check if tie already exists
      const currentTieState = getCurrentTieState();
      
      if (currentTieState) {
        // Remove existing tie
        setTabData(prevData => removeTie(prevData, fromSlot, toSlot, note1.stringIndex));
      } else {
        // Create new tie
        setTabData(prevData => createTie(prevData, fromSlot, toSlot, note1.stringIndex));
      }
      
      // Clear selection after tie operation
      setSelectedNotes([]);
      setFirstSelectedNote(null);
    }
  };

  // Handle preview note (when hovering over fretboard)
  const handlePlayPreviewNote = (fret: number, stringIndex: number) => {
    if (controlsRef.current) {
      controlsRef.current.playPreviewNote(fret, stringIndex);
    }
  };

  // Update the currently playing notes (visual feedback)
  const handleNotesPlaying = (notes: { fret: number; stringIndex: number }[]) => {
    setCurrentlyPlaying(notes);
  };

  // Handle when playback naturally completes
  const handlePlaybackComplete = () => {
    console.log('🏁 Playback completed naturally');
    setPausedAtTimeSlot(-1); // Clear any paused position since playback ended
  };

  // Handle current time slot change (playback indicator)
  const handleCurrentTimeSlotChange = (timeSlot: number) => {
    setCurrentPlaybackTimeSlot(timeSlot);
    // Update sync engine position when Controls updates
    if (timeSlot >= 0) {
      syncEngine.updatePosition(timeSlot);
    }
  };

  return (
    <div className="app">
      <MainLayout 
        toolbar={
          <ProfessionalToolbar
            selectedDuration={selectedDuration}
            onDurationChange={handleDurationChange}
            selectedNoteType={selectedNoteType}
            onNoteTypeChange={setSelectedNoteType}
            tempo={tempo}
            onTempoChange={setTempo}
            timeSignature={timeSignature}
            onTimeSignatureChange={setTimeSignature}
            tieMode={selectedNotes.length > 0}
            onTieModeChange={handleTieModeChange}
            // Save/Load handlers
            onSave={handleSave}
            onLoad={handleLoad}
            onNew={handleNew}
            onSaveAs={handleSaveAs}
            isModified={isModified}
          />
        }
        fretboard={
          showFretboard ? (
            <Fretboard
              currentlyPlaying={currentlyPlaying}
            />
          ) : undefined
        }
        bottomPanel={
          <PlaybackBar
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={currentTime}
            totalTime={totalTime}
            tempo={tempo}
            trackTitle={currentProjectMetadata.title || 'Untitled Song'}
            onTempoChange={setTempo}
            onLoopToggle={() => setIsLooping(!isLooping)}
            onFretboardToggle={() => setShowFretboard(!showFretboard)}
            onCountInToggle={() => setCountInEnabled(!countInEnabled)}
            isLooping={isLooping}
            showFretboard={showFretboard}
            countInEnabled={countInEnabled}
          />
        }
        centerWorkspace={
          <SplitPane
            defaultSplitRatio={splitRatio}
            onSplitChange={setSplitRatio}
            orientation="horizontal"
          >
            {[
              <VideoPlayer
                source={videoSource}
                isPlaying={isPlaying}
                currentTime={syncEngine.state.currentPosition.seconds}
                playbackRate={syncEngine.getVideoPlaybackRate()}
                onMuteToggle={handleVideoMuteToggle}
                isMuted={isVideoMuted}
              />,
              <div className="tab-editor-pane">
                <TabViewer
                  tabData={tabData}
                  cursorPosition={cursorPosition}
                  onAddNote={addNote}
                  onRemoveNote={removeNote}
                  onMoveCursor={moveCursor}
                  onCursorClick={handleCursorClick}
                  onPlayPreviewNote={handlePlayPreviewNote}
                  selectedDuration={selectedDuration}
                  selectedNoteType={selectedNoteType}
                  onTogglePlayback={handlePlayPause}
                  onResetCursor={handleResetCursor}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  isPlaying={isPlaying}
                  currentPlaybackTimeSlot={currentPlaybackTimeSlot}
                  selectedNotes={selectedNotes}
                  onCreateTie={handleCreateTie}
                  isSynthMuted={isSynthMuted}
                  onSynthMuteToggle={handleSynthMuteToggle}
                  selectedNoteForEditing={selectedNoteForEditing}
                />
                
                <Controls
                  ref={controlsRef}
                  tabData={tabData}
                  cursorPosition={cursorPosition}
                  onNotesPlaying={handleNotesPlaying}
                  tempo={tempo}
                  onPlaybackStateChange={handlePlaybackStateChange}
                  onCurrentTimeSlotChange={handleCurrentTimeSlotChange}
                  onPlaybackComplete={handlePlaybackComplete}
                  countInEnabled={countInEnabled}
                  timeSignature={timeSignature}
                  isMuted={isSynthMuted}
                />
              </div>
            ]}
          </SplitPane>
        }
      />

      {/* Save/Load Dialogs */}
      <SaveDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveDialog}
        currentMetadata={currentProjectMetadata}
      />
      
      <LoadDialog
        isOpen={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        onLoad={handleLoadFile}
        recentFiles={fileManagerRef.current.getRecentFiles()}
      />
      
      <NewProjectDialog
        isOpen={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onConfirm={handleNewProject}
        hasUnsavedChanges={isModified}
      />
    </div>
  );
}

function App() {
  return (
    <SyncEngineProvider>
      <AppContent />
    </SyncEngineProvider>
  );
}

export default App
