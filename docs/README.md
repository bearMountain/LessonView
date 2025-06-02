# Strumstick Tab Viewer Documentation

## 📁 Documentation Structure

This documentation is organized into three main categories:

### 🏗️ Architecture Documents (`/architecture`)
Core technical design and system architecture documents.

- **[DEVELOPMENT_ROADMAP.md](architecture/DEVELOPMENT_ROADMAP.md)** - Master development plan for transforming to professional notation interface
- **[SAVE_LOAD_ARCHITECTURE.md](architecture/SAVE_LOAD_ARCHITECTURE.md)** - Comprehensive save/load system design with file formats and Tone.js integration

### ✨ Features Documentation (`/features`)
Detailed specifications for major features and capabilities.

- **[VIDEO_SYNC_ROADMAP.md](features/VIDEO_SYNC_ROADMAP.md)** - Video synchronization implementation plan with split-screen layout

### 📚 Guides & References (`/guides`)
Implementation guides, technical references, and detailed specifications.

- **[NOTE_SPACING_DOCUMENTATION.md](guides/NOTE_SPACING_DOCUMENTATION.md)** - Technical reference for note spacing and layout calculations

## 🎯 Project Overview

The Strumstick Tab Viewer is a web-based tablature editor and player specifically designed for the strumstick (3-string dulcimer). The project has evolved through several major phases:

### Current Status (Phase 2 Complete)
- ✅ **Professional Layout Architecture** - Full-screen layout with responsive design
- ✅ **Professional Toolbar** - Comprehensive tool sections with note values, time signature, tempo controls
- ✅ **Video Synchronization** - Split-screen video/tab sync with BPM-based timing
- ✅ **Enhanced Playback** - Robust pause/resume, mute controls, visual feedback
- ✅ **Git Repository** - Successfully pushed to GitHub with complete history

### Next Major Features
1. **Save/Load System** - Comprehensive file management with multiple formats (`.stab`, MIDI, audio export)
2. **Enhanced Notation** - Connector bars, hammer-on/pull-off, slides
3. **Timeline & Transport** - Professional playback interface
4. **Properties Panels** - Note and measure editing interfaces

## 🛠️ Technical Stack

### Core Technologies
- **React + TypeScript** - Component architecture with type safety
- **Tone.js** - Professional audio synthesis and timing
- **Vite** - Development server with Hot Module Replacement
- **CSS Grid & Flexbox** - Professional layout systems

### Key Features
- **BPM-Based Video Sync** - Mathematical timing relationship for perfect sync
- **Polyphonic Audio Engine** - Real-time strumstick synthesis
- **Professional UI** - Dark theme with modern design standards
- **Responsive Design** - Desktop-optimized with mobile considerations

## 📈 Development Phases

| Phase | Status | Progress | Focus Area |
|-------|--------|----------|------------|
| **Phase 1: Layout Architecture** | 🟢 Complete | 100% | Foundation, fretboard positioning, playback bar |
| **Phase 2: Professional Toolbar** | 🟢 Complete | 100% | Tool sections, note values, time signature, tempo |
| **Phase 3: Enhanced Notation** | 🟠 Ready | 0% | Connector bars, musical articulations |
| **Phase 4: Timeline & Transport** | ⚪ Pending | 0% | Professional playback interface |
| **Phase 5: Properties Panels** | ⚪ Pending | 0% | Note/measure editing |
| **Phase 6: File Management** | ⚪ Pending | 0% | Save/load system |
| **Phase 7: Polish & Details** | ⚪ Pending | 0% | Final optimization |

## 🔧 Development Environment

### Running the Application
```bash
npm run dev
```

The application runs on multiple ports due to active development:
- Primary: `http://localhost:5173/`
- Fallback ports: 5174-5181 (auto-assigned when ports are busy)

### File Structure
```
src/
├── components/
│   ├── layout/          # Main layout components
│   ├── video/           # Video player and sync
│   ├── sync/            # Synchronization engine
│   └── ui/              # UI components
├── Controls.tsx         # Main playback controls
├── TabViewer.tsx        # Tablature display and editing
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🎵 Key Concepts

### Time Management
- **TimeSlot System** - Sixteenth note-based timing (16 timeSlots per measure)
- **BPM Synchronization** - Mathematical conversion: `seconds = timeSlot * (60 / BPM / 4)`
- **Video Sync** - Alignment through recorded BPM properties

### Audio Architecture
- **Polyphonic Synthesis** - Multiple simultaneous notes using Tone.js
- **Real-time Playback** - Sample-accurate scheduling
- **Independent Muting** - Separate video and synth audio controls

### State Management
- **React Context** - Global sync state with useReducer
- **Component Integration** - Controls, TabViewer, VideoPlayer coordination
- **Position Tracking** - Cursor position, playback position, pause state

## 📝 Contributing Guidelines

### Documentation Standards
- All major features require architecture documentation
- Implementation phases must be clearly defined
- Progress tracking with status indicators
- Technical specifications with code examples

### Code Standards
- TypeScript with strict type checking
- Component-based architecture
- CSS modules for styling
- Comprehensive error handling

## 🔗 External Resources

### Libraries & Dependencies
- **[Tone.js](https://tonejs.github.io/)** - Web Audio framework for music applications
- **[@tonejs/midi](https://github.com/Tonejs/Midi)** - MIDI file parsing and generation
- **React** - Component framework
- **Vite** - Build tool and development server

### Musical References
- **Strumstick** - 3-string dulcimer with D-A-D tuning
- **Tablature Notation** - Fret-based musical notation
- **Time Signatures** - 4/4, 3/4, 6/8 support

---

**Last Updated**: December 21, 2024
**Documentation Version**: 1.0.0 