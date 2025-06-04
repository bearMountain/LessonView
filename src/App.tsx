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
import type { Note } from './types'
import { convertNotesToTabData, convertTabDataToNotes } from './state/stateHelpers'

// Import our custom hooks - this is where the magic happens!
import { 
  useTabEditor, 
  useNoteInput, 
  useNavigation, 
  usePlayback,
  type TabEditorAPI 
} from './hooks'

// Main App Content Component (needs to be inside SyncEngineProvider)
function AppContent() {
  // === Core State Management Hook ===
  // This single hook replaces 20+ useState calls and manages all state through our unified reducer
  const tabEditor = useTabEditor()
  
  // === Feature Hooks ===
  // Input handling with keyboard events and fret validation
  const noteInput = useNoteInput(tabEditor, { 
    enabled: !tabEditor.state.isPlaying 
  })
  
  // Navigation and mouse interactions
  const navigation = useNavigation(tabEditor, { 
    enabled: true 
  })
  
  // Audio playback with effects chain
  const playback = usePlayback(tabEditor, { 
    enabled: true, 
    enableEffects: true 
  })
  
  // === Integration with Legacy Services ===
  // File management services (to be migrated to hooks in later phases)
  const fileManagerRef = useRef<FileManager>(new FileManager())
  const autoSaveRef = useRef<AutoSave>(new AutoSave(fileManagerRef.current))
  const controlsRef = useRef<ControlsRef>(null)
  
  // === Sync Engine Integration ===
  const syncEngine = useSyncEngine()
  
  // === Derived State for Legacy Components ===
  // Convert our flat notes array back to TabData format for components that haven't been refactored yet
  const legacyTabData = convertNotesToTabData(tabEditor.state.notes)
  
  // Get note at current position for legacy components
  const getNoteAtCurrentPosition = (): Note | null => {
    return tabEditor.state.notes.find(note => 
      note.startSlot === tabEditor.state.cursor.timeSlot && 
      note.stringIndex === tabEditor.state.cursor.stringIndex
    ) || null
  }
  
  // === Auto-Save Integration ===
  useEffect(() => {
    console.log('🔄 Initializing auto-save service...')
    
    // Check for recovery data on startup
    const recoveryInfo = autoSaveRef.current.getRecoveryInfo()
    if (recoveryInfo.hasRecoveryData) {
      console.log('🔄 Recovery data found, offering to restore...')
      // TODO: Show recovery dialog
    }
    
    // Start auto-save
    autoSaveRef.current.start()
    
    return () => {
      autoSaveRef.current.stop()
    }
  }, [])

  // Auto-save on state changes
  useEffect(() => {
    // Skip auto-save on initial load when everything is default
    if (tabEditor.state.notes.length === 0 && tabEditor.state.tempo === 120 && !tabEditor.state.currentProjectMetadata.title) {
      return
    }
    
    // Mark as modified and perform auto-save
    tabEditor.setModified(true)
    autoSaveRef.current.markDirty()
    
    // Convert our unified state to legacy AppState format for file manager
    const currentAppState: AppState = {
      tabData: legacyTabData,
      tempo: tabEditor.state.tempo,
      timeSignature: `${tabEditor.state.timeSignature[0]}/${tabEditor.state.timeSignature[1]}`,
      cursorPosition: tabEditor.state.cursor,
      selectedDuration: tabEditor.state.selectedDuration,
      selectedNoteType: tabEditor.state.selectedNoteType,
      customMeasureLines: tabEditor.state.customMeasureLines,
      zoom: tabEditor.state.zoom,
      showFretboard: tabEditor.state.showFretboard,
      countInEnabled: tabEditor.state.countIn,
      isLooping: tabEditor.state.isLooping,
      splitRatio: tabEditor.state.splitRatio,
      videoSource: tabEditor.state.videoSource,
      isSynthMuted: tabEditor.state.isSynthMuted,
      isVideoMuted: tabEditor.state.isVideoMuted
    }
    
    autoSaveRef.current.performAutoSave(currentAppState)
  }, [tabEditor.state, legacyTabData])

  // === Save/Load Event Handlers ===
  const handleSave = async () => {
    console.log('💾 Save button clicked')
    
    const currentAppState: AppState = {
      tabData: legacyTabData,
      tempo: tabEditor.state.tempo,
      timeSignature: `${tabEditor.state.timeSignature[0]}/${tabEditor.state.timeSignature[1]}`,
      cursorPosition: tabEditor.state.cursor,
      selectedDuration: tabEditor.state.selectedDuration,
      selectedNoteType: tabEditor.state.selectedNoteType,
      customMeasureLines: tabEditor.state.customMeasureLines,
      zoom: tabEditor.state.zoom,
      showFretboard: tabEditor.state.showFretboard,
      countInEnabled: tabEditor.state.countIn,
      isLooping: tabEditor.state.isLooping,
      splitRatio: tabEditor.state.splitRatio,
      videoSource: tabEditor.state.videoSource,
      isSynthMuted: tabEditor.state.isSynthMuted,
      isVideoMuted: tabEditor.state.isVideoMuted
    }

    const result = await fileManagerRef.current.saveProject(currentAppState, undefined, tabEditor.state.currentProjectMetadata)
    
    if (result.success) {
      console.log('✅ Project saved successfully')
      tabEditor.setModified(false)
      autoSaveRef.current.markClean()
    } else {
      console.error('❌ Save failed:', result.error)
      alert(`Failed to save project: ${result.error}`)
    }
  }

  const handleSaveAs = () => {
    console.log('💾 Save As clicked')
    tabEditor.toggleSaveDialog()
  }

  const handleSaveDialog = async (filename: string, metadata: Partial<ProjectMetadata>) => {
    console.log('💾 Save dialog confirmed:', filename, metadata)
    
    const currentAppState: AppState = {
      tabData: legacyTabData,
      tempo: tabEditor.state.tempo,
      timeSignature: `${tabEditor.state.timeSignature[0]}/${tabEditor.state.timeSignature[1]}`,
      cursorPosition: tabEditor.state.cursor,
      selectedDuration: tabEditor.state.selectedDuration,
      selectedNoteType: tabEditor.state.selectedNoteType,
      customMeasureLines: tabEditor.state.customMeasureLines,
      zoom: tabEditor.state.zoom,
      showFretboard: tabEditor.state.showFretboard,
      countInEnabled: tabEditor.state.countIn,
      isLooping: tabEditor.state.isLooping,
      splitRatio: tabEditor.state.splitRatio,
      videoSource: tabEditor.state.videoSource,
      isSynthMuted: tabEditor.state.isSynthMuted,
      isVideoMuted: tabEditor.state.isVideoMuted
    }

    const result = await fileManagerRef.current.saveProject(currentAppState, filename, metadata)
    
    if (result.success) {
      console.log('✅ Project saved successfully')
      tabEditor.setModified(false)
      tabEditor.setProjectMetadata(metadata)
      autoSaveRef.current.markClean()
      tabEditor.toggleSaveDialog()
    } else {
      console.error('❌ Save failed:', result.error)
      alert(`Failed to save project: ${result.error}`)
    }
  }

  const handleLoad = () => {
    console.log('📂 Load button clicked')
    tabEditor.toggleLoadDialog()
  }

  const handleLoadFile = async (file: File) => {
    console.log('📂 Loading file:', file.name)
    
    const result = await fileManagerRef.current.loadProject(file)
    
    if (result.success && result.data) {
      console.log('✅ Project loaded successfully')
      
      // Convert legacy TabData to our new notes format using the FileManager's deserialize method
      const legacyAppState = fileManagerRef.current.deserializeState(result.data)
      const notes = convertTabDataToNotes(legacyAppState.tabData || [])
      
      // Parse time signature string back to tuple
      const timeSignatureParts = (legacyAppState.timeSignature || '4/4').split('/')
      const timeSignature: [number, number] = [
        parseInt(timeSignatureParts[0]) || 4,
        parseInt(timeSignatureParts[1]) || 4
      ]
      
      // Load the project state using our unified state management
      tabEditor.loadProjectState({
        notes,
        tempo: legacyAppState.tempo || 120,
        timeSignature,
        cursor: legacyAppState.cursorPosition || { timeSlot: 0, stringIndex: 2 },
        selectedDuration: legacyAppState.selectedDuration || 'quarter',
        selectedNoteType: legacyAppState.selectedNoteType || 'note',
        customMeasureLines: legacyAppState.customMeasureLines || [],
        zoom: legacyAppState.zoom || 1.0,
        showFretboard: legacyAppState.showFretboard ?? true,
        countIn: legacyAppState.countInEnabled ?? false,
        isLooping: legacyAppState.isLooping ?? false,
        splitRatio: legacyAppState.splitRatio || 0.4,
        videoSource: legacyAppState.videoSource || '/videos/test-vid-1.mp4',
        isSynthMuted: legacyAppState.isSynthMuted ?? false,
        isVideoMuted: legacyAppState.isVideoMuted ?? false,
        currentProjectMetadata: result.data.metadata
      })
      
      tabEditor.toggleLoadDialog()
      autoSaveRef.current.markClean()
    } else {
      console.error('❌ Load failed:', result.error)
      alert(`Failed to load project: ${result.error}`)
    }
  }

  const handleNew = () => {
    console.log('📄 New project button clicked')
    tabEditor.toggleNewProjectDialog()
  }

  const handleNewProject = () => {
    console.log('📄 Creating new project')
    tabEditor.resetToInitialState()
    tabEditor.toggleNewProjectDialog()
    autoSaveRef.current.markClean()
  }

  // === Sync Engine Integration Handlers ===
  const handlePlayPause = () => {
    if (tabEditor.state.isPlaying) {
      syncEngine.pause()
      playback.stop()
    } else {
      syncEngine.play()
      playback.play()
    }
  }

  const handlePlaybackStateChange = (playing: boolean) => {
    if (playing !== tabEditor.state.isPlaying) {
      if (playing) {
        tabEditor.startPlayback()
      } else {
        tabEditor.stopPlayback()
      }
    }
  }

  // === Legacy Component Bridge Functions ===
  // These adapters allow legacy components to work with our new state management
  const handlePositionClick = (timeSlot: number, stringIndex: number, shiftHeld?: boolean, clickedOnMeasureLine?: boolean) => {
    if (clickedOnMeasureLine && tabEditor.state.currentToolMode === 'measureLine') {
      tabEditor.addMeasureLine(timeSlot)
    } else {
      navigation.setCursorPosition({ timeSlot, stringIndex })
      
      if (shiftHeld) {
        // Handle selection logic
        const noteIndex = tabEditor.state.notes.findIndex(note => 
          note.startSlot === timeSlot && note.stringIndex === stringIndex
        )
        if (noteIndex >= 0) {
          tabEditor.toggleNoteSelection(noteIndex, true)
        }
      }
    }
  }

  const movePosition = (direction: 'left' | 'right' | 'up' | 'down') => {
    tabEditor.moveCursor(direction)
  }

  const addNote = (fret: number | null, duration?: string, type?: 'note' | 'rest') => {
    noteInput.createNoteAtCursor(fret, duration as any, type)
    tabEditor.moveCursor('right')
  }

  const removeNote = () => {
    const noteIndex = tabEditor.state.notes.findIndex(note => 
      note.startSlot === tabEditor.state.cursor.timeSlot && 
      note.stringIndex === tabEditor.state.cursor.stringIndex
    )
    if (noteIndex >= 0) {
      tabEditor.removeNote(noteIndex)
    }
  }

  return (
    <div className="app">
      <MainLayout 
        toolbar={
          <ProfessionalToolbar
            selectedDuration={tabEditor.state.selectedDuration}
            onDurationChange={tabEditor.setSelectedDuration}
            selectedNoteType={tabEditor.state.selectedNoteType}
            onNoteTypeChange={tabEditor.setSelectedNoteType}
            currentToolMode={tabEditor.state.currentToolMode}
            onToolModeChange={tabEditor.setToolMode}
            tempo={tabEditor.state.tempo}
            onTempoChange={tabEditor.setTempo}
            timeSignature={`${tabEditor.state.timeSignature[0]}/${tabEditor.state.timeSignature[1]}`}
            onTimeSignatureChange={(sig) => {
              const parts = sig.split('/')
              tabEditor.dispatch({ 
                type: 'SET_TIME_SIGNATURE', 
                payload: [parseInt(parts[0]) || 4, parseInt(parts[1]) || 4] 
              })
            }}
            tieMode={tabEditor.state.selection.length > 0}
            onTieModeChange={() => {/* TODO: Implement tie mode */}}
            onSave={handleSave}
            onLoad={handleLoad}
            onNew={handleNew}
            onSaveAs={handleSaveAs}
            isModified={tabEditor.state.isModified}
            currentPosition={tabEditor.state.cursor}
            noteAtCurrentPosition={getNoteAtCurrentPosition()}
            onToggleDotted={() => {
              const noteIndex = tabEditor.state.notes.findIndex(note => 
                note.startSlot === tabEditor.state.cursor.timeSlot && 
                note.stringIndex === tabEditor.state.cursor.stringIndex
              )
              if (noteIndex >= 0) {
                tabEditor.toggleDottedNote(noteIndex)
              }
            }}
          />
        }
        fretboard={
          tabEditor.state.showFretboard ? (
            <Fretboard
              currentlyPlaying={[]} // TODO: Connect to playback state
            />
          ) : undefined
        }
        bottomPanel={
          <PlaybackBar
            isPlaying={tabEditor.state.isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={tabEditor.state.videoCurrentTime.toString()}
            totalTime={tabEditor.playbackDuration.toString()}
            tempo={tabEditor.state.tempo}
            trackTitle={tabEditor.state.currentProjectMetadata.title || 'Untitled Song'}
            onTempoChange={tabEditor.setTempo}
            onLoopToggle={tabEditor.toggleLooping}
            onFretboardToggle={tabEditor.toggleFretboard}
            onCountInToggle={tabEditor.toggleCountIn}
            isLooping={tabEditor.state.isLooping}
            showFretboard={tabEditor.state.showFretboard}
            countInEnabled={tabEditor.state.countIn}
          />
        }
        centerWorkspace={
          <SplitPane
            defaultSplitRatio={tabEditor.state.splitRatio}
            onSplitChange={tabEditor.setSplitRatio}
            orientation="horizontal"
          >
            {[
              <VideoPlayer
                source={tabEditor.state.videoSource}
                isPlaying={tabEditor.state.isPlaying}
                currentTime={tabEditor.state.videoCurrentTime}
                playbackRate={tabEditor.state.videoPlaybackRate}
                onMuteToggle={tabEditor.toggleVideoMute}
                isMuted={tabEditor.state.isVideoMuted}
              />,
              <div className="tab-editor-pane">
                <TabViewer
                  tabData={legacyTabData}
                  currentPosition={tabEditor.state.cursor}
                  onAddNote={addNote}
                  onRemoveNote={removeNote}
                  onMoveCursor={movePosition}
                  onCursorClick={handlePositionClick}
                  onPlayPreviewNote={playback.previewNote}
                  selectedDuration={tabEditor.state.selectedDuration}
                  selectedNoteType={tabEditor.state.selectedNoteType}
                  currentToolMode={tabEditor.state.currentToolMode}
                  customMeasureLines={tabEditor.state.customMeasureLines}
                  onTogglePlayback={handlePlayPause}
                  onResetCursor={() => tabEditor.setCursorPosition({ timeSlot: 0, stringIndex: 2 })}
                  zoom={tabEditor.state.zoom}
                  onZoomChange={tabEditor.setZoom}
                  isPlaying={tabEditor.state.isPlaying}
                  currentPlaybackTimeSlot={tabEditor.state.playbackPosition}
                  selectedNotes={tabEditor.state.selection
                    .map(index => {
                      const note = tabEditor.state.notes[index]
                      return note ? { timeSlot: note.startSlot, stringIndex: note.stringIndex } : null
                    })
                    .filter((note): note is { timeSlot: number; stringIndex: number } => note !== null)
                  }
                  onCreateTie={() => {/* TODO: Implement tie creation */}}
                  isSynthMuted={tabEditor.state.isSynthMuted}
                  onSynthMuteToggle={tabEditor.toggleSynthMute}
                  noteAtCurrentPosition={getNoteAtCurrentPosition()}
                />
                
                <Controls
                  ref={controlsRef}
                  tabData={legacyTabData}
                  currentPosition={tabEditor.state.cursor}
                  onNotesPlaying={() => {}} // TODO: Connect to playback state
                  tempo={tabEditor.state.tempo}
                  onPlaybackStateChange={handlePlaybackStateChange}
                  onCurrentTimeSlotChange={tabEditor.setPlaybackPosition}
                  onPlaybackComplete={() => {
                    console.log('🏁 Tab playback completed')
                    syncEngine.pause()
                    tabEditor.stopPlayback()
                  }}
                  countInEnabled={tabEditor.state.countIn}
                  timeSignature={`${tabEditor.state.timeSignature[0]}/${tabEditor.state.timeSignature[1]}`}
                  pickupBeats={tabEditor.pickupBeats}
                  isMuted={tabEditor.state.isSynthMuted}
                />
              </div>
            ]}
          </SplitPane>
        }
      />

      {/* Save/Load Dialogs */}
      <SaveDialog
        isOpen={tabEditor.state.saveDialogOpen}
        onClose={tabEditor.toggleSaveDialog}
        onSave={handleSaveDialog}
        currentMetadata={tabEditor.state.currentProjectMetadata}
      />
      
      <LoadDialog
        isOpen={tabEditor.state.loadDialogOpen}
        onClose={tabEditor.toggleLoadDialog}
        onLoad={handleLoadFile}
        recentFiles={fileManagerRef.current.getRecentFiles()}
      />
      
      <NewProjectDialog
        isOpen={tabEditor.state.newProjectDialogOpen}
        onClose={tabEditor.toggleNewProjectDialog}
        onConfirm={handleNewProject}
        hasUnsavedChanges={tabEditor.state.isModified}
      />
    </div>
  )
}

function App() {
  return (
    <SyncEngineProvider>
      <AppContent />
    </SyncEngineProvider>
  )
}

export default App
