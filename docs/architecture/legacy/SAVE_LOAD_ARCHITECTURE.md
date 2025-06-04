# Save/Load Architecture for Strumstick Tab Viewer

## 🎯 Goal
Implement a comprehensive save/load system that preserves all tab data, playback settings, video sync points, and user preferences while maintaining compatibility with standard music formats and enabling cloud storage integration.

## 📊 Current State Analysis

### Existing Data Structure
Based on our current implementation, we manage:
- **Tab Data**: Notes with timeSlots, fret positions, ties, durations
- **Playback State**: BPM, time signature, cursor position, playback settings
- **Video Sync**: Sync points, video source, playback rates
- **UI State**: Split ratios, toolbar settings, visual preferences

## 🗂️ File Format Strategy

### Primary Format: `.stab` (Strumstick Tab)
**JSON-based format optimized for our specific features**

```typescript
interface StrumstickTabFile {
  version: string;              // Format version for compatibility
  metadata: ProjectMetadata;
  tab: TabData;
  playback: PlaybackSettings;
  video?: VideoSyncData;
  ui?: UIPreferences;
  audio?: AudioSettings;
}

interface ProjectMetadata {
  title: string;
  artist?: string;
  composer?: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  modifiedAt: Date;
  duration: number;             // In seconds
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

### Export Formats
- **MIDI** (.mid): For DAW compatibility
- **MusicXML** (.xml): For notation software
- **JSON** (.json): For web integration
- **Audio** (.wav, .mp3): Using Tone.js Offline rendering

### Import Formats
- **MIDI** (.mid): Parse and convert to strumstick tab
- **Text Tab** (.txt): Parse ASCII tablature

## 🏗️ Technical Architecture

### 1. File Manager Service
```typescript
class FileManager {
  // Core operations
  async saveProject(data: ProjectData, format: SaveFormat): Promise<void>
  async loadProject(file: File | string): Promise<ProjectData>
  async exportProject(data: ProjectData, format: ExportFormat): Promise<Blob>
  async importProject(file: File, format: ImportFormat): Promise<ProjectData>
  
  // Auto-save functionality
  enableAutoSave(intervalMs: number): void
  disableAutoSave(): void
  
  // Recent files
  getRecentFiles(): RecentFile[]
  addToRecent(file: RecentFile): void
}
```

### 2. State Serialization
```typescript
interface StateSerializer {
  // Serialize current app state to saveable format
  serializeState(): ProjectData
  
  // Restore app state from loaded data
  deserializeState(data: ProjectData): void
  
  // Validate data integrity
  validateProjectData(data: any): ValidationResult
  
  // Handle version migrations
  migrateVersion(data: any, fromVersion: string): ProjectData
}
```

### 3. Tone.js Integration Strategy

#### Audio Rendering with Tone.js
```typescript
class AudioExporter {
  async exportToAudio(tabData: TabData, settings: AudioSettings): Promise<Blob> {
    // Use Tone.Offline for high-speed rendering
    const buffer = await Tone.Offline(async (context) => {
      const synth = new Tone.PolySynth().toDestination();
      
      // Schedule all notes based on tab data
      tabData.measures.forEach(measure => {
        measure.notes.forEach(note => {
          const time = this.timeSlotToSeconds(note.timeSlot, settings.bpm);
          const pitch = this.fretToPitch(note.fret, note.string);
          const duration = this.durationToSeconds(note.duration, settings.bpm);
          
          synth.triggerAttackRelease(pitch, duration, time);
        });
      });
    }, this.calculateDuration(tabData, settings.bpm));
    
    return this.bufferToBlob(buffer, 'audio/wav');
  }
}
```

#### MIDI Export Integration
```typescript
class MidiExporter {
  exportToMidi(tabData: TabData): Blob {
    // Convert our tab format to @tonejs/midi format
    const midi = new Midi();
    const track = midi.addTrack();
    
    tabData.measures.forEach(measure => {
      measure.notes.forEach(note => {
        track.addNote({
          midi: this.fretToMidiNumber(note.fret, note.string),
          time: this.timeSlotToSeconds(note.timeSlot, tabData.bpm),
          duration: this.durationToSeconds(note.duration, tabData.bpm),
          velocity: note.velocity || 0.8
        });
      });
    });
    
    return new Blob([midi.toArray()], { type: 'audio/midi' });
  }
}
```

## 📁 File Structure Design

### Project File (.stab) Structure
```json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Example Song",
    "artist": "Artist Name",
    "createdAt": "2024-12-21T12:00:00Z",
    "modifiedAt": "2024-12-21T12:30:00Z",
    "duration": 180.5,
    "tags": ["folk", "beginner"]
  },
  "tab": {
    "timeSignature": { "numerator": 4, "denominator": 4 },
    "bpm": 120,
    "measures": [
      {
        "number": 1,
        "notes": [
          {
            "timeSlot": 0,
            "string": 0,
            "fret": 2,
            "duration": "quarter",
            "velocity": 0.8,
            "tied": false
          }
        ]
      }
    ]
  },
  "playback": {
    "loopEnabled": false,
    "loopStart": 0,
    "loopEnd": 32,
    "metronomeEnabled": true,
    "synthSettings": {
      "instrument": "guitar",
      "volume": 0.7,
      "reverb": 0.2
    }
  },
  "video": {
    "source": "local:test-vid-1.mp4",
    "syncPoints": [
      { "videoTime": 0, "tabTimeSlot": 0, "confidence": 1.0 },
      { "videoTime": 30.5, "tabTimeSlot": 64, "confidence": 0.9 }
    ],
    "enabled": true
  },
  "ui": {
    "splitRatio": 0.5,
    "toolbarVisible": true,
    "fretboardVisible": true,
    "theme": "dark"
  }
}
```

## 💾 Storage Strategy

### Local Storage Options
1. **Browser Local Storage**: For auto-save and preferences
2. **IndexedDB**: For larger files and recent projects
3. **File System Access API**: For direct file operations (Chrome)
4. **Download/Upload**: Fallback for all browsers

### Cloud Storage Integration (Future)
```typescript
interface CloudProvider {
  name: 'google-drive' | 'dropbox' | 'onedrive';
  authenticate(): Promise<void>;
  save(data: ProjectData, filename: string): Promise<string>;
  load(fileId: string): Promise<ProjectData>;
  list(): Promise<CloudFile[]>;
}
```

## 🔄 Auto-Save System

### Auto-Save Strategy
```typescript
class AutoSave {
  private saveInterval: number = 30000; // 30 seconds
  private isDirty: boolean = false;
  private lastSave: Date;
  
  markDirty(): void {
    this.isDirty = true;
  }
  
  private async performAutoSave(): Promise<void> {
    if (!this.isDirty) return;
    
    try {
      const state = this.stateSerializer.serializeState();
      await this.storage.saveAutoSave(state);
      this.isDirty = false;
      this.lastSave = new Date();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
}
```

### Recovery System
- Detect browser crashes and offer recovery
- Store incremental changes for efficient saving
- Maintain multiple auto-save slots

## 🔧 Implementation Phases

### Phase 1: Core Save/Load (1-2 weeks)
**Goal**: Basic project save/load functionality

#### 1.1 State Management Integration
- Extend existing state to include saveable data
- Create serialization/deserialization functions
- Implement file validation

#### 1.2 File Operations
- Browser-based file save/load
- JSON format implementation
- Error handling and user feedback

#### 1.3 Auto-Save Foundation
- Local storage integration
- Change detection system
- Recovery mechanisms

### Phase 2: Format Support (1-2 weeks)
**Goal**: MIDI and audio export capabilities

#### 2.1 Tone.js Export Integration
- Implement `Tone.Offline` for audio rendering
- Configure synth settings for export
- Support various audio formats

#### 2.2 MIDI Export
- Integrate `@tonejs/midi` library
- Convert tab data to MIDI format
- Handle timing and velocity properly

#### 2.3 Import Capabilities
- MIDI import and conversion
- Basic text tab parsing
- File format detection

### Phase 3: Advanced Features (1 week)
**Goal**: Professional file management

#### 3.1 Recent Files System
- IndexedDB storage for recent projects
- Thumbnail generation
- Quick access menu

#### 3.2 Template System
- Save/load project templates
- Common tuning presets
- Starter projects for beginners

#### 3.3 Backup and Versioning
- Automatic backup system
- Version history (local)
- Export/import settings

## 🎵 Audio Export Technical Details

### Tone.js Offline Rendering
```typescript
async function exportAudio(
  tabData: TabData, 
  options: AudioExportOptions
): Promise<Blob> {
  const duration = calculateTotalDuration(tabData);
  
  const audioBuffer = await Tone.Offline(async () => {
    // Setup instruments
    const guitar = new Tone.PolySynth(Tone.FMSynth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }
    }).toDestination();
    
    // Apply effects based on settings
    if (options.reverb > 0) {
      const reverb = new Tone.Reverb(options.reverb).toDestination();
      guitar.connect(reverb);
    }
    
    // Schedule all notes
    tabData.measures.forEach(measure => {
      measure.notes.forEach(note => {
        const startTime = timeSlotToSeconds(note.timeSlot, tabData.bpm);
        const pitch = fretToPitch(note.fret, note.string);
        const duration = durationToSeconds(note.duration, tabData.bpm);
        
        guitar.triggerAttackRelease(pitch, duration, startTime, note.velocity);
      });
    });
  }, duration, 2, 44100);
  
  return audioBufferToBlob(audioBuffer, options.format);
}
```

## 🔍 Data Validation & Migration

### Validation Schema
```typescript
interface ValidationSchema {
  version: RegExp;
  metadata: {
    title: { required: true, type: 'string' };
    duration: { required: true, type: 'number', min: 0 };
  };
  tab: {
    bpm: { required: true, type: 'number', min: 60, max: 200 };
    measures: { required: true, type: 'array' };
  };
}
```

### Version Migration
```typescript
class ProjectMigrator {
  migrate(data: any, fromVersion: string, toVersion: string): ProjectData {
    const migrations = this.getMigrationPath(fromVersion, toVersion);
    
    return migrations.reduce((current, migration) => {
      return migration.transform(current);
    }, data);
  }
}
```

## 📊 Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load only necessary data initially
2. **Compression**: Gzip project files for storage
3. **Incremental Saves**: Only save changed data
4. **Background Processing**: Use Web Workers for heavy operations
5. **Memory Management**: Cleanup audio resources after export

### Target Performance Metrics
- Save operation: < 100ms for typical project
- Load operation: < 500ms including UI update
- Audio export: Real-time or faster (2x speed minimum)
- Auto-save impact: < 50ms UI freeze

## 🔐 Security & Privacy

### Data Safety
- Client-side processing only (no server uploads)
- Local encryption for sensitive projects
- Secure file handling practices
- User consent for cloud storage

### File System Security
- Validate all file inputs
- Sanitize file names
- Prevent path traversal attacks
- Limit file sizes and formats

This architecture provides a robust foundation for save/load functionality while maintaining compatibility with existing music software and enabling future cloud integration. 