import React, { useEffect, useRef, useCallback } from 'react'
import './App.css'
import TabViewer from './TabViewer'
import type { TabViewerRef } from './TabViewer'
import Fretboard from './Fretboard'
import Controls from './Controls'
import MainLayout from './components/layout/MainLayout'
import PlaybackBar from './components/transport/PlaybackBar'
import ProfessionalToolbar from './components/toolbar/ProfessionalToolbar'
import VideoPlayer from './components/video/VideoPlayer'
import SplitPane from './components/layout/SplitPane'
import { SyncEngineProvider, useSyncEngine } from './components/sync/SyncEngine'
import { ThemeProvider } from './contexts/ThemeContext'
import { AudioProvider } from './contexts/AudioContext'
import { SaveDialog, LoadDialog, NewProjectDialog } from './components/ui/SaveLoadDialog'
import { FileManager, type AppState, type ProjectMetadata } from './services/FileManager'
import { AutoSave } from './services/AutoSave'
import type { ControlsRef } from './Controls'
import type { Note } from './types'

import { convertNoteStackToTabData, convertTabDataToNoteStack } from './services/ArchitectureBridge'

// Import NoteStack architecture hooks
import { 
  useNoteStackEditor
} from './hooks/useNoteStackEditor'
import { useTheme } from './contexts/ThemeContext'
import { useAppLayout } from './hooks/useAppLayout'
import { useAudio } from './contexts/AudioContext'

// Main App Content Component (needs to be inside SyncEngineProvider)
function AppContent() {
  // === Core State Management Hook (NoteStack Architecture) ===
  const tabEditor = useNoteStackEditor()
  
  // === App Layout and UI State ===
  const layout = useAppLayout()
  
  // === Theme Management ===
  // Theme functionality removed from toolbar but kept for future use
  
  // === Audio System Integration ===
  const { loadSequence, state: audioState, play, pause, setTempo } = useAudio()
  
  // === Integration with Legacy Services ===
  const fileManagerRef = useRef<FileManager>(new FileManager())
  const autoSaveRef = useRef<AutoSave>(new AutoSave(fileManagerRef.current))
  const controlsRef = useRef<ControlsRef>(null)
  const tabViewerRef = useRef<TabViewerRef>(null)
  
  // === Sync Engine Integration ===
  const syncEngine = useSyncEngine()
  
  // === Derived State for Legacy Components ===
  // Convert NoteStack format to legacy TabData format for components that haven't been refactored yet
  const legacyTabData = convertNoteStackToTabData(tabEditor.state.tab)
  
  // Get note at current position for legacy components
  const getNoteAtCurrentPosition = (): Note | null => {
    const currentStack = tabEditor.state.tab.find(stack => 
      stack.musicalPosition === tabEditor.state.currentPosition
    )
    if (!currentStack || currentStack.notes.length === 0) return null
    
    // Convert first note in stack to legacy format
    const firstNote = currentStack.notes[0]
    return {
      startSlot: Math.floor(tabEditor.state.currentPosition / 960),
      stringIndex: firstNote.string,
      fret: firstNote.fret,
      duration: tabEditor.state.selectedDuration,
      isDotted: false,
      type: 'note'
    }
  }
  
  // === Legacy Player Removed ===
  // Old StrumstickPlayer.ts integration removed - now using functional AudioProvider

  // === Load tab data into our functional audio system ===
  useEffect(() => {
    // Load the current tab into our functional audio system
    loadSequence(tabEditor.state.tab)
  }, [tabEditor.state.tab, loadSequence])
  
  // === Sync tempo between audio system and tab editor ===
  useEffect(() => {
    // Keep tabEditor BPM in sync with audio system tempo
    if (audioState.tempo !== tabEditor.state.bpm) {
      tabEditor.setBpm(audioState.tempo)
    }
  }, [audioState.tempo, tabEditor])
  
  // === Initialize audio system with tab editor's BPM ===
  useEffect(() => {
    // On initial load, sync audio system tempo with tab editor
    if (tabEditor.state.bpm !== audioState.tempo) {
      setTempo(tabEditor.state.bpm)
    }
  }, []) // Run only once on mount
  
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
    if (tabEditor.state.tab.length === 0 && tabEditor.state.bpm === 120) {
      return
    }
    
    // Convert NoteStack state to legacy AppState format for file manager
    const currentAppState: AppState = {
      tabData: legacyTabData,
      tempo: tabEditor.state.bpm,
      timeSignature: `4/4`, // TODO: Add to NoteStack state
      cursorPosition: {
        timeSlot: Math.floor(tabEditor.state.currentPosition / 960),
        stringIndex: 0
      },
      selectedDuration: tabEditor.state.selectedDuration,
      selectedNoteType: 'note',
      customMeasureLines: [],
      zoom: layout.zoom,
      showFretboard: layout.showFretboard,
      countInEnabled: false,
      isLooping: false,
      splitRatio: layout.splitRatio,
      videoSource: '',
      isSynthMuted: false,
      isVideoMuted: false
    }
    
    autoSaveRef.current.performAutoSave(currentAppState)
  }, [tabEditor.state, legacyTabData])

  // === Save/Load Event Handlers ===
  const handleSave = async () => {
    console.log('💾 Save button clicked')
    
    const currentAppState: AppState = {
      tabData: legacyTabData,
      tempo: tabEditor.state.bpm,
      timeSignature: `4/4`,
      cursorPosition: {
        timeSlot: Math.floor(tabEditor.state.currentPosition / 960),
        stringIndex: 0
      },
      selectedDuration: tabEditor.state.selectedDuration,
      selectedNoteType: 'note',
      customMeasureLines: [],
      zoom: layout.zoom,
      showFretboard: layout.showFretboard,
      countInEnabled: false,
      isLooping: false,
      splitRatio: layout.splitRatio,
      videoSource: '',
      isSynthMuted: false,
      isVideoMuted: false
    }

    const result = await fileManagerRef.current.saveProject(currentAppState, undefined, { title: '', artist: '' })
    
    if (result.success) {
      console.log('✅ Project saved successfully')
      autoSaveRef.current.markClean()
    } else {
      console.error('❌ Save failed:', result.error)
      alert(`Failed to save project: ${result.error}`)
    }
  }

  const handleSaveAs = () => {
    console.log('💾 Save As clicked')
    // TODO: Implement save dialog for NoteStack
  }

  const handleSaveDialog = async (filename: string, metadata: Partial<ProjectMetadata>) => {
    console.log('💾 Save dialog confirmed:', filename, metadata)
    
    const currentAppState: AppState = {
      tabData: legacyTabData,
      tempo: tabEditor.state.bpm,
      timeSignature: `4/4`,
      cursorPosition: {
        timeSlot: Math.floor(tabEditor.state.currentPosition / 960),
        stringIndex: 0
      },
      selectedDuration: tabEditor.state.selectedDuration,
      selectedNoteType: 'note',
      customMeasureLines: [],
      zoom: 1,
      showFretboard: layout.showFretboard,
      countInEnabled: false,
      isLooping: false,
      splitRatio: 0.5,
      videoSource: '',
      isSynthMuted: false,
      isVideoMuted: false
    }

    const result = await fileManagerRef.current.saveProject(currentAppState, filename, metadata)
    
    if (result.success) {
      console.log('✅ Project saved successfully')
      autoSaveRef.current.markClean()
    } else {
      console.error('❌ Save failed:', result.error)
      alert(`Failed to save project: ${result.error}`)
    }
  }

  const handleLoad = () => {
    console.log('📁 Load button clicked')
    // TODO: Implement load dialog for NoteStack
  }

  const handleLoadFile = async (file: File) => {
    console.log('📁 Loading file:', file.name)
    
    try {
      const result = await fileManagerRef.current.loadProject(file)
      
      if (result.success && result.data) {
        console.log('✅ Project loaded successfully:', result.data)
        
        // Access the tabData directly from the loaded data structure
        const tabData = (result.data as any).tabData || result.data
        const noteStackTab = convertTabDataToNoteStack(tabData)
        tabEditor.loadTab(noteStackTab)
        tabEditor.setBpm((result.data as any).tempo || 120)
        tabEditor.setCursorPosition(0) // Reset cursor
        
        autoSaveRef.current.markClean()
      } else {
        console.error('❌ Load failed:', result.error)
        alert(`Failed to load project: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Load error:', error)
      alert(`Failed to load project: ${error}`)
    }
  }

  const handleNew = () => {
    console.log('📄 New button clicked')
    // TODO: Implement new project dialog for NoteStack
  }

  const handleNewProject = () => {
    console.log('📄 Creating new project')
    tabEditor.loadTab([]) // Clear tab
    tabEditor.setBpm(120)
    tabEditor.setCursorPosition(0)
    autoSaveRef.current.markClean()
  }

  const handlePlayPause = async () => {
    if (audioState.isPlaying) {
      console.log('⏸️ Pausing playback...')
      pause()
    } else {
      console.log('▶️ Starting playback...')
      await play()
    }
  }

  const handlePlaybackStateChange = (playing: boolean) => {
    // Legacy handler - playback state now managed by AudioContext
    console.log('Playback state change:', playing)
  }

  const handlePositionClick = (timeSlot: number, stringIndex: number, shiftHeld?: boolean, clickedOnMeasureLine?: boolean) => {
    const position = timeSlot * 960 // Convert slots to ticks
    tabEditor.setCursorPosition(position)
    
    if (shiftHeld) {
      // TODO: Add selection support to NoteStack editor
      console.log('Selection not yet implemented in NoteStack editor')
    }
  }

  const movePosition = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (direction === 'left') tabEditor.moveCursorLeft()
    if (direction === 'right') tabEditor.moveCursorRight()
    // TODO: Handle up/down for string selection
  }

  // Find current string index from cursor position (for compatibility with legacy components)
  const getCurrentStringIndex = () => {
    if (tabEditor.state.selectedStacks.length > 0) {
      // Try to find a note at current position to determine string
      const stackAtPosition = tabEditor.state.tab.find(
        stack => stack.musicalPosition === tabEditor.state.currentPosition
      );
      if (stackAtPosition && stackAtPosition.notes.length > 0) {
        return stackAtPosition.notes[0].string; // Use first note's string
      }
    }
    return 1; // Default to middle string (A)
  };

  // === Focus Management ===
  const handleAfterToolbarAction = useCallback(() => {
    // Restore focus to TabViewer after toolbar interactions
    tabViewerRef.current?.focus();
  }, []);

  // Fretboard toggle handler
  const handleToggleFretboard = () => {
    layout.toggleFretboard();
  }

  return (
    <div className="app">
      <MainLayout 
        toolbar={
          <ProfessionalToolbar
            selectedDuration={tabEditor.state.selectedDuration}
            onDurationChange={tabEditor.setSelectedDuration}
            selectedNoteType={'note'}
            onNoteTypeChange={() => {}}
            currentToolMode={'note'}
            onToolModeChange={() => {}}
            timeSignature={'4/4'}
            onTimeSignatureChange={() => {}}
            tieMode={false}
            onTieModeChange={() => {}}
            onSave={handleSave}
            onLoad={handleLoad}
            onNew={handleNew}
            onSaveAs={handleSaveAs}
            isModified={false}
            currentPosition={{
              timeSlot: Math.floor(tabEditor.state.currentPosition / 960),
              stringIndex: getCurrentStringIndex()
            }}
            noteAtCurrentPosition={null}
            onToggleDotted={() => {}}
            onAfterSelection={handleAfterToolbarAction}
          />
        }
        fretboard={layout.showFretboard ? (
          <div style={{ 
            height: '100px', 
            backgroundColor: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid #ddd',
            padding: '10px'
          }}>
            <Fretboard
              currentlyPlaying={[]} // TODO: Connect to NoteStack playback state
            />
          </div>
        ) : null}
        bottomPanel={
          <PlaybackBar
            isPlaying={audioState.isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={audioState.currentPosition.toString()}
            totalTime={tabEditor.layoutItems.length.toString()} // Use layout items count as approximation
            tempo={audioState.tempo}
            trackTitle={'Untitled Song'} // TODO: Add title to NoteStack state
            onTempoChange={setTempo} // Use audio system's setTempo for proper sync
            onLoopToggle={() => {}} // TODO: Connect to audio system
            onFretboardToggle={handleToggleFretboard}
            onCountInToggle={() => {}} // TODO: Add count-in to NoteStack
            isLooping={audioState.isLooping}
            showFretboard={layout.showFretboard}
            countInEnabled={false} // TODO: Add count-in to NoteStack
          />
        }
        centerWorkspace={
          <SplitPane
            defaultSplitRatio={0.25} // Video player gets 1/4 width, tab gets 3/4 width
            onSplitChange={() => {}} // TODO: Add split ratio to NoteStack
            orientation="horizontal"
          >
            {[
              <VideoPlayer
                source={''} // TODO: Add video source to NoteStack state
                isPlaying={audioState.isPlaying}
                currentTime={0} // TODO: Add video time to NoteStack state
                playbackRate={1} // TODO: Add playback rate to NoteStack state
                onMuteToggle={() => {}} // TODO: Add video mute to NoteStack
                isMuted={false} // TODO: Add video mute to NoteStack state
              />,
              <div className="tab-editor-pane">
                <TabViewer 
                    ref={tabViewerRef}
                    editor={tabEditor}
                  />
                
                <Controls
                  ref={controlsRef}
                  tabData={legacyTabData}
                  currentPosition={{
                    timeSlot: Math.floor(tabEditor.state.currentPosition / 960),
                    stringIndex: getCurrentStringIndex()
                  }}
                  onNotesPlaying={() => {}} // TODO: Connect to NoteStack playback state
                  tempo={tabEditor.state.bpm}
                  onPlaybackStateChange={handlePlaybackStateChange}
                  onCurrentTimeSlotChange={(pos: number) => tabEditor.setCursorPosition(pos * 960)}
                  onPlaybackComplete={() => {
                    console.log('🏁 Tab playback completed')
                    // Playback state now managed by AudioContext
                  }}
                  countInEnabled={false}
                  timeSignature="4/4"
                  pickupBeats={0}
                  isMuted={false}
                />
              </div>
            ]}
          </SplitPane>
        }
      />

      {/* Save/Load Dialogs - TODO: Update for NoteStack */}
      <SaveDialog
        isOpen={false} // TODO: Add dialog state to NoteStack
        onClose={() => {}} // TODO: Add dialog actions to NoteStack
        onSave={handleSaveDialog}
        currentMetadata={{ title: '', artist: '' }}
      />
      
      <LoadDialog
        isOpen={false} // TODO: Add dialog state to NoteStack
        onClose={() => {}} // TODO: Add dialog actions to NoteStack
        onLoad={handleLoadFile}
        recentFiles={fileManagerRef.current.getRecentFiles()}
      />
      
      <NewProjectDialog
        isOpen={false} // TODO: Add dialog state to NoteStack
        onClose={() => {}} // TODO: Add dialog actions to NoteStack
        onConfirm={handleNewProject}
        hasUnsavedChanges={false} // TODO: Add modified state to NoteStack
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AudioProvider>
        <SyncEngineProvider>
          <AppContent />
        </SyncEngineProvider>
      </AudioProvider>
    </ThemeProvider>
  )
}

export default App
