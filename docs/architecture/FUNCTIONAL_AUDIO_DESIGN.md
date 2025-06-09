# Functional Audio Architecture Design

## Functional Design Consistency Check

After reviewing our plans, I found some **functional design inconsistencies** that need correction:

### ❌ Issues with Current Plan

1. **Class-based StrumstickPlayer** conflicts with functional React patterns
2. **Imperative callbacks** (`onTransportChange`) vs. functional event handling  
3. **Mixed paradigms** - OOP classes with functional React contexts
4. **Mutable state** in class vs. immutable functional state

### ✅ Corrected Functional Approach

## Pure Functional Audio Architecture

### 1. Functional Audio Engine (Pure Functions)

```typescript
// src/audio/audioEngine.ts - Pure functions only
import * as Tone from 'tone'
import type { NoteStack } from '../types/notestack'

// Pure function to convert data
export const noteStackToToneEvents = (stacks: NoteStack[]) => {
  return stacks.map(stack => ({
    time: ticksToTransportTime(stack.musicalPosition),
    notes: stack.notes.map(note => ({
      frequency: fretToFrequency(note.fret, note.string),
      duration: durationToToneNotation(stack.duration)
    }))
  }))
}

// Pure conversion functions
export const ticksToTransportTime = (ticks: number): string => {
  const measures = Math.floor(ticks / 3840)
  const beats = Math.floor((ticks % 3840) / 960)
  const sixteenths = Math.floor((ticks % 960) / 240)
  return `${measures}:${beats}:${sixteenths}`
}

export const fretToNoteName = (fret: number, string: number): string => {
  const baseNotes = ['D3', 'A3', 'D4'] // Strumstick tuning
  // Convert to Tone.js note names like "D3", "A#4", etc.
  // Let Tone.js handle frequency calculation internally
}

export const durationToToneNotation = (duration: Duration): string => {
  const mapping = { 'whole': '1n', 'half': '2n', 'quarter': '4n', 'eighth': '8n', 'sixteenth': '16n' }
  return mapping[duration]
}

// Audio actions (pure, return new state)
export type AudioAction = 
  | { type: 'LOAD_SEQUENCE'; payload: NoteStack[] }
  | { type: 'PLAY' }
  | { type: 'STOP' }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_POSITION'; payload: number }

export interface AudioState {
  sequence: NoteStack[]
  isPlaying: boolean
  currentPosition: number
  tempo: number
}

// Pure reducer
export const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'LOAD_SEQUENCE':
      return { ...state, sequence: action.payload }
    case 'PLAY':
      return { ...state, isPlaying: true }
    case 'STOP':
      return { ...state, isPlaying: false, currentPosition: 0 }
    case 'SET_TEMPO':
      return { ...state, tempo: action.payload }
    case 'SET_POSITION':
      return { ...state, currentPosition: action.payload }
    default:
      return state
  }
}
```

### 2. Functional Audio Context

```typescript
// src/contexts/AudioContext.tsx - Functional with useReducer
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { audioReducer, noteStackToToneEvents, ticksToTransportTime } from '../audio/audioEngine'

interface AudioContextType {
  state: AudioState
  dispatch: React.Dispatch<AudioAction>
  // Pure action creators
  loadSequence: (stacks: NoteStack[]) => void
  play: () => void
  stop: () => void
  setTempo: (bpm: number) => void
  jumpTo: (position: number) => void
  previewNote: (fret: number, string: number) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, {
    sequence: [],
    isPlaying: false,
    currentPosition: 0,
    tempo: 120
  })

  // Tone.js instances (kept in refs, not state)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const partRef = useRef<Tone.Part | null>(null)

  // Initialize audio context
  useEffect(() => {
    synthRef.current = new Tone.PolySynth().toDestination()
    
    // Listen to Transport events functionally
    const handleStart = () => dispatch({ type: 'PLAY' })
    const handleStop = () => dispatch({ type: 'STOP' })
    
    Tone.Transport.on('start', handleStart)
    Tone.Transport.on('stop', handleStop)
    
    return () => {
      Tone.Transport.off('start', handleStart)
      Tone.Transport.off('stop', handleStop)
      synthRef.current?.dispose()
      partRef.current?.dispose()
    }
  }, [])

  // Pure action creators
  const actions = {
    loadSequence: (stacks: NoteStack[]) => {
      dispatch({ type: 'LOAD_SEQUENCE', payload: stacks })
      
      // Schedule audio events functionally
      if (partRef.current) {
        partRef.current.dispose()
      }
      
      const events = noteStackToToneEvents(stacks)
      partRef.current = new Tone.Part((time, event) => {
        event.notes.forEach(note => {
          synthRef.current?.triggerAttackRelease(note.frequency, note.duration, time)
        })
        
        // Visual updates using Tone.Draw (functional)
        Tone.Draw.schedule(() => {
          // This could trigger a state update if needed
        }, time)
      }, events)
      
      partRef.current.start(0)
    },

    play: () => {
      Tone.Transport.start('+0.1')
    },

    stop: () => {
      Tone.Transport.stop()
    },

    setTempo: (bpm: number) => {
      dispatch({ type: 'SET_TEMPO', payload: bpm })
      Tone.Transport.bpm.value = bpm
    },

    jumpTo: (position: number) => {
      dispatch({ type: 'SET_POSITION', payload: position })
      Tone.Transport.position = ticksToTransportTime(position)
    },

    previewNote: (fret: number, string: number) => {
      const frequency = fretToFrequency(fret, string)
      synthRef.current?.triggerAttackRelease(frequency, 0.5)
    }
  }

  return (
    <AudioContext.Provider value={{ state, dispatch, ...actions }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}
```

### 3. Functional Component Integration

```typescript
// Components become pure functions of props
const Controls: React.FC = () => {
  const { state, play, stop, setTempo } = useAudio()
  
  return (
    <div>
      <button onClick={play} disabled={state.isPlaying}>Play</button>
      <button onClick={stop} disabled={!state.isPlaying}>Stop</button>
      <input 
        type="range" 
        min={60} 
        max={200} 
        value={state.tempo}
        onChange={(e) => setTempo(Number(e.target.value))}
      />
    </div>
  )
}

const TabViewer: React.FC<{ noteStacks: NoteStack[] }> = ({ noteStacks }) => {
  const { loadSequence, previewNote } = useAudio()
  
  // Load sequence when noteStacks change
  useEffect(() => {
    loadSequence(noteStacks)
  }, [noteStacks, loadSequence])
  
  return (
    <div>
      {/* Render tab with onClick handlers for preview */}
      {noteStacks.map(stack => (
        <div key={stack.id} onClick={() => previewNote(stack.notes[0].fret, stack.notes[0].string)}>
          {/* Note rendering */}
        </div>
      ))}
    </div>
  )
}
```

## Functional Design Principles Applied

### ✅ **Pure Functions**
- All audio logic in pure functions
- Predictable inputs/outputs
- No side effects in calculations

### ✅ **Immutable State**
- useReducer for state management
- Actions return new state objects
- No direct state mutation

### ✅ **Separation of Concerns**
- Audio logic separated from React
- UI components are pure functions of props
- Side effects isolated to useEffect

### ✅ **Composition Over Inheritance**
- Functions compose together
- No class hierarchies
- Functional composition patterns

### ✅ **Declarative Style**
- Components declare what they need
- Context provides capabilities
- No imperative callbacks

## Benefits of Functional Approach

### **Predictability**
- Pure functions are easy to test
- State changes are explicit
- No hidden side effects

### **Maintainability**
- Clear data flow
- Easy to reason about
- Functional composition

### **Consistency**
- Matches existing React patterns
- No mixing of paradigms
- Clean architecture

### **Performance**
- React optimizations work naturally
- No unnecessary re-renders
- Efficient state updates

## Migration Steps (Corrected)

1. **Create pure audio functions** (audioEngine.ts)
2. **Build functional context** (AudioContext.tsx)  
3. **Remove class-based systems** (StrumstickPlayer.ts, Controls.tsx setTimeout)
4. **Update components** to use functional patterns

This approach maintains consistency with our functional React architecture while leveraging Tone.js capabilities. 