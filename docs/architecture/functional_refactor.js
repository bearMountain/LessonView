// Core state structure - single source of truth
const initialState = {
  // Musical data
  notes: [], // Array of note objects with timing, fret, string, duration
  measures: [], // Calculated measure boundaries
  tempo: 120,
  timeSignature: [4, 4],
  
  // UI state
  cursor: { slot: 0, string: 0 }, // Current editing position
  selection: [], // Selected note indices
  zoom: 100,
  currentFretInput: '',
  
  // Playback state
  isPlaying: false,
  playbackPosition: 0, // Current playback slot
  countIn: false,
  
  // Visual state (derived, not stored)
  // visualOffsets will be computed on-demand
}

// Main reducer - handles all state transitions
const tabReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTE':
      return {
        ...state,
        notes: addNoteAtPosition(state.notes, action.payload),
        // Measures recalculated automatically via selector
      }
    
    case 'REMOVE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((_, index) => index !== action.payload.index)
      }
    
    case 'MOVE_CURSOR':
      return {
        ...state,
        cursor: calculateNewCursorPosition(state.cursor, action.payload, state.notes)
      }
    
    case 'SET_PLAYBACK_POSITION':
      return {
        ...state,
        playbackPosition: action.payload
      }
    
    case 'TOGGLE_PLAYBACK':
      return {
        ...state,
        isPlaying: !state.isPlaying,
        playbackPosition: state.isPlaying ? 0 : state.playbackPosition
      }
    
    case 'UPDATE_FRET_INPUT':
      return {
        ...state,
        currentFretInput: action.payload
      }
    
    case 'SET_SELECTION':
      return {
        ...state,
        selection: action.payload
      }
    
    default:
      return state
  }
}

// Pure functions for state calculations
const addNoteAtPosition = (notes, { position, noteData }) => {
  const newNotes = [...notes]
  newNotes[position] = noteData
  return newNotes
}

const calculateNewCursorPosition = (currentCursor, direction, notes) => {
  // Pure function for cursor movement logic
  const { slot, string } = currentCursor
  
  switch (direction) {
    case 'LEFT':
      return { ...currentCursor, slot: Math.max(0, slot - 1) }
    case 'RIGHT':
      return { ...currentCursor, slot: slot + 1 }
    case 'UP':
      return { ...currentCursor, string: Math.max(0, string - 1) }
    case 'DOWN':
      return { ...currentCursor, string: Math.min(2, string + 1) }
    default:
      return currentCursor
  }
}

// Selectors - compute derived state
const selectMeasures = (notes, timeSignature) => {
  // Pure function to calculate measure boundaries
  const beatsPerMeasure = timeSignature[0]
  let currentBeat = 0
  const measures = []
  
  notes.forEach((note, index) => {
    if (note && currentBeat >= beatsPerMeasure) {
      measures.push({ 
        startSlot: index,
        beat: 0,
        type: 'calculated'
      })
      currentBeat = 0
    }
    if (note) {
      currentBeat += noteToBeatValue(note.duration)
    }
  })
  
  return measures
}

const selectVisualLayout = (notes, measures, zoom) => {
  // Pure function combining all visual calculations
  const baseSlotWidth = 40 * (zoom / 100)
  let visualOffsets = new Map()
  let currentOffset = 0
  
  // Calculate intelligent spacing
  notes.forEach((note, index) => {
    if (measures.some(m => m.startSlot === index)) {
      currentOffset += 20 // Extra space for measure line
    }
    
    visualOffsets.set(index, currentOffset)
    
    if (note) {
      currentOffset += getVisualNoteWidth(note.duration, zoom)
    } else {
      currentOffset += baseSlotWidth
    }
  })
  
  return {
    notes: notes.map((note, index) => ({
      ...note,
      visualX: visualOffsets.get(index) || 0,
      visualY: getStringY(note?.string || 0),
      slot: index
    })),
    measures: measures.map(measure => ({
      ...measure,
      visualX: visualOffsets.get(measure.startSlot) || 0
    })),
    totalWidth: currentOffset
  }
}

// Custom hooks for feature areas
const useTabEditor = () => {
  const [state, dispatch] = useReducer(tabReducer, initialState)
  
  // Memoized selectors
  const measures = useMemo(() => 
    selectMeasures(state.notes, state.timeSignature),
    [state.notes, state.timeSignature]
  )
  
  const visualLayout = useMemo(() =>
    selectVisualLayout(state.notes, measures, state.zoom),
    [state.notes, measures, state.zoom]
  )
  
  return { state, dispatch, measures, visualLayout }
}

const useNoteInput = (state, dispatch) => {
  const addNote = useCallback((slot, string, fret, duration) => {
    dispatch({
      type: 'ADD_NOTE',
      payload: {
        position: slot,
        noteData: { fret, string, duration, id: generateId() }
      }
    })
  }, [dispatch])
  
  const handleKeyPress = useCallback((event) => {
    const key = event.key
    
    if (key >= '0' && key <= '9') {
      dispatch({ type: 'UPDATE_FRET_INPUT', payload: key })
    } else if (key === 'Enter' && state.currentFretInput) {
      addNote(
        state.cursor.slot,
        state.cursor.string,
        parseInt(state.currentFretInput),
        'quarter' // default duration
      )
      dispatch({ type: 'UPDATE_FRET_INPUT', payload: '' })
      dispatch({ type: 'MOVE_CURSOR', payload: 'RIGHT' })
    }
  }, [state.cursor, state.currentFretInput, addNote, dispatch])
  
  return { addNote, handleKeyPress }
}

const usePlayback = (notes, tempo, playbackPosition, dispatch) => {
  const synthRef = useRef()
  
  const play = useCallback(async () => {
    dispatch({ type: 'TOGGLE_PLAYBACK' })
    
    // Convert notes to audio events
    const audioEvents = notes
      .slice(playbackPosition)
      .filter(note => note && note.fret)
      .map((note, index) => ({
        time: calculateNoteTime(index, tempo),
        frequency: fretToFrequency(note.fret, note.string),
        duration: durationToSeconds(note.duration, tempo)
      }))
    
    // Schedule playback
    const transport = Tone.Transport
    audioEvents.forEach(event => {
      transport.schedule((time) => {
        synthRef.current?.triggerAttackRelease(
          event.frequency, 
          event.duration, 
          time
        )
      }, event.time)
    })
    
    transport.start()
  }, [notes, tempo, playbackPosition, dispatch])
  
  return { play, stop: () => Tone.Transport.stop() }
}

const useNavigation = (state, dispatch, visualLayout) => {
  const handleClick = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Find closest slot and string
    const slot = findClosestSlot(x, visualLayout.notes)
    const string = findClosestString(y)
    
    dispatch({
      type: 'MOVE_CURSOR',
      payload: { type: 'ABSOLUTE', slot, string }
    })
  }, [visualLayout, dispatch])
  
  const handleKeyboard = useCallback((event) => {
    const keyMap = {
      'ArrowLeft': 'LEFT',
      'ArrowRight': 'RIGHT',
      'ArrowUp': 'UP',
      'ArrowDown': 'DOWN'
    }
    
    if (keyMap[event.key]) {
      event.preventDefault()
      dispatch({ type: 'MOVE_CURSOR', payload: keyMap[event.key] })
    }
  }, [dispatch])
  
  return { handleClick, handleKeyboard }
}

// Main component - much simpler now
const TabEditor = () => {
  const { state, dispatch, measures, visualLayout } = useTabEditor()
  const noteInput = useNoteInput(state, dispatch)
  const playback = usePlayback(state.notes, state.tempo, state.playbackPosition, dispatch)
  const navigation = useNavigation(state, dispatch, visualLayout)
  
  useEffect(() => {
    window.addEventListener('keydown', navigation.handleKeyboard)
    window.addEventListener('keypress', noteInput.handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', navigation.handleKeyboard)
      window.removeEventListener('keypress', noteInput.handleKeyPress)
    }
  }, [navigation.handleKeyboard, noteInput.handleKeyPress])
  
  return (
    <div className="tab-editor">
      <div className="controls">
        <button onClick={playback.play}>
          {state.isPlaying ? 'Stop' : 'Play'}
        </button>
        <span>Tempo: {state.tempo}</span>
        <span>Input: {state.currentFretInput}</span>
      </div>
      
      <svg 
        width={visualLayout.totalWidth} 
        height={200}
        onClick={navigation.handleClick}
        className="tab-display"
      >
        {/* String lines */}
        {[0, 1, 2].map(string => (
          <line
            key={string}
            x1={0}
            y1={getStringY(string)}
            x2={visualLayout.totalWidth}
            y2={getStringY(string)}
            stroke="#ccc"
          />
        ))}
        
        {/* Measure lines */}
        {visualLayout.measures.map((measure, index) => (
          <line
            key={index}
            x1={measure.visualX}
            y1={20}
            x2={measure.visualX}
            y2={180}
            stroke="#666"
            strokeWidth={2}
          />
        ))}
        
        {/* Notes */}
        {visualLayout.notes.map((note, index) => 
          note && (
            <g key={index}>
              <circle
                cx={note.visualX}
                cy={note.visualY}
                r={8}
                fill={state.selection.includes(index) ? 'orange' : 'black'}
              />
              <text
                x={note.visualX}
                y={note.visualY + 4}
                textAnchor="middle"
                fill="white"
                fontSize="12"
              >
                {note.fret}
              </text>
            </g>
          )
        )}
        
        {/* Cursor */}
        <circle
          cx={visualLayout.notes[state.cursor.slot]?.visualX || 0}
          cy={getStringY(state.cursor.string)}
          r={12}
          fill="none"
          stroke="orange"
          strokeWidth={2}
        />
        
        {/* Playback indicator */}
        {state.isPlaying && (
          <line
            x1={visualLayout.notes[state.playbackPosition]?.visualX || 0}
            y1={20}
            x2={visualLayout.notes[state.playbackPosition]?.visualX || 0}
            y2={180}
            stroke="green"
            strokeWidth={3}
          />
        )}
      </svg>
    </div>
  )
}

// Helper functions
const noteToBeatValue = (duration) => {
  const values = {
    'whole': 4,
    'half': 2,
    'quarter': 1,
    'eighth': 0.5,
    'sixteenth': 0.25
  }
  return values[duration] || 1
}

const getVisualNoteWidth = (duration, zoom) => {
  const baseWidth = noteToBeatValue(duration) * 40
  return baseWidth * (zoom / 100)
}

const getStringY = (string) => 60 + (string * 40)

const fretToFrequency = (fret, string) => {
  // Strumstick tuning: Low D, A, Hi D
  const basePitches = [146.83, 220.00, 293.66] // D3, A3, D4
  return basePitches[string] * Math.pow(2, fret / 12)
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export default TabEditor