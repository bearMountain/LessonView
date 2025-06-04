// Core Tab Editor Hook
// This hook encapsulates the main application state management using our unified reducer and memoized selectors.

import { useReducer, useCallback } from 'react'
import { appReducer, actionCreators } from '../state/reducer' 
import { initialState } from '../state/initialState'
import { useMemoizedAppSelectors } from '../state/selectors'
import type { AppState, AppAction } from '../state/types'
import type { Note, CursorPosition, NoteDuration, NoteType } from '../types'

/**
 * Main tab editor hook - provides unified state management and actions
 * This replaces the scattered state management across App.tsx
 */
export const useTabEditor = () => {
  // Core state management with our unified reducer
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Memoized selectors for derived state calculations
  const selectors = useMemoizedAppSelectors(state)
  
  // === Note Management Actions ===
  
  const addNote = useCallback((note: Note) => {
    dispatch(actionCreators.addNote(note))
  }, [])
  
  const removeNote = useCallback((index: number) => {
    dispatch(actionCreators.removeNote(index))
  }, [])
  
  const updateNote = useCallback((index: number, updates: Partial<Note>) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { index, note: updates } })
  }, [])
  
  const toggleDottedNote = useCallback((index: number) => {
    dispatch({ type: 'TOGGLE_DOTTED_NOTE', payload: { index } })
  }, [])
  
  const changeNoteDuration = useCallback((index: number, duration: NoteDuration) => {
    dispatch({ type: 'CHANGE_NOTE_DURATION', payload: { index, duration } })
  }, [])
  
  // === Cursor and Navigation Actions ===
  
  const moveCursor = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    dispatch(actionCreators.moveCursor(direction))
  }, [])
  
  const setCursorPosition = useCallback((position: CursorPosition) => {
    dispatch(actionCreators.setCursorPosition(position))
  }, [])
  
  const moveCursorToSlot = useCallback((timeSlot: number, stringIndex?: number) => {
    const newPosition: CursorPosition = {
      timeSlot,
      stringIndex: stringIndex ?? state.cursor.stringIndex
    }
    setCursorPosition(newPosition)
  }, [state.cursor.stringIndex, setCursorPosition])
  
  // === Selection Actions ===
  
  const setSelection = useCallback((noteIndices: number[]) => {
    dispatch({ type: 'SET_SELECTION', payload: noteIndices })
  }, [])
  
  const toggleNoteSelection = useCallback((index: number, shiftHeld: boolean = false) => {
    dispatch({ type: 'TOGGLE_NOTE_SELECTION', payload: { index, shiftHeld } })
  }, [])
  
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])
  
  // === Input Management ===
  
  const updateFretInput = useCallback((input: string) => {
    dispatch(actionCreators.updateFretInput(input))
  }, [])
  
  const clearFretInput = useCallback(() => {
    dispatch(actionCreators.clearFretInput())
  }, [])
  
  // === Tool and Duration Management ===
  
  const setSelectedDuration = useCallback((duration: NoteDuration) => {
    dispatch({ type: 'SET_SELECTED_DURATION', payload: duration })
  }, [])
  
  const setSelectedNoteType = useCallback((noteType: NoteType) => {
    dispatch({ type: 'SET_SELECTED_NOTE_TYPE', payload: noteType })
  }, [])
  
  const setToolMode = useCallback((mode: AppState['currentToolMode']) => {
    dispatch({ type: 'SET_TOOL_MODE', payload: mode })
  }, [])
  
  // === Playback Actions ===
  
  const togglePlayback = useCallback(() => {
    dispatch(actionCreators.togglePlayback())
  }, [])
  
  const startPlayback = useCallback(() => {
    dispatch({ type: 'START_PLAYBACK' })
  }, [])
  
  const stopPlayback = useCallback(() => {
    dispatch({ type: 'STOP_PLAYBACK' })
  }, [])
  
  const setPlaybackPosition = useCallback((position: number) => {
    dispatch({ type: 'SET_PLAYBACK_POSITION', payload: position })
  }, [])
  
  const setTempo = useCallback((tempo: number) => {
    dispatch(actionCreators.setTempo(tempo))
  }, [])
  
  const toggleCountIn = useCallback(() => {
    dispatch({ type: 'TOGGLE_COUNT_IN' })
  }, [])
  
  const toggleLooping = useCallback(() => {
    dispatch({ type: 'TOGGLE_LOOPING' })
  }, [])
  
  // === Visual Controls ===
  
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom })
  }, [])
  
  const toggleFretboard = useCallback(() => {
    dispatch({ type: 'TOGGLE_FRETBOARD' })
  }, [])
  
  // === Measure Management ===
  
  const addMeasureLine = useCallback((slot: number, measureNumber?: number) => {
    // Calculate default measure number if not provided
    const defaultMeasureNumber = measureNumber ?? (selectors.measures.length + 1)
    
    dispatch({ 
      type: 'ADD_MEASURE_LINE', 
      payload: { slot, measureNumber: defaultMeasureNumber }
    })
  }, [selectors.measures.length])
  
  const removeMeasureLine = useCallback((slot: number) => {
    dispatch({ type: 'REMOVE_MEASURE_LINE', payload: { slot } })
  }, [])
  
  const clearMeasureLines = useCallback(() => {
    dispatch({ type: 'CLEAR_MEASURE_LINES' })
  }, [])
  
  // === File Management ===
  
  const setModified = useCallback((modified: boolean) => {
    dispatch({ type: 'SET_MODIFIED', payload: modified })
  }, [])
  
  const setProjectMetadata = useCallback((metadata: AppState['currentProjectMetadata']) => {
    dispatch({ type: 'SET_PROJECT_METADATA', payload: metadata })
  }, [])
  
  const toggleSaveDialog = useCallback(() => {
    dispatch({ type: 'TOGGLE_SAVE_DIALOG' })
  }, [])
  
  const toggleLoadDialog = useCallback(() => {
    dispatch({ type: 'TOGGLE_LOAD_DIALOG' })  
  }, [])
  
  const toggleNewProjectDialog = useCallback(() => {
    dispatch({ type: 'TOGGLE_NEW_PROJECT_DIALOG' })
  }, [])
  
  const loadProjectState = useCallback((projectState: Partial<AppState>) => {
    dispatch({ type: 'LOAD_PROJECT_STATE', payload: projectState })
  }, [])
  
  const resetToInitialState = useCallback(() => {
    dispatch({ type: 'RESET_TO_INITIAL_STATE' })
  }, [])
  
  // === Video Sync Actions ===
  
  const setVideoSource = useCallback((source: string) => {
    dispatch({ type: 'SET_VIDEO_SOURCE', payload: source })
  }, [])
  
  const setSplitRatio = useCallback((ratio: number) => {
    dispatch({ type: 'SET_SPLIT_RATIO', payload: ratio })
  }, [])
  
  const setVideoCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_VIDEO_CURRENT_TIME', payload: time })
  }, [])
  
  const setVideoPlaybackRate = useCallback((rate: number) => {
    dispatch({ type: 'SET_VIDEO_PLAYBACK_RATE', payload: rate })
  }, [])
  
  // === Audio Controls ===
  
  const toggleVideoMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_VIDEO_MUTE' })
  }, [])
  
  const toggleSynthMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_SYNTH_MUTE' })
  }, [])
  
  // Return comprehensive API
  return {
    // Core state
    state,
    
    // Derived state (memoized selectors)
    measures: selectors.measures,
    visualLayout: selectors.visualLayout,
    audioEvents: selectors.audioEvents,
    playbackDuration: selectors.playbackDuration,
    pickupBeats: selectors.pickupBeats,
    countInEvents: selectors.countInEvents,
    
    // Note management
    addNote,
    removeNote,
    updateNote,
    toggleDottedNote,
    changeNoteDuration,
    
    // Cursor and navigation
    moveCursor,
    setCursorPosition,
    moveCursorToSlot,
    
    // Selection
    setSelection,
    toggleNoteSelection,
    clearSelection,
    
    // Input management
    updateFretInput,
    clearFretInput,
    
    // Tool management
    setSelectedDuration,
    setSelectedNoteType,
    setToolMode,
    
    // Playback controls
    togglePlayback,
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    setTempo,
    toggleCountIn,
    toggleLooping,
    
    // Visual controls
    setZoom,
    toggleFretboard,
    
    // Measure management
    addMeasureLine,
    removeMeasureLine,
    clearMeasureLines,
    
    // File management
    setModified,
    setProjectMetadata,
    toggleSaveDialog,
    toggleLoadDialog,
    toggleNewProjectDialog,
    loadProjectState,
    resetToInitialState,
    
    // Video sync
    setVideoSource,
    setSplitRatio,
    setVideoCurrentTime,
    setVideoPlaybackRate,
    
    // Audio controls
    toggleVideoMute,
    toggleSynthMute,
    
    // Raw dispatch for advanced use cases
    dispatch
  }
}

export type TabEditorAPI = ReturnType<typeof useTabEditor> 