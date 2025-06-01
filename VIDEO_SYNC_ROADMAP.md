# Video Synchronization Feature Roadmap

## 🎬 Goal
Add synchronized video playback capability to the strumstick tab viewer, allowing users to play along with instructional videos or performance recordings while maintaining perfect sync between video, tabs, and fretboard visualization.

## 📊 Feature Overview

### Vision
Create a split-screen interface where users can watch a video (local file or YouTube) synchronized with the tab notation and fretboard display. This enables powerful learning experiences where students can see the instructor's hands while following the notation.

### Layout Mockup
```
┌─────────────────────────────────────────┐
│          Professional Toolbar           │
├─────────────────┬───────────────────────┤
│                 │                       │
│  Video Player   │    Tab Viewer         │
│                 │                       │
├─────────────────┴───────────────────────┤
│              Fretboard                  │
├─────────────────────────────────────────┤
│          Playback Controls              │
└─────────────────────────────────────────┘
```

### Key Features
- **Resizable Split View**: Draggable divider between video and tab viewer
- **Synchronized Playback**: Video and tabs play in perfect sync
- **Sync Point Mapping**: Define alignment points between video and notation
- **BPM Scaling**: Video speed adjusts when tab tempo changes
- **Seek Synchronization**: Jumping to any point in video/tab updates both

## 🚀 Development Phases

### Phase 1: Video Player Integration (2 weeks)
**Goal**: Embed basic video player with local file support

#### 1.1 Video Player Component
```typescript
interface VideoPlayer {
  source: string | File;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isPlaying: boolean;
}
```

#### 1.2 Layout Architecture
- Implement split-pane layout with resizable divider
- Integrate video player into left panel
- Maintain responsive design principles
- Handle various aspect ratios gracefully

#### 1.3 Basic Video Controls
- Play/pause synchronization with main transport
- Seek bar integration
- Volume controls
- Fullscreen toggle

### Phase 2: Synchronization Engine (3 weeks)
**Goal**: Create robust sync system between video and notation

#### 2.1 Sync Architecture
```typescript
interface SyncEngine {
  videoTime: number;        // Current video timestamp
  notationTime: number;     // Current notation position
  syncPoints: SyncPoint[];  // Mapping between video and notation
  bpmRatio: number;         // Playback rate adjustment
}

interface SyncPoint {
  videoTime: number;        // Timestamp in video (seconds)
  notationTime: number;     // Position in notation (beats)
  confidence: number;       // How confident this sync point is
  type: 'manual' | 'automatic' | 'keyframe';
}
```

#### 2.2 Time Mapping System
- Linear interpolation between sync points
- Handle tempo changes in notation
- Smooth playback rate adjustments
- Frame-accurate synchronization

#### 2.3 Sync Point Editor
- Visual timeline showing both video and notation
- Drag-and-drop sync point creation
- Fine-tuning controls (+/- 100ms adjustments)
- Automatic beat detection (future enhancement)

### Phase 3: Advanced Sync Features (2 weeks)
**Goal**: Professional-grade synchronization tools

#### 3.1 Sync Modes
```typescript
enum SyncMode {
  STRICT = 'strict',          // Always maintain perfect sync
  LOOSE = 'loose',            // Allow small drift for smoother playback
  NOTATION_LEAD = 'notation', // Notation drives timing
  VIDEO_LEAD = 'video'        // Video drives timing
}
```

#### 3.2 BPM Detection & Adjustment
- Automatic BPM detection from video (tap-along tool)
- Visual metronome overlay on video
- Tempo mapping for songs with tempo changes
- Smooth video speed ramping

#### 3.3 Loop Region Sync
- Define loop regions that work across video and notation
- A/B repeat functionality
- Practice mode with automatic slowdown

### Phase 4: YouTube Integration (3 weeks)
**Goal**: Enable YouTube video embedding and sync

#### 4.1 YouTube API Integration
```typescript
interface YouTubePlayer extends VideoPlayer {
  videoId: string;
  embedRestrictions?: EmbedRestrictions;
  qualityOptions: string[];
}
```

#### 4.2 YouTube-Specific Features
- URL input with validation
- Handle embed restrictions gracefully
- Quality selection
- Offline availability detection

#### 4.3 Legal & Technical Considerations
- CORS and security policies
- YouTube Terms of Service compliance
- Fallback for restricted videos
- Caching strategies

### Phase 5: Enhanced UI/UX (2 weeks)
**Goal**: Polish the video sync experience

#### 5.1 Split View Enhancements
- Smooth drag handle with hover states
- Preset layouts (50/50, 30/70, 70/30)
- Collapse to full video or full notation
- Remember user preferences

#### 5.2 Visual Feedback
```typescript
interface VisualSync {
  playheadSync: boolean;      // Show synchronized playheads
  beatPulse: boolean;         // Visual beat indicator
  measureHighlight: boolean;  // Highlight current measure
  notePreview: boolean;       // Show upcoming notes
}
```

#### 5.3 Keyboard Shortcuts
- Space: Play/pause both
- Arrow keys: Frame-by-frame navigation
- Shift+Arrow: Jump between sync points
- Numbers 1-9: Jump to percentage points

### Phase 6: Performance & Optimization (1 week)
**Goal**: Ensure smooth playback on all devices

#### 6.1 Performance Targets
- Video decode: Hardware acceleration when available
- Sync accuracy: < 50ms drift
- UI responsiveness: 60fps during resize
- Memory usage: Efficient video buffering

#### 6.2 Optimization Strategies
- Preload video segments based on playback
- Efficient sync point interpolation
- Debounced resize handlers
- Web Worker for sync calculations

## 💡 Technical Architecture

### State Management
```typescript
interface VideoSyncState {
  video: {
    source: VideoSource;
    currentTime: number;
    duration: number;
    isLoading: boolean;
    error?: string;
  };
  sync: {
    isEnabled: boolean;
    mode: SyncMode;
    points: SyncPoint[];
    currentOffset: number;
  };
  layout: {
    splitRatio: number;
    orientation: 'horizontal' | 'vertical';
    isVideoCollapsed: boolean;
  };
}
```

### Component Structure
```
src/
├── components/
│   ├── video/
│   │   ├── VideoPlayer.tsx
│   │   ├── YouTubePlayer.tsx
│   │   ├── VideoControls.tsx
│   │   └── SyncPointEditor.tsx
│   ├── layout/
│   │   ├── SplitPane.tsx
│   │   ├── ResizeHandle.tsx
│   │   └── VideoLayout.tsx
│   └── sync/
│       ├── SyncEngine.tsx
│       ├── TimeMapper.tsx
│       └── BPMScaler.tsx
```

## 🎯 Implementation Priorities

### MVP Features (Level 1)
1. ✅ Local video file embedding
2. ✅ Basic play/pause sync
3. ✅ Resizable split view
4. ✅ Manual sync point creation
5. ✅ BPM-based video speed adjustment

### Enhanced Features (Level 2)
1. ⏳ YouTube integration
2. ⏳ Advanced sync modes
3. ⏳ Automatic beat detection
4. ⏳ Loop region synchronization
5. ⏳ Export/import sync data

### Future Enhancements
- Multi-camera support (split screen within video panel)
- Video annotations synchronized with notation
- Slow-motion practice mode
- Video bookmark system
- Community-shared sync mappings

## 🔧 Technical Challenges & Solutions

### Challenge 1: Frame-Accurate Sync
**Problem**: Web video APIs have limited precision
**Solution**: 
- Use requestAnimationFrame for tight sync loop
- Implement predictive sync with small buffer
- Allow manual offset adjustment

### Challenge 2: YouTube API Limitations
**Problem**: YouTube iframe API has restrictions
**Solution**:
- Graceful degradation for restricted videos
- Clear user messaging about limitations
- Alternative: video URL + manual sync

### Challenge 3: Performance with HD Video
**Problem**: High CPU/memory usage
**Solution**:
- Adaptive quality based on device
- Efficient video element reuse
- Hardware acceleration detection

### Challenge 4: BPM Scaling Artifacts
**Problem**: Audio pitch changes with playback rate
**Solution**:
- Implement pitch correction (Web Audio API)
- Provide option to disable for practice
- Visual-only mode for extreme tempo changes

## 📐 Design Specifications

### Visual Design
- Consistent with existing professional toolbar aesthetic
- Dark theme video player controls
- Subtle shadows and borders for depth
- High contrast sync point markers

### Interaction Design
- Drag handle: 8px wide, full height
- Hover state: Highlight and cursor change
- Sync points: Draggable with snapping
- Tooltips: Show exact timings

### Responsive Behavior
- Mobile: Stack video above notation
- Tablet: Maintain side-by-side with smaller video
- Desktop: Full split-pane experience
- 4K: Scale UI elements appropriately

## 📊 Success Metrics

### Performance KPIs
- Sync accuracy: < 50ms average drift
- Video load time: < 3 seconds
- Resize performance: 60fps
- Memory usage: < 500MB with HD video

### User Experience KPIs
- Time to first sync point: < 1 minute
- Sync point accuracy: 95% within 100ms
- Feature discoverability: 80% find sync tools
- User satisfaction: 4.5+ star rating

## 🗓️ Timeline Estimate

### Total Duration: 11-12 weeks

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Video Player | 2 weeks | Current codebase |
| Phase 2: Sync Engine | 3 weeks | Phase 1 |
| Phase 3: Advanced Sync | 2 weeks | Phase 2 |
| Phase 4: YouTube | 3 weeks | Phase 2 |
| Phase 5: UI/UX Polish | 2 weeks | Phase 3 & 4 |
| Phase 6: Optimization | 1 week | Phase 5 |

### Development Order
1. **Core video embedding** (critical path)
2. **Basic synchronization** (MVP feature)
3. **UI polish** (user experience)
4. **YouTube support** (extended feature)
5. **Advanced features** (competitive advantage)

## 🚦 Go/No-Go Criteria

### Technical Feasibility ✅
- HTML5 video API provides needed control
- React's composition model fits well
- Existing audio sync can be extended

### User Value ✅
- Highly requested feature for learning
- Differentiates from competitors
- Natural extension of current features

### Resource Requirements ⚠️
- Significant development time (3 months)
- Need video hosting/bandwidth considerations
- Potential licensing complexities with YouTube

## 🎬 Conclusion

This video synchronization feature represents a natural evolution of the strumstick tab viewer into a comprehensive learning platform. By carefully implementing the synchronization engine and providing intuitive sync point editing tools, we can create an unparalleled practice experience that combines the best of video instruction with interactive notation.

## 📊 Progress Tracker

### 🔄 Current Phase: **Phase 2: Synchronization Engine**
### 📅 Last Updated: 2024-12-21

| Phase | Status | Progress | Duration | Notes |
|-------|--------|----------|----------|-------|
| **Phase 1: Video Player Integration** | 🟢 Complete | 100% | 2 weeks | **Split-pane layout, basic video player, local file support** |
| **Phase 2: Synchronization Engine** | 🟡 In Progress | 0% | 3 weeks | **Master Timeline approach selected** |
| **Phase 3: Advanced Sync Features** | ⚪ Pending | 0% | 2 weeks | Depends on Phase 2 |
| **Phase 4: YouTube Integration** | ⚪ Pending | 0% | 3 weeks | Depends on Phase 2 |
| **Phase 5: Enhanced UI/UX** | ⚪ Pending | 0% | 2 weeks | Depends on Phase 3 & 4 |
| **Phase 6: Performance & Optimization** | ⚪ Pending | 0% | 1 week | Depends on Phase 5 |

**Status Legend:**
- 🟢 **Complete** - Phase finished and tested
- 🟡 **In Progress** - Currently working on this phase  
- 🟠 **Ready to Start** - Prerequisites met, ready to begin
- ⚪ **Pending** - Waiting for dependencies

### 🎯 Next Steps
1. **Phase 1**: ✅ Video player integration with split-pane layout
2. **Phase 2**: 🟡 Master Timeline synchronization engine
3. **Phase 3**: Enhanced sync features (sync points, BPM scaling)

### 📝 Recent Updates
- **Video Player Integration**: Complete with local file support and split-pane layout
- **Architecture Decision**: Master Timeline approach selected for synchronization
- **Current Issue**: Fixed space bar behavior - both video and tab now sync properly

## 🏗️ **ARCHITECTURAL DECISION: Master Timeline Approach**

### Selected Architecture
```
Master Sync Engine
├── Master Timeline (current position, play state)
├── Video Player (slave to master timeline)
├── Tab Player (slave to master timeline)
└── Sync Point Manager (manual alignment points)
```

### Key Benefits
- **Single Source of Truth**: Master timeline drives both video and notation
- **Bidirectional Seeking**: Seeking in either player updates master timeline
- **Consistent Behavior**: Both players pause/resume from same position
- **Simpler Implementation**: Clear ownership of playback state

### Implementation Components
```typescript
interface MasterTimeline {
  currentTime: number;      // Master timestamp (seconds)
  isPlaying: boolean;       // Master play state
  totalDuration: number;    // Total duration
  playbackRate: number;     // Master playback speed
}

interface SyncEngine {
  masterTimeline: MasterTimeline;
  timeMapper: TimeMapper;
  syncPoints: SyncPoint[];
  
  // Core methods
  play(): void;
  pause(): void;
  seekTo(time: number): void;
  setPlaybackRate(rate: number): void;
}
``` 