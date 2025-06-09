# Tone.js Transition Plan: From Chaos to Clean Architecture

## Executive Summary

Our current playback system has **three disconnected implementations** causing chaos in timing, state management, and user experience. This document outlines a complete transition to leverage Tone.js properly, following [Tone.js wiki best practices](https://github.com/Tonejs/Tone.js/wiki) and modern functional React patterns.

## Current Problems Analysis

### 🚫 Current Architecture Issues

**Multiple Disconnected Playback Systems:**
1. **StrumstickPlayer.ts** - Sophisticated Tone.js service with proper Transport usage
2. **Controls.tsx** - Simple imperative API using `setTimeout` (anti-pattern) 
3. **usePlayback.ts** - Complex hook with effects chains and state fragmentation

**State Management Chaos:**
- `useAppLayout` has `isPlaying` UI state separate from audio state
- `useNoteStackEditor` incorrectly managed theme state
- No single source of truth for playback state
- Multiple timing systems without coordination

**Architecture Misalignment:**
- NoteStack data structure but playback uses legacy `TabData` format
- Format conversion needed everywhere
- Timing calculations scattered across components

### 📊 Tone.js Best Practices We're Missing

Based on the [Tone.js Transport documentation](https://github.com/tonejs/tone.js/wiki/Transport) and [Performance guidelines](https://github.com/tonejs/tone.js/wiki/Performance):

1. **Transport as Single Source of Truth** - We should use `Tone.Transport` for ALL timing
2. **Proper Scheduling Patterns** - Use `Transport.schedule()` and `Transport.scheduleRepeat()` 
3. **Musical Time Notation** - Leverage Tone.js time formats like `"4n"`, `"1m"`, `"16:0:0"`
4. **Advance Scheduling** - Follow Chris Wilson's [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling) pattern
5. **Visual Sync Separation** - Use `Tone.Draw` for visual feedback, not Transport callbacks

## Target Architecture

### 🎯 Functional Component Hierarchy

```
App.tsx
├── ThemeProvider (themes)
├── PlaybackProvider (audio engine)
│   ├── Transport management
│   ├── Scheduling logic  
│   └── Audio synthesis
├── TabViewer (pure display)
└── Controls (pure UI)
```

### 🔧 Core Services

#### 1. **PlaybackEngine** (Replaces all current systems)
```typescript
// Single source of truth for audio
interface PlaybackEngine {
  // Transport control
  play(): void
  pause(): void  
  stop(): void
  jumpTo(position: string): void
  
  // Scheduling
  loadSequence(noteStacks: NoteStack[]): void
  setTempo(bpm: number): void
  setLoop(start: string, end: string): void
  
  // State
  readonly isPlaying: boolean
  readonly currentPosition: string
  readonly transportState: Tone.State
}
```

#### 2. **Audio Conversion Functions** (Pure functions)
```typescript
// Convert our data to Tone.js format
function noteStackToToneEvent(stack: NoteStack): ToneEvent[]
function positionToTransportTime(ticks: number): string  
function fretToFrequency(fret: number, string: number): string
function durationToToneNotation(duration: Duration): string
```

#### 3. **React Integration Hooks**
```typescript
// Clean React integration
function usePlaybackEngine(): PlaybackAPI
function usePlaybackState(): PlaybackState
function useAudioPreview(): PreviewAPI
```

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Create clean Tone.js architecture foundation

#### Day 1-2: Transport-Based Engine
- [ ] Create `src/audio/PlaybackEngine.ts` using Tone.Transport
- [ ] Implement proper musical time conversion utilities
- [ ] Add NoteStack → Tone.js event conversion functions
- [ ] Follow Tone.js best practices for scheduling

#### Day 3-4: React Context Integration
- [ ] Create `src/contexts/PlaybackContext.tsx`
- [ ] Implement `usePlaybackEngine` hook
- [ ] Add proper Transport state management
- [ ] Ensure single source of truth

#### Day 5: Remove Old Systems
- [ ] Delete `src/hooks/usePlayback.ts`
- [ ] Remove playback logic from `Controls.tsx`
- [ ] Clean up `useAppLayout` (remove `isPlaying`)
- [ ] Update imports throughout codebase

### Phase 2: Advanced Features (Week 2)
**Goal:** Leverage Tone.js advanced capabilities

#### Day 1-2: Proper Scheduling Patterns
- [ ] Implement [Chris Wilson's scheduling pattern](https://web.dev/articles/audio-scheduling)
- [ ] Use `requestAnimationFrame` for visual updates
- [ ] Add `Tone.Draw` for precise visual sync
- [ ] Follow Tone.js performance guidelines

#### Day 3-4: Musical Features
- [ ] Add swing and groove support using `Transport.swing`
- [ ] Implement time signature changes
- [ ] Add tempo ramping with `bpm.rampTo()`
- [ ] Support musical notation timing (`"1m"`, `"4n"`, etc.)

#### Day 5: Polish & Testing  
- [ ] Add comprehensive error handling
- [ ] Performance testing with large sequences
- [ ] Browser compatibility validation
- [ ] Audio latency optimization

### Phase 3: Enhancement (Week 3)
**Goal:** Professional features and optimization

#### Day 1-2: Advanced Audio
- [ ] Implement effects chain using Tone.js
- [ ] Add audio export with `Tone.Offline`
- [ ] Support multiple synth types
- [ ] Add volume and pan controls

#### Day 3-4: Sequencer Features
- [ ] Loop region support
- [ ] Count-in with proper metronome
- [ ] Punch recording capabilities  
- [ ] MIDI import/export planning

#### Day 5: Documentation & Migration
- [ ] Update all documentation
- [ ] Create migration guide
- [ ] Performance benchmarks
- [ ] User testing validation

## Key Code Patterns

### Transport-Centric Timing
```typescript
// ✅ GOOD: Use Transport for all timing
const playbackEngine = {
  play() {
    Tone.Transport.start("+0.1") // Start slightly in future
  },
  
  jumpTo(position: number) {
    const transportTime = this.ticksToTransportTime(position)
    Tone.Transport.position = transportTime
  },
  
  scheduleSequence(noteStacks: NoteStack[]) {
    // Clear previous events
    Tone.Transport.cancel()
    
    // Schedule all events using Transport
    noteStacks.forEach(stack => {
      const time = this.ticksToTransportTime(stack.musicalPosition)
      Tone.Transport.schedule((audioTime) => {
        this.triggerNoteStack(stack, audioTime)
      }, time)
    })
  }
}
```

### Pure Conversion Functions
```typescript
// ✅ GOOD: Pure functions for data conversion
export const noteStackToEvents = (stack: NoteStack): AudioEvent[] => {
  return stack.notes.map(note => ({
    time: ticksToSeconds(stack.musicalPosition),
    pitch: fretToNote(note.fret, note.string),
    duration: durationToSeconds(stack.duration),
    velocity: note.velocity || 127
  }))
}

export const ticksToTransportTime = (ticks: number): string => {
  const measures = Math.floor(ticks / 3840)
  const beats = Math.floor((ticks % 3840) / 960)  
  const sixteenths = Math.floor((ticks % 960) / 240)
  return `${measures}:${beats}:${sixteenths}`
}
```

### React Integration
```typescript
// ✅ GOOD: Clean React hooks
export const usePlaybackEngine = () => {
  const engine = useContext(PlaybackContext)
  if (!engine) throw new Error('usePlaybackEngine must be used within PlaybackProvider')
  return engine
}

export const usePlaybackState = () => {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentPosition: "0:0:0",
    tempo: 120
  })
  
  useEffect(() => {
    // Listen to Transport events
    const handleStart = () => setState(s => ({ ...s, isPlaying: true }))
    const handleStop = () => setState(s => ({ ...s, isPlaying: false }))
    
    Tone.Transport.on('start', handleStart)
    Tone.Transport.on('stop', handleStop)
    
    return () => {
      Tone.Transport.off('start', handleStart)
      Tone.Transport.off('stop', handleStop)
    }
  }, [])
  
  return state
}
```

## Documentation Updates Needed

### Files to Update
- [ ] `docs/features/current-capabilities.md` - Remove outdated playback info
- [ ] `docs/architecture/tab-data-structure-spec.md` - Add Tone.js integration
- [ ] Create `docs/audio/TONEJS_INTEGRATION.md` - New architecture guide
- [ ] Update `README.md` - Reflect new playback system

### Files to Remove (Outdated)
- [ ] `docs/architecture/legacy/functional_refactor.js` - Superseded
- [ ] `docs/architecture/legacy/IMPLEMENTATION_PRIORITIES.md` - Completed
- [ ] Any documentation referencing the old playback systems

## Success Metrics

### Technical Metrics
- [ ] Single playback implementation (down from 3)
- [ ] Transport as single source of truth
- [ ] <10ms timing jitter (vs current >50ms)
- [ ] Musical time notation throughout
- [ ] Zero setTimeout usage for audio timing

### User Experience Metrics  
- [ ] Instant tempo changes (no delay)
- [ ] Rock-solid timing during UI updates
- [ ] Smooth visual synchronization
- [ ] Professional audio quality
- [ ] Reliable playback controls

### Code Quality Metrics
- [ ] 100% pure functions for audio logic
- [ ] Clear separation of concerns
- [ ] Comprehensive test coverage
- [ ] Zero anti-patterns
- [ ] Documentation alignment with implementation

## Risk Mitigation

### Potential Issues
1. **Timing Regression** - Current system might have hidden compensations
2. **Browser Compatibility** - Tone.js features across browsers
3. **Performance Impact** - More sophisticated scheduling
4. **User Workflow** - Changes to familiar patterns

### Mitigation Strategies
1. **Parallel Implementation** - Build new system alongside old
2. **Extensive Testing** - Audio timing tests on multiple browsers
3. **Performance Monitoring** - Benchmark before/after
4. **User Testing** - Validate workflow improvements
5. **Gradual Migration** - Feature flags for rollback

## Conclusion

This transition from our current chaotic multi-system approach to a clean Tone.js-based architecture will:

1. **Eliminate Timing Issues** - Single Transport source of truth
2. **Enable Professional Features** - Leverage full Tone.js capabilities  
3. **Improve Maintainability** - Clean functional architecture
4. **Future-Proof Audio** - Follow web audio best practices
5. **Enhance User Experience** - Rock-solid, responsive audio

The investment in proper Tone.js integration pays dividends in reliability, performance, and the ability to add sophisticated musical features that would be impossible with our current fragmented approach.

---

*References:*
- [Tone.js Wiki](https://github.com/Tonejs/Tone.js/wiki)
- [Transport Documentation](https://github.com/tonejs/tone.js/wiki/Transport)  
- [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling)
- [Tone.js Performance Guide](https://github.com/tonejs/tone.js/wiki/Performance) 