// Functional Audio Context
// Integrates pure audio engine with React using useReducer and Tone.js

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { 
  audioReducer, 
  initialAudioState, 
  noteStackToToneEvents, 
  ticksToTransportTime,
  fretToNoteName,
  validateNoteStacks,
  calculateSequenceDuration
} from '../audio/audioEngine'
import { GuitarSynth } from '../audio/GuitarSynth'
import type { AudioState, AudioAction } from '../audio/audioEngine'
import type { NoteStack } from '../types/notestack'

// ===============================
// CONTEXT TYPE DEFINITION
// ===============================

interface AudioContextType {
  // State
  state: AudioState
  
  // Pure action dispatchers
  dispatch: React.Dispatch<AudioAction>
  
  // Convenience action creators (pure functions)
  loadSequence: (stacks: NoteStack[]) => void
  play: () => void
  stop: () => void
  pause: () => void
  setTempo: (bpm: number) => void
  jumpTo: (position: number) => void
  setVolume: (volume: number) => void
  toggleLoop: () => void
  setLoopPoints: (start: number, end: number) => void
  
  // Preview functions (for live playing as user types)
  previewNote: (fret: number, string: number) => void
  
  // Audio context management
  initializeAudio: () => Promise<void>
  isAudioInitialized: boolean
}

// ===============================
// CONTEXT CREATION
// ===============================

const AudioContext = createContext<AudioContextType | null>(null)

// ===============================
// AUDIO PROVIDER COMPONENT
// ===============================

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure functional state management
  const [state, dispatch] = useReducer(audioReducer, initialAudioState)
  
  // Audio instances (kept in refs, not state - these are stateful audio objects)
  const guitarSynthRef = useRef<GuitarSynth | null>(null)
  const partRef = useRef<Tone.Part | null>(null)
  const isInitializedRef = useRef(false)
  
  // ===============================
  // AUDIO INITIALIZATION
  // ===============================
  
  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current) return
    
    try {
      // Get the guitar synth instance
      if (!guitarSynthRef.current) {
        guitarSynthRef.current = GuitarSynth.getInstance()
      }
      
      // Initialize the guitar synth (starts Tone.js context)
      await guitarSynthRef.current.initialize()
      
      isInitializedRef.current = true
      console.log('🎸 Audio context with GuitarSynth initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }, [])
  
  // ===============================
  // TRANSPORT EVENT HANDLING
  // ===============================
  
  useEffect(() => {
    // Listen to Transport events functionally (pure event handlers)
    const handleStart = () => dispatch({ type: 'PLAY' })
    const handleStop = () => dispatch({ type: 'STOP' })
    const handlePause = () => dispatch({ type: 'PAUSE' })
    
    Tone.Transport.on('start', handleStart)
    Tone.Transport.on('stop', handleStop)
    Tone.Transport.on('pause', handlePause)
    
    // Cleanup function
    return () => {
      Tone.Transport.off('start', handleStart)
      Tone.Transport.off('stop', handleStop)
      Tone.Transport.off('pause', handlePause)
    }
  }, [])
  
  // ===============================
  // TEMPO SYNCHRONIZATION
  // ===============================
  
  useEffect(() => {
    // Sync Tone.js Transport tempo with our state
    Tone.Transport.bpm.value = state.tempo
  }, [state.tempo])
  
  // ===============================
  // VOLUME SYNCHRONIZATION  
  // ===============================
  
  useEffect(() => {
    // Note: GuitarSynth manages its own volume internally
    // Volume sync is handled within each note's velocity parameter
    console.log(`🔊 Volume updated to: ${state.volume}`)
  }, [state.volume])
  
  // ===============================
  // PURE ACTION CREATORS
  // ===============================
  
  const loadSequence = useCallback((stacks: NoteStack[]) => {
    try {
      // Validate input (pure function)
      validateNoteStacks(stacks)
      
      // Update state (pure action)
      dispatch({ type: 'LOAD_SEQUENCE', payload: stacks })
      
      // Schedule audio events functionally
      if (partRef.current) {
        partRef.current.dispose()
        partRef.current = null
      }
      
      // Clear any existing scheduled events
      Tone.Transport.cancel()
      
      if (stacks.length > 0) {
        const events = noteStackToToneEvents(stacks)
        
        partRef.current = new Tone.Part((time, event) => {
          // Play all notes in the stack simultaneously using GuitarSynth
          event.notes.forEach(note => {
            guitarSynthRef.current?.playNote(
              note.fret, 
              note.string, 
              event.duration as Tone.Unit.Time,
              state.volume
            )
          })
          
          // Visual updates using Tone.Draw (functional)
          Tone.Draw.schedule(() => {
            dispatch({ 
              type: 'TRANSPORT_POSITION_UPDATE', 
              payload: event.originalPosition 
            })
          }, time)
        }, events)
        
        partRef.current.start(0)
        
        // Calculate sequence end time and schedule completion
        const sequenceEndTime = calculateSequenceDuration(stacks)
        const endTimeTransport = ticksToTransportTime(sequenceEndTime)
        
        console.log(`🎯 Sequence duration: ${sequenceEndTime} ticks (${endTimeTransport})`)
        
        // Schedule sequence completion
        Tone.Transport.schedule((time) => {
          console.log('🏁 Sequence completed, stopping playback')
          
          // Use Tone.Draw for UI updates
          Tone.Draw.schedule(() => {
            dispatch({ type: 'STOP' })
            dispatch({ type: 'SET_POSITION', payload: 0 })
          }, time)
          
          // Stop transport
          Tone.Transport.stop()
          Tone.Transport.position = 0
        }, endTimeTransport)
      }
      
      console.log(`Loaded ${stacks.length} note stacks for playback`)
    } catch (error) {
      console.error('Failed to load sequence:', error)
    }
  }, [])
  
  const play = useCallback(async () => {
    await initializeAudio()
    Tone.Transport.start('+0.1') // Start with 100ms delay for precision
  }, [initializeAudio])
  
  const stop = useCallback(() => {
    Tone.Transport.stop()
    Tone.Transport.position = 0
    Tone.Transport.cancel() // Clear any scheduled completion events
  }, [])
  
  const pause = useCallback(() => {
    Tone.Transport.pause()
  }, [])
  
  const setTempo = useCallback((bpm: number) => {
    dispatch({ type: 'SET_TEMPO', payload: bpm })
  }, [])
  
  const jumpTo = useCallback((position: number) => {
    dispatch({ type: 'SET_POSITION', payload: position })
    Tone.Transport.position = ticksToTransportTime(position)
  }, [])
  
  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume })
  }, [])
  
  const toggleLoop = useCallback(() => {
    dispatch({ type: 'TOGGLE_LOOP' })
    Tone.Transport.loop = !state.isLooping
    
    if (!state.isLooping && state.sequence.length > 0) {
      // Set loop points based on sequence duration
      const duration = calculateSequenceDuration(state.sequence)
      Tone.Transport.setLoopPoints(0, ticksToTransportTime(duration))
    }
  }, [state.isLooping, state.sequence])
  
  const setLoopPoints = useCallback((start: number, end: number) => {
    dispatch({ type: 'SET_LOOP_POINTS', payload: { start, end } })
    Tone.Transport.setLoopPoints(
      ticksToTransportTime(start), 
      ticksToTransportTime(end)
    )
  }, [])
  
  const previewNote = useCallback(async (fret: number, string: number) => {
    if (!isInitializedRef.current) {
      await initializeAudio()
    }
    
    try {
      guitarSynthRef.current?.previewNote(fret, string)
    } catch (error) {
      console.warn('Failed to preview note:', error)
    }
  }, [initializeAudio])
  
  // ===============================
  // CLEANUP
  // ===============================
  
  useEffect(() => {
    return () => {
      // Clean up Tone.js resources
      if (partRef.current) {
        partRef.current.dispose()
      }
      // Note: GuitarSynth uses singleton pattern and manages its own cleanup
      
      console.log('🧹 AudioContext cleanup complete')
    }
  }, [])
  
  // ===============================
  // CONTEXT VALUE
  // ===============================
  
  const contextValue: AudioContextType = {
    state,
    dispatch,
    loadSequence,
    play,
    stop,
    pause,
    setTempo,
    jumpTo,
    setVolume,
    toggleLoop,
    setLoopPoints,
    previewNote,
    initializeAudio,
    isAudioInitialized: isInitializedRef.current
  }
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  )
}

// ===============================
// CUSTOM HOOK
// ===============================

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}

// ===============================
// CONVENIENCE HOOKS
// ===============================

/**
 * Hook that provides only audio state (no actions)
 * Useful for components that only need to read audio state
 */
export const useAudioState = (): AudioState => {
  const { state } = useAudio()
  return state
}

/**
 * Hook that provides only playback controls
 * Useful for control components
 */
export const usePlaybackControls = () => {
  const { play, stop, pause, setTempo, jumpTo } = useAudio()
  return { play, stop, pause, setTempo, jumpTo }
}

/**
 * Hook that provides only preview functionality
 * Useful for tab input components
 */
export const useNotePreview = () => {
  const { previewNote } = useAudio()
  return { previewNote }
} 