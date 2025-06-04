# Current App Capabilities

This document provides a comprehensive overview of all features and abilities currently implemented in the strumstick tab viewer.

## Core Music Notation Features

### Note Input & Editing
- **Fret Number Input**: Type 0-9 to place notes (up to fret 24)
- **Duration Selection**: Whole, half, quarter, eighth, sixteenth notes
- **Note Types**: Regular notes and rests
- **Dotted Notes**: Support for dotted note durations
- **Rest Placement**: 'R' key or rest button to place rests
- **Note Modification**: Edit existing notes by typing new fret numbers
- **Note Removal**: Backspace to delete notes
- **Multi-String Support**: 3-string strumstick (Low D, A, Hi D)

### Navigation & Cursor
- **Arrow Key Navigation**: Move cursor up/down/left/right
- **Tab Navigation**: Tab key moves by selected note duration
- **Smart Positioning**: Click-to-position with intelligent placement
- **Visual Cursor**: Orange circle indicator showing current position
- **Position Memory**: Cursor remembers last position

### Tie System
- **Note Ties**: Connect notes across time for extended duration
- **Visual Ties**: Curved lines showing tied note connections
- **Tie Creation**: 'T' key or shift-click selection
- **Multi-Note Selection**: Select up to 2 notes for tie creation
- **Tie Removal**: Delete existing ties

## Intelligent Measure Management

### Automatic Measure Lines
- **Context-Aware Placement**: Measure lines adapt to note patterns
- **Note Duration Intelligence**: Different rules for whole/half/quarter/eighth/sixteenth notes
- **Visual Spacing**: Automatic spacing adjustments for better readability
- **Multiple Measure Support**: Handles multiple measures automatically

### Custom Measure Lines
- **Manual Placement**: Click to place custom measure lines
- **Pickup Measure Support**: Handle partial measures at song start
- **Measure Line Tool**: Dedicated tool mode for measure line editing
- **Visual Consistency**: Custom lines match automatic line styling

## Playback System

### Audio Playback
- **Tone.js Integration**: High-quality audio synthesis
- **Real-time Playback**: Play notes as entered in tab
- **Tempo Control**: Adjustable BPM (beats per minute)
- **Note Duration Accuracy**: Proper timing for all note durations
- **Tied Note Handling**: Correct playback of tied notes

### Playback Controls
- **Play/Pause**: Space bar or button control
- **Position-based Start**: Start playback from cursor position
- **Visual Playback Indicator**: Green line showing current playback position
- **Playback Completion**: Automatic stop at end of tab
- **Count-in Support**: Optional metronome count-in before playback

### Audio Features
- **Synth Mute Toggle**: Mute/unmute synthesizer
- **Preview Sounds**: Hear notes as you type them
- **Multiple Note Playback**: Play chords (multiple notes simultaneously)
- **Audio Context Management**: Proper audio initialization and cleanup

## User Interface

### Professional Layout
- **Split-Pane Interface**: Video/tab editor split view
- **Resizable Panels**: Adjustable split ratios
- **Toolbar Integration**: Professional note selection toolbar
- **Clean SVG Rendering**: High-quality musical notation display

### Zoom & Display
- **Zoom Control**: Scale from 60% to 300%
- **Mouse Wheel Zoom**: Ctrl/Cmd + scroll wheel
- **Touch Zoom**: Pinch-to-zoom on touch devices
- **Responsive Layout**: Adapts to different screen sizes

### Visual Feedback
- **Note Highlighting**: Visual selection indicators
- **Current Position**: Orange cursor circle
- **Playback Position**: Green playback line
- **Note Selection**: Blue dashed circles for tie mode
- **Measure Lines**: Dashed vertical lines for measure boundaries

## Tool Modes & Selection

### Note Selection Tools
- **Duration Buttons**: Quick selection of note durations
- **Note/Rest Toggle**: Switch between notes and rests
- **Visual Duration Display**: Shows selected duration in toolbar

### Tool Modes
- **Note Editing Mode**: Default mode for placing and editing notes
- **Measure Line Mode**: Mode for placing custom measure lines
- **Tie Creation Mode**: Mode for connecting notes with ties

## Video Synchronization

### Video Player Integration
- **Video Loading**: Support for video file playback
- **Sync Engine**: Synchronize tab playback with video
- **Playback Rate Control**: Adjust video/audio playback speed
- **Video Mute**: Independent video audio control
- **Time Mapping**: Map tab positions to video timestamps

### Sync Features
- **Master Timeline**: Unified time control for video and tab
- **Sync Points**: Alignment points between video and tab
- **Time Signature Support**: 4/4 time signature implementation
- **BPM Mapping**: Map recorded video BPM to tab playback

## Keyboard Shortcuts

### Navigation
- **Arrow Keys**: Move cursor in all directions
- **Tab**: Advance by selected note duration
- **Enter**: Place note and move down
- **Cmd/Ctrl + Enter**: Reset cursor to start

### Editing
- **0-9**: Place fret numbers
- **R**: Place rest
- **T**: Create tie
- **Backspace**: Delete note/edit fret number
- **Escape**: Clear current input
- **Space**: Play/pause toggle

## File & Data Management

### Tab Data Structure
- **Structured Storage**: Organized note data with timing and metadata
- **Multiple Strings**: Support for 3-string instrument layout
- **Time Slot System**: 16th-note based timing grid
- **Note Properties**: Fret, duration, dotted, tied status

### State Management
- **React State**: Centralized state management in App.tsx
- **Cursor Tracking**: Persistent cursor position
- **Playback State**: Track playing/paused/position states
- **Selection State**: Multi-note selection for ties

## Advanced Features

### Intelligent Spacing
- **Context-Aware Layout**: Notes spaced based on musical context
- **Measure Boundary Intelligence**: Smart spacing around measure lines
- **Visual Offset System**: Automatic spacing adjustments for readability

### Performance Features
- **Efficient Rendering**: Optimized SVG rendering for large tabs
- **Smooth Playback**: Real-time audio without glitches
- **Responsive UI**: Fast cursor movement and note placement

## Testing & Quality

### Test Coverage
- **Unit Tests**: Component and service testing
- **Integration Tests**: End-to-end Playwright tests
- **Measure Placement Tests**: Specific testing for intelligent measure features

### Browser Support
- **Cross-browser**: Chrome, Firefox, Safari compatibility
- **Touch Support**: Mobile and tablet interaction
- **Keyboard Accessibility**: Full keyboard navigation support

## Current Limitations & Known Issues

### Testing Issues
- **Measure Placement Bug**: 10th note shifted instead of 9th note in eighth note patterns
- **Coordinate System Conflicts**: Multiple positioning systems causing inconsistencies

### Architecture Complexity
- **Multiple Dependencies**: Complex interactions between positioning systems
- **Singleton Patterns**: Some components difficult to test independently

## Planned Features (Based on Roadmap)

### Video Sync Enhancements
- **Advanced Sync Points**: More sophisticated video-tab alignment
- **Multiple Video Sources**: Support for different video formats
- **Sync Accuracy Improvements**: More precise timing alignment

### UI Improvements
- **Fretboard Display**: Visual fretboard overlay
- **Loop Controls**: Set and play loop regions
- **Tempo Visualization**: Beat visualization and metronome flash

This comprehensive feature set makes the strumstick tab viewer a sophisticated tool for creating, editing, and playing tablature with intelligent measure management and video synchronization capabilities. 