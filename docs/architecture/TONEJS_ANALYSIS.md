# Tone.js Implementation Analysis

## Comparison with Tone.js Wiki Best Practices

Based on analysis of our current implementations against the [Tone.js wiki](https://github.com/Tonejs/Tone.js/wiki), here's what we found:

## ✅ What We're Doing Right

### StrumstickPlayer.ts - Good Patterns
```typescript
// ✅ Proper Transport usage
Tone.Transport.bpm.value = bpm;
Tone.Transport.start();

// ✅ Correct Part scheduling
this.currentPart = new Tone.Part((time, event) => {
  this.synth.triggerAttackRelease(event.pitches, event.duration, time);
}, events);

// ✅ Musical time conversion
private positionToToneTime(position: number): string {
  const measures = Math.floor(position / 3840);
  const beats = Math.floor((position % 3840) / 960);
  const sixteenths = Math.floor((position % 960) / 240);
  return `${measures}:${beats}:${sixteenths}`;
}

// ✅ Proper resource cleanup
dispose(): void {
  if (this.currentPart) {
    this.currentPart.dispose();
  }
  this.synth.dispose();
}
```

## 🚫 Anti-Patterns We're Using

### Controls.tsx - setTimeout Anti-Pattern
```typescript
// ❌ BAD: Using setTimeout for audio timing
setTimeout(scheduleNextNote, (60 / tempo) * 250)

// ❌ BAD: Manual timing calculations
let currentSlot = startPosition
const scheduleNextNote = () => {
  // This creates timing drift and jitter
  currentSlot++
  setTimeout(scheduleNextNote, (60 / tempo) * 250)
}
```

**Problem:** According to [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling), using `setTimeout` for audio creates:
- Timing jitter (10-50ms+)
- Drift over time
- Sensitivity to UI thread blocking
- No synchronization with audio hardware clock

### usePlayback.ts - Over-Engineered Hook
```typescript
// ❌ BAD: Scheduling from React effects
useEffect(() => {
  if (!state.isPlaying) return
  const updateTime = () => {
    const now = Tone.Transport.seconds
    setCurrentTime(now)
    const slot = Math.floor((now * state.tempo / 60) / 0.25)
    setPlaybackPosition(slot)
  }
  const intervalId = setInterval(updateTime, 16) // 60fps
  return () => clearInterval(intervalId)
}, [state.isPlaying, state.tempo, setPlaybackPosition])

// ❌ BAD: Complex effects chain without proper disposal
synthRef.current
  .connect(vibratoRef.current)
  .connect(chorusRef.current)
  .connect(distortionRef.current)
  .connect(filterRef.current)
  .connect(reverbRef.current)
  .toDestination()
```

**Problem:** 
- React effects for audio timing are unreliable
- Complex disposal logic scattered across components
- State fragmentation across multiple hooks

## 📊 Tone.js Best Practices We Should Follow

### 1. Transport as Single Source of Truth
```typescript
// ✅ SHOULD DO: All timing through Transport
Tone.Transport.schedule((time) => {
  synth.triggerAttackRelease(note, duration, time)
}, "1:0:0") // Musical time notation

// ✅ SHOULD DO: Use Transport events for state
Tone.Transport.on('start', () => setIsPlaying(true))
Tone.Transport.on('stop', () => setIsPlaying(false))
```

### 2. Proper Scheduling Patterns
```typescript
// ✅ SHOULD DO: Chris Wilson's lookahead pattern
const scheduleAheadTime = 0.1 // 100ms lookahead
const scheduleFrequency = 25 // Check every 25ms

function scheduler() {
  while (nextNoteTime < Tone.context.currentTime + scheduleAheadTime) {
    scheduleNote(nextNoteTime)
    advanceNote()
  }
}

setInterval(scheduler, scheduleFrequency)
```

### 3. Visual Sync with Tone.Draw
```typescript
// ✅ SHOULD DO: Separate visual updates
Tone.Transport.schedule((time) => {
  // Audio event
  synth.triggerAttackRelease(note, duration, time)
  
  // Visual update
  Tone.Draw.schedule(() => {
    updateVisualPosition(noteIndex)
  }, time)
}, "1:0:0")
```

### 4. Musical Time Throughout
```typescript
// ✅ SHOULD DO: Use Tone.js time formats
const position = "4:2:3" // 4 measures, 2 beats, 3 sixteenths
const duration = "4n"    // Quarter note
const tempo = Tone.Transport.bpm.value

// ✅ SHOULD DO: Tempo ramping
Tone.Transport.bpm.rampTo(140, "2m") // Ramp to 140 BPM over 2 measures
```

## 🎯 Key Improvements Needed

### 1. Consolidate to Single System
- **Remove** `Controls.tsx` setTimeout-based playback
- **Remove** `usePlayback.ts` complex hook
- **Enhance** `StrumstickPlayer.ts` as single audio engine
- **Use** Transport for all timing operations

### 2. Implement Proper Scheduling
- Follow Chris Wilson's lookahead pattern
- Use `Tone.Transport.schedule()` for all events
- Implement proper visual sync with `Tone.Draw`
- Add scheduling advance time for resilience

### 3. Leverage Musical Features
```typescript
// Enable swing and groove
Tone.Transport.swing = 0.1
Tone.Transport.swingSubdivision = "8n"

// Support time signatures
Tone.Transport.timeSignature = [7, 8] // 7/8 time

// Use loop points
Tone.Transport.setLoopPoints("0:0:0", "4:0:0")
Tone.Transport.loop = true
```

### 4. Performance Optimization
```typescript
// Set appropriate latency hint
Tone.setContext(new Tone.Context({ 
  latencyHint: "interactive" // or "balanced"/"playback"
}))

// Schedule audio events in advance
Tone.Transport.start("+0.1") // Start 100ms in future

// Use proper disposal patterns
class AudioEngine {
  dispose() {
    this.transport.dispose()
    this.synth.dispose()
    // Clean disposal of all resources
  }
}
```

## 📈 Expected Benefits

### Performance Improvements
- **Timing Accuracy**: From 10-50ms jitter to <1ms precision
- **CPU Usage**: More efficient scheduling reduces main thread load
- **Memory Management**: Proper disposal prevents audio context leaks

### Feature Enablement
- **Musical Features**: Swing, groove, time signatures, tempo curves
- **Professional Timing**: Beat-perfect synchronization
- **Latency Optimization**: Adjustable for different use cases
- **Export Capabilities**: Offline rendering with `Tone.Offline`

### Code Quality
- **Single Responsibility**: One audio system vs. three
- **Maintainability**: Standard Tone.js patterns vs. custom timing code
- **Testing**: Easier to test single, well-defined system
- **Documentation**: Aligns with established Tone.js practices

## 🔗 References

- [Tone.js Transport Wiki](https://github.com/tonejs/tone.js/wiki/Transport)
- [A Tale of Two Clocks - Chris Wilson](https://web.dev/articles/audio-scheduling)
- [Tone.js Performance Guide](https://github.com/tonejs/tone.js/wiki/Performance)
- [Playing Note Sequences with Tone.js](https://benfarrell.com/blog/2024-12-01-playing-a-note-sequence/)

This analysis forms the foundation for our [Tone.js Transition Plan](./TONEJS_TRANSITION_PLAN.md). 