# Simple Tone.js Consolidation Plan

## The Real Problem

We have **3 different playback systems** when we only need **1**:

1. ✅ **StrumstickPlayer.ts** - Good! Uses Tone.js properly
2. ❌ **Controls.tsx** - Bad! Uses setTimeout (creates timing jitter)  
3. ❌ **usePlayback.ts** - Unnecessary! Complex hook that duplicates Tone.js functionality

## The Simple Solution

**Replace all 3 systems with a single functional audio architecture** using Tone.js consistently.

**Note**: See [Functional Audio Design](./FUNCTIONAL_AUDIO_DESIGN.md) for the corrected approach that maintains functional consistency.

## Why This Works

Tone.js **already solves timing problems internally**:
- ✅ Handles precise scheduling automatically
- ✅ Manages audio hardware clock synchronization  
- ✅ Provides sub-millisecond accuracy
- ✅ Resilient to UI thread blocking

**We don't need to implement anything complex - just use Tone.js consistently!**

## Implementation Steps

**Follow the corrected functional approach in [FUNCTIONAL_AUDIO_DESIGN.md](./FUNCTIONAL_AUDIO_DESIGN.md)**

### Step 1: Create Pure Audio Functions (1 day)

```typescript
// src/audio/audioEngine.ts - Pure functions only
export const noteStackToToneEvents = (stacks: NoteStack[]) => { ... }
export const fretToFrequency = (fret: number, string: number): number => { ... }
export const audioReducer = (state: AudioState, action: AudioAction): AudioState => { ... }
```

### Step 2: Create Functional Audio Context (1 day)

```typescript
// src/contexts/AudioContext.tsx - Functional with useReducer
export const AudioProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  
  // Pure action creators
  const actions = {
    play: () => Tone.Transport.start('+0.1'),
    stop: () => Tone.Transport.stop(),
    // ... other pure functions
  }
  
  return (
    <AudioContext.Provider value={{ state, dispatch, ...actions }}>
      {children}
    </AudioContext.Provider>
  )
}
```

### Step 3: Remove Old Systems (1 day)

- ❌ Delete `src/hooks/usePlayback.ts` 
- ❌ Remove setTimeout playback from `src/Controls.tsx`
- ❌ Remove `isPlaying` from `useAppLayout` (use Transport events instead)

### Step 4: Update Components (1 day)

```typescript
// Update App.tsx
<AudioProvider>
  <TabViewer editor={tabEditor} />
  <Controls /> 
</AudioProvider>

// Update Controls.tsx - Pure functional component
const Controls: React.FC = () => {
  const { state, play, stop, setTempo } = useAudio()
  
  return (
    <div>
      <button onClick={play} disabled={state.isPlaying}>Play</button>
      <button onClick={stop} disabled={!state.isPlaying}>Stop</button>
      <input 
        type="range" 
        value={state.tempo}
        onChange={(e) => setTempo(Number(e.target.value))}
      />
    </div>
  )
}

// Update TabViewer.tsx - Pure functional component
const TabViewer: React.FC = ({ noteStacks }) => {
  const { loadSequence, previewNote } = useAudio()
  
  // Load sequence when noteStacks change
  useEffect(() => {
    loadSequence(noteStacks)
  }, [noteStacks, loadSequence])
  
  // Pure rendering with preview handlers
  return <div>...</div>
}
```

## Expected Results

### Before (Current)
- 3 different audio systems
- 10-50ms timing jitter
- setTimeout anti-patterns
- State synchronization issues
- Complex debugging

### After (Simple)
- 1 functional audio system (pure functions + useReducer)
- <1ms timing precision  
- Pure Tone.js patterns
- Single source of truth
- Easy to understand and debug

## Key Insights

1. **Tone.js already solved the hard problems** - We don't need to reimplement scheduling
2. **Pure functions provide clear separation** - Audio logic separate from React
3. **React integration is simple** - Just a context provider around the player
4. **Less code, better results** - Removing complexity improves reliability

## What We're NOT Doing

❌ Implementing Chris Wilson's lookahead pattern (Tone.js does this)  
❌ Custom scheduling algorithms (Tone.js handles this)  
❌ Complex timing calculations (Transport does this)  
❌ Managing multiple audio systems (consolidating to one)

## What We ARE Doing

✅ Using Tone.js Transport consistently  
✅ Building pure functional architecture  
✅ Simplifying React integration  
✅ Removing setTimeout anti-patterns  
✅ Creating single source of truth for audio

**Total time needed: ~4 days instead of 3 weeks**

This approach leverages Tone.js's strengths while keeping our code simple and maintainable. 