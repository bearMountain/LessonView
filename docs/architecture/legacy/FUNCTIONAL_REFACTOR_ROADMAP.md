# Functional Refactor Roadmap
### From Current Architecture to Pure Functional State Management

## Overview
This document outlines a step-by-step plan to refactor our strumstick tab viewer from its current component-based state management to a clean, functional architecture with pure state management, derived computations, and separated concerns.

## Current Architecture Analysis

### Current State Structure
Our app currently manages state across multiple components:
- **App.tsx**: Main state container (1098 lines) with complex intertwined logic
- **TabViewer.tsx**: UI rendering and interaction handling (752 lines)  
- **Controls.tsx**: Audio playback and synthesis (658 lines)
- **Types.ts**: Complex type definitions and utility functions (552 lines)
- **Services**: Separate services for file management, auto-save, visual offsets, and measure placement

### Current Features Inventory
#### Core Tablature Features
- ✅ Note input/editing with fret numbers (0-24)
- ✅ Multiple note durations (whole, half, quarter, eighth, sixteenth)
- ✅ Dotted notes support
- ✅ Rest notes
- ✅ 3-string strumstick support (Low D, A, Hi D)
- ✅ Cursor navigation (arrow keys, mouse clicks)
- ✅ Note selection and editing
- ✅ Tie functionality between notes

#### Visual & Layout Features
- ✅ Intelligent measure line placement
- ✅ Custom measure lines via clicking
- ✅ Visual offset management for spacing
- ✅ Zoom controls (1.0x default)
- ✅ String lines and fretboard display
- ✅ Pickup measure support

#### Playback Features  
- ✅ Audio synthesis with multiple oscillators per string
- ✅ Effects chain (reverb, distortion, filter, chorus, vibrato)
- ✅ Tempo control (120 BPM default)
- ✅ Time signature support (4/4 default)
- ✅ Count-in functionality
- ✅ Loop playback
- ✅ Real-time visual feedback during playback
- ✅ Audio mute controls
- ✅ Preview note playback on hover/edit

#### Advanced Features
- ✅ Video synchronization with tab playback
- ✅ Split-pane layout (video + tab viewer)
- ✅ File save/load (.tab format)
- ✅ Auto-save functionality  
- ✅ Project metadata (title, author, etc.)
- ✅ Recovery from auto-save
- ✅ Professional toolbar UI
- ✅ Keyboard shortcuts

#### Technical Infrastructure
- ✅ Tone.js integration for audio
- ✅ TypeScript throughout
- ✅ React hooks architecture
- ✅ Service-based file management
- ✅ Comprehensive test coverage for core logic

## Target Functional Architecture

Based on the `functional_refactor.js` outline, we'll implement:

### 1. Single State Tree
```typescript
interface AppState {
  // Musical data (core)
  notes: Note[]
  measures: MeasureBoundary[] // computed
  tempo: number
  timeSignature: [number, number]
  
  // UI state
  cursor: CursorPosition
  selection: number[] // selected note indices
  zoom: number
  currentFretInput: string
  
  // Playback state
  isPlaying: boolean
  playbackPosition: number
  countIn: boolean
  
  // Additional state (not in outline but needed)
  customMeasureLines: CustomMeasureLine[]
  selectedDuration: NoteDuration
  selectedNoteType: NoteType
  currentToolMode: ToolMode
  showFretboard: boolean
  isLooping: boolean
  // ... video, save/load, etc.
}
```

### 2. Pure Reducer Pattern
- Single `tabReducer` handles all state transitions
- No side effects in reducer
- Predictable state updates

### 3. Computed Selectors
- `selectMeasures()` - calculate measure boundaries
- `selectVisualLayout()` - compute note positions and spacing
- All visual calculations derived from core state

### 4. Feature-Based Custom Hooks
- `useTabEditor()` - main state management
- `useNoteInput()` - keyboard/mouse input handling
- `usePlayback()` - audio synthesis and playback
- `useNavigation()` - cursor movement and clicking
- Additional hooks for file management, video sync, etc.

## Refactor Plan - Phase by Phase

### Phase 1: Core State Consolidation (Week 1)
**Goal**: Consolidate all state into single reducer pattern

#### Step 1.1: Create New State Structure
- [ ] Create `src/state/types.ts` with unified state interface
- [ ] Create `src/state/initialState.ts` with default values  
- [ ] Map all current state variables to new structure

#### Step 1.2: Build Core Reducer
- [ ] Create `src/state/reducer.ts` with main `tabReducer`
- [ ] Implement all action types from current state updates:
  - `ADD_NOTE`, `REMOVE_NOTE`, `MOVE_CURSOR`
  - `SET_PLAYBACK_POSITION`, `TOGGLE_PLAYBACK`
  - `UPDATE_FRET_INPUT`, `SET_SELECTION`
  - `SET_TEMPO`, `SET_TIME_SIGNATURE`, `SET_ZOOM`
  - `ADD_MEASURE_LINE`, `REMOVE_MEASURE_LINE`
  - Additional actions for all current functionality

#### Step 1.3: Create Pure Helper Functions  
- [ ] Move all state manipulation logic from components to pure functions
- [ ] Create `src/state/stateHelpers.ts`:
  - `addNoteAtPosition()`, `calculateNewCursorPosition()`
  - `findNextAvailableSlot()`, `toggleNoteSelection()`
  - All functions currently in `types.ts`

#### Step 1.4: Test Core Reducer
- [ ] Write comprehensive tests for reducer and helpers
- [ ] Ensure all state transitions work correctly
- [ ] Test edge cases and invalid actions

### Phase 2: Selector System (Week 2)  
**Goal**: Implement derived state calculations

#### Step 2.1: Measure Calculation Selectors
- [ ] Create `src/state/selectors/measureSelectors.ts`
- [ ] Implement `selectMeasures(notes, timeSignature)` - pure function
- [ ] Implement `selectCustomMeasures(notes, customLines)`
- [ ] Migrate logic from `IntelligentMeasurePlacement.ts`

#### Step 2.2: Visual Layout Selectors
- [ ] Create `src/state/selectors/visualSelectors.ts`  
- [ ] Implement `selectVisualLayout(notes, measures, zoom)`
- [ ] Migrate logic from `VisualOffsetManager.ts`
- [ ] Handle intelligent spacing and note positioning

#### Step 2.3: Playback Selectors
- [ ] Create `src/state/selectors/playbackSelectors.ts`
- [ ] Implement `selectAudioEvents(notes, tempo, startPosition)`
- [ ] Calculate timing, frequencies, and durations
- [ ] Pure functions for audio scheduling

#### Step 2.4: Memoization Setup
- [ ] Add proper memoization to all selectors
- [ ] Ensure selectors only recalculate when dependencies change
- [ ] Performance testing to ensure no regressions

### Phase 3: Custom Hooks Extraction (Week 3)
**Goal**: Extract feature logic into composable hooks

#### Step 3.1: Core Editor Hook
- [ ] Create `src/hooks/useTabEditor.ts`
- [ ] Implement main state management with useReducer
- [ ] Connect memoized selectors
- [ ] Provide clean interface for components

#### Step 3.2: Input Handling Hooks
- [ ] Create `src/hooks/useNoteInput.ts`
- [ ] Extract keyboard input logic from TabViewer
- [ ] Handle fret input, note creation, and editing
- [ ] Create `src/hooks/useNavigation.ts`
- [ ] Extract cursor movement and mouse click handling

#### Step 3.3: Playback Hook
- [ ] Create `src/hooks/usePlayback.ts`
- [ ] Extract audio synthesis logic from Controls
- [ ] Maintain Tone.js integration
- [ ] Handle playback scheduling and visual feedback

#### Step 3.4: File Management Hooks  
- [ ] Create `src/hooks/useFileManager.ts`
- [ ] Integrate existing FileManager service
- [ ] Create `src/hooks/useAutoSave.ts`
- [ ] Maintain auto-save functionality

#### Step 3.5: Video Sync Hook
- [ ] Create `src/hooks/useVideoSync.ts` 
- [ ] Extract video synchronization logic
- [ ] Maintain existing sync engine integration

### Phase 4: Component Refactoring (Week 4)
**Goal**: Simplify components to pure rendering

#### Step 4.1: Main App Component
- [ ] Refactor `App.tsx` to use new hook system
- [ ] Eliminate internal state management
- [ ] Clean component structure with separated concerns
- [ ] Reduce from 1098 lines to ~200-300 lines

#### Step 4.2: TabViewer Component  
- [ ] Refactor `TabViewer.tsx` to pure rendering
- [ ] Remove internal state and complex logic
- [ ] Use visual layout from selectors
- [ ] Focus only on SVG rendering and event handling
- [ ] Reduce from 752 lines to ~300-400 lines

#### Step 4.3: Controls Component
- [ ] Refactor `Controls.tsx` to use playback hook
- [ ] Maintain audio synthesis capability
- [ ] Clean separation between UI and audio logic
- [ ] Reduce complexity while keeping functionality

#### Step 4.4: Supporting Components
- [ ] Refactor toolbar, transport, and UI components
- [ ] Ensure all components use hook-based state
- [ ] Maintain existing functionality and appearance

### Phase 5: Service Integration (Week 5)
**Goal**: Integrate existing services into functional architecture

#### Step 5.1: File Manager Integration
- [ ] Adapt FileManager to work with new state structure
- [ ] Ensure save/load functionality preserved  
- [ ] Test project file compatibility
- [ ] Maintain metadata and recovery features

#### Step 5.2: Auto-Save Integration
- [ ] Adapt AutoSave service to new state
- [ ] Ensure auto-save triggers work correctly
- [ ] Test recovery functionality
- [ ] Maintain performance characteristics

#### Step 5.3: Visual Offset Integration
- [ ] Migrate VisualOffsetManager logic to selectors
- [ ] Maintain intelligent spacing calculations
- [ ] Ensure visual layout consistency
- [ ] Test with complex tablatures

### Phase 6: Testing & Validation (Week 6)
**Goal**: Ensure no functionality is lost

#### Step 6.1: Feature Parity Testing
- [ ] Test all core tablature features work identically
- [ ] Test all playback features (audio, timing, effects)
- [ ] Test all UI interactions (keyboard, mouse, touch)
- [ ] Test file save/load with existing files
- [ ] Test video synchronization
- [ ] Test edge cases and error conditions

#### Step 6.2: Performance Testing
- [ ] Ensure no performance regressions
- [ ] Test with large tablatures (500+ notes)
- [ ] Test memory usage and cleanup
- [ ] Optimize selectors if needed

#### Step 6.3: User Acceptance Testing
- [ ] Test with real user workflows
- [ ] Ensure keyboard shortcuts work identically
- [ ] Verify audio quality and effects
- [ ] Check visual appearance and layout

### Phase 7: Cleanup & Documentation (Week 7)
**Goal**: Polish and document the new architecture

#### Step 7.1: Legacy Code Removal
- [ ] Remove old state management code
- [ ] Clean up unused utility functions
- [ ] Remove obsolete type definitions
- [ ] Update imports throughout codebase

#### Step 7.2: Documentation Updates
- [ ] Update README with new architecture
- [ ] Document state management patterns
- [ ] Create developer guide for new hooks
- [ ] Update API documentation

#### Step 7.3: Code Quality
- [ ] Ensure TypeScript strict mode compliance
- [ ] Run full ESLint validation
- [ ] Update test coverage to 90%+
- [ ] Performance profiling and optimization

## Risk Mitigation

### Preserving Existing Functionality
1. **Feature Inventory**: Comprehensive list above ensures nothing is missed
2. **Parallel Development**: Keep current code working while building new
3. **Incremental Migration**: Phase-by-phase approach with validation
4. **Automated Testing**: Comprehensive test suite for regression detection

### Technical Risks
1. **Tone.js Integration**: Careful preservation of audio synthesis
2. **Performance**: Selector memoization and optimization
3. **File Compatibility**: Ensure existing .tab files continue to work
4. **Video Sync**: Maintain precise timing synchronization

### Timeline Risks  
1. **Complexity**: Architecture is more complex than outline suggests
2. **Testing**: Thorough testing will take significant time
3. **Edge Cases**: Current code handles many edge cases
4. **User Experience**: Must maintain identical user experience

## Success Metrics

### Code Quality Metrics
- [ ] Reduce App.tsx from 1098 to <300 lines
- [ ] Reduce TabViewer.tsx from 752 to <400 lines  
- [ ] Maintain or improve TypeScript coverage
- [ ] Achieve 90%+ test coverage
- [ ] Zero functional regressions

### Architecture Metrics
- [ ] Single source of truth for state
- [ ] Pure functions for all state calculations
- [ ] Clear separation of concerns
- [ ] Composable and reusable hooks
- [ ] Predictable state management

### Performance Metrics
- [ ] No rendering performance regression
- [ ] Audio latency remains low (<50ms)
- [ ] File operations remain fast
- [ ] Memory usage stable or improved

## Conclusion

This refactor will transform our complex, tightly-coupled component architecture into a clean, functional system while preserving all existing functionality. The key is the phased approach that allows for thorough testing and validation at each step.

The result will be:
- **Maintainable**: Clear separation of concerns and pure functions
- **Testable**: Isolated logic and predictable state management  
- **Scalable**: Easy to add new features without complexity explosion
- **Performant**: Optimized selectors and minimal re-renders
- **Reliable**: Same functionality with better architecture

The 7-week timeline allows for careful implementation while maintaining the high quality and comprehensive feature set we've built. 