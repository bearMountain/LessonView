# Critical Files Analysis

The 20 most important files in the strumstick tab viewer project, ranked by their impact on core functionality.

## Tier 1: Core Application Foundation (4 files)

### 1. `src/App.tsx` 
**Role**: Main application component and central state management
**Why Critical**: 
- Controls all app state (tabData, cursor, playback, selection)
- Orchestrates interactions between all major components
- Contains core business logic for note placement and editing
- Single point of failure for the entire application

### 2. `src/TabViewer.tsx`
**Role**: Core tab editing and display component  
**Why Critical**:
- Handles SVG rendering of musical notation
- Manages user input (keyboard, mouse, touch)
- Implements cursor navigation and note placement
- Contains 750+ lines of complex interaction logic

### 3. `src/types.ts`
**Role**: Central type definitions and positioning functions
**Why Critical**:
- Defines all core data structures (Note, TabData, CursorPosition)
- Contains positioning calculation functions (getSlotX, getVisualNoteX)
- Shared by virtually every component in the system
- Any changes here affect the entire codebase

### 4. `src/index.tsx`
**Role**: Application entry point and React initialization
**Why Critical**:
- Bootstrap point for the entire application
- Handles React 18 root creation and initial rendering
- Required for the app to start at all

## Tier 2: Core Services & Logic (6 files)

### 5. `src/services/IntelligentMeasurePlacement.ts`
**Role**: Intelligent measure placement engine
**Why Critical**:
- Core differentiator feature of the app
- Complex musical logic for measure boundary detection
- Contains MeasurePlacementEngine, MusicalContextAnalyzer
- Currently has architectural issues affecting the entire system

### 6. `src/services/VisualOffsetManager.ts`
**Role**: Visual positioning and spacing management
**Why Critical**:
- Manages visual offsets for intelligent spacing
- Singleton pattern affects testability
- Central to the coordinate system problems
- Critical for proper note display positioning

### 7. `src/Controls.tsx`
**Role**: Audio playback system using Tone.js
**Why Critical**:
- Handles all audio synthesis and playback
- Complex timing and scheduling logic
- Manages Transport system and metronome
- Essential for the audio features of the app

### 8. `src/services/SyncEngine.ts`
**Role**: Video-audio synchronization engine
**Why Critical**:
- Core technology for video sync feature
- Manages timeline coordination between video and tab
- Complex state management for sync points
- Key differentiator from other tab editors

### 9. `src/components/VideoPlayer.tsx`
**Role**: Video playback component
**Why Critical**:
- Handles video file loading and playback
- Integrates with sync engine for coordinated playback
- Essential for the video sync feature set

### 10. `src/components/transport/PlaybackBar.tsx`
**Role**: Professional transport controls interface
**Why Critical**:
- Primary user interface for playback control
- Implements professional-grade UI patterns
- Controls tempo, play/pause, and transport features

## Tier 3: User Interface & Components (4 files)

### 11. `src/components/toolbar/ProfessionalToolbar.tsx`
**Role**: Note selection and tool mode interface
**Why Critical**:
- Primary interface for note duration selection
- Manages tool modes (note editing, measure lines, ties)
- Essential for user workflow and note input

### 12. `src/components/layout/SplitPane.tsx`
**Role**: Resizable split-pane layout component
**Why Critical**:
- Enables the video/tab editor split view
- Handles responsive layout and user preferences
- Core to the professional layout design

### 13. `src/TabViewer.css`
**Role**: Main styling for the tab viewer component
**Why Critical**:
- Defines visual appearance of musical notation
- Contains zoom, cursor, and interaction styles
- Critical for user experience and visual feedback

### 14. `src/index.css`
**Role**: Global styles and CSS variable system
**Why Critical**:
- Defines the entire design system (colors, spacing, fonts)
- CSS custom properties used throughout the app
- Controls dark/light theme and professional appearance

## Tier 4: Configuration & Build (3 files)

### 15. `package.json`
**Role**: Project dependencies and build configuration
**Why Critical**:
- Defines all npm dependencies (React, Tone.js, etc.)
- Contains build scripts and development commands
- Version management and project metadata

### 16. `vite.config.ts`
**Role**: Build system configuration
**Why Critical**:
- Configures Vite bundler for development and production
- Handles TypeScript compilation and asset processing
- Optimizations and build performance settings

### 17. `playwright.config.ts`
**Role**: End-to-end testing configuration
**Why Critical**:
- Configures cross-browser testing environment
- Essential for maintaining app quality
- Currently testing the measure placement issues

## Tier 5: Testing & Documentation (3 files)

### 18. `tests/measure-placement.spec.ts`
**Role**: Critical integration tests for measure placement
**Why Critical**:
- Tests the most complex feature (intelligent measure placement)
- Currently failing due to coordinate system issues
- Essential for preventing regressions
- Contains detailed debugging and analysis code

### 19. `src/services/IntelligentMeasurePlacement.test.ts`
**Role**: Unit tests for core measure placement logic
**Why Critical**:
- Tests the MeasurePlacementEngine rules
- Validates musical logic and boundary calculations
- Essential for maintaining correctness of core algorithms

### 20. `README.md`
**Role**: Project documentation and setup instructions
**Why Critical**:
- First point of contact for new developers
- Contains setup instructions and project overview
- Essential for project onboarding and maintenance

## File Interdependencies

### High-Impact Dependencies
- **App.tsx** → imports and orchestrates most other components
- **types.ts** → imported by virtually every file in the system
- **TabViewer.tsx** → central hub for user interactions and display
- **IntelligentMeasurePlacement.ts** → affects visual positioning across the app

### Critical Integration Points
- **App.tsx ↔ TabViewer.tsx**: Core state management and UI
- **types.ts ↔ VisualOffsetManager.ts**: Positioning calculation conflicts
- **Controls.tsx ↔ SyncEngine.ts**: Audio/video coordination
- **TabViewer.tsx ↔ IntelligentMeasurePlacement.ts**: Display positioning

## Risk Assessment

### Highest Risk Files (Changes affect entire system)
1. `types.ts` - Central type definitions
2. `App.tsx` - Main state management
3. `IntelligentMeasurePlacement.ts` - Currently has architectural issues

### Medium Risk Files (Changes affect major features)
4. `TabViewer.tsx` - Core UI component
5. `VisualOffsetManager.ts` - Positioning system
6. `Controls.tsx` - Audio system

### Lower Risk Files (Changes affect specific features)
7. `PlaybackBar.tsx` - Transport UI
8. `VideoPlayer.tsx` - Video features
9. `ProfessionalToolbar.tsx` - Tool selection

This analysis helps prioritize development efforts and understand the impact of changes throughout the system. 