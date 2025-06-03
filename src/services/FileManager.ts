import type { TabData, NoteDuration, NoteType, CursorPosition } from '../types';
import type { VideoConfig } from '../components/sync/SyncEngine';

// Project data structure for serialization
export interface StrumstickProjectData {
  version: string;
  metadata: ProjectMetadata;
  tab: TabSerializedData;
  playback: PlaybackSettings;
  video?: VideoSyncData;
  ui?: UIPreferences;
}

export interface ProjectMetadata {
  title: string;
  artist?: string;
  composer?: string;
  description?: string;
  tags: string[];
  createdAt: string;
  modifiedAt: string;
  duration: number; // In seconds
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface TabSerializedData {
  timeSignature: { numerator: number; denominator: number };
  bpm: number;
  totalTimeSlots: number;
  data: TabData; // Raw tab data
}

export interface PlaybackSettings {
  loopEnabled: boolean;
  loopStart?: number;
  loopEnd?: number;
  metronomeEnabled: boolean;
  countInEnabled: boolean;
  synthVolume: number;
  isMuted: boolean;
}

export interface VideoSyncData {
  source: string;
  recordedBPM: number;
  enabled: boolean;
}

export interface UIPreferences {
  splitRatio: number;
  toolbarVisible: boolean;
  fretboardVisible: boolean;
  theme?: string;
  zoom: number;
  selectedDuration: NoteDuration;
  selectedNoteType: NoteType;
}

// Current application state interface
export interface AppState {
  tabData: TabData;
  tempo: number;
  timeSignature: string;
  cursorPosition: CursorPosition;
  selectedDuration: NoteDuration;
  selectedNoteType: NoteType;
  zoom: number;
  showFretboard: boolean;
  countInEnabled: boolean;
  isLooping: boolean;
  splitRatio: number;
  videoSource: string;
  videoConfig?: VideoConfig;
  isSynthMuted: boolean;
  isVideoMuted: boolean;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Save result interface
export interface SaveResult {
  success: boolean;
  error?: string;
  filename?: string;
}

// Load result interface
export interface LoadResult {
  success: boolean;
  data?: StrumstickProjectData;
  error?: string;
}

// Recent file interface
export interface RecentFile {
  filename: string;
  path?: string;
  lastOpened: string;
  size: number;
  metadata: Partial<ProjectMetadata>;
}

export class FileManager {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly FILE_EXTENSION = '.stab';
  private static readonly MIME_TYPE = 'application/json';
  private static readonly LOCAL_STORAGE_KEY = 'strumstick-recent-files';
  private static readonly MAX_RECENT_FILES = 10;

  // Core save operation
  async saveProject(
    appState: AppState, 
    filename?: string, 
    metadata?: Partial<ProjectMetadata>
  ): Promise<SaveResult> {
    try {
      console.log('🗂️ Starting save operation...');
      
      // Serialize current state
      const projectData = this.serializeState(appState, metadata);
      
      // Validate the data
      const validation = this.validateProjectData(projectData);
      if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.errors);
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Convert to JSON
      const jsonData = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonData], { type: FileManager.MIME_TYPE });
      
      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename(projectData.metadata.title);
      
      // Try File System Access API first (Chrome), fallback to download
      const success = await this.saveFile(blob, finalFilename);
      
      if (success) {
        // Add to recent files
        this.addToRecentFiles({
          filename: finalFilename,
          lastOpened: new Date().toISOString(),
          size: blob.size,
          metadata: projectData.metadata
        });

        console.log('✅ Save completed successfully');
        return { success: true, filename: finalFilename };
      } else {
        return { success: false, error: 'Failed to save file' };
      }
    } catch (error) {
      console.error('❌ Save operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Core load operation
  async loadProject(file: File): Promise<LoadResult> {
    try {
      console.log('📂 Starting load operation...');
      
      // Validate file type
      if (!file.name.endsWith(FileManager.FILE_EXTENSION)) {
        return {
          success: false,
          error: `Invalid file type. Expected ${FileManager.FILE_EXTENSION} file.`
        };
      }

      // Read file content
      const content = await this.readFileContent(file);
      
      // Parse JSON
      let projectData: StrumstickProjectData;
      try {
        projectData = JSON.parse(content);
      } catch (parseError) {
        return {
          success: false,
          error: 'Invalid JSON format. File may be corrupted.'
        };
      }

      // Validate the loaded data
      const validation = this.validateProjectData(projectData);
      if (!validation.isValid) {
        console.error('❌ Loaded data validation failed:', validation.errors);
        return {
          success: false,
          error: `Invalid project file: ${validation.errors.join(', ')}`
        };
      }

      // Handle version migration if needed
      const migratedData = this.migrateVersion(projectData);

      // Add to recent files
      this.addToRecentFiles({
        filename: file.name,
        lastOpened: new Date().toISOString(),
        size: file.size,
        metadata: migratedData.metadata
      });

      console.log('✅ Load completed successfully');
      return { success: true, data: migratedData };
      
    } catch (error) {
      console.error('❌ Load operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Serialize current application state to project data
  serializeState(appState: AppState, additionalMetadata?: Partial<ProjectMetadata>): StrumstickProjectData {
    const now = new Date().toISOString();
    const [numerator, denominator] = appState.timeSignature.split('/').map(Number);
    
    // Calculate duration
    const duration = this.calculateDuration(appState.tabData, appState.tempo);

    return {
      version: FileManager.CURRENT_VERSION,
      metadata: {
        title: additionalMetadata?.title || 'Untitled Song',
        artist: additionalMetadata?.artist,
        composer: additionalMetadata?.composer,
        description: additionalMetadata?.description,
        tags: additionalMetadata?.tags || [],
        createdAt: additionalMetadata?.createdAt || now,
        modifiedAt: now,
        duration,
        difficulty: additionalMetadata?.difficulty
      },
      tab: {
        timeSignature: { numerator: numerator || 4, denominator: denominator || 4 },
        bpm: appState.tempo,
        totalTimeSlots: appState.tabData.length,
        data: appState.tabData
      },
      playback: {
        loopEnabled: appState.isLooping,
        loopStart: undefined, // TODO: Implement loop regions
        loopEnd: undefined,
        metronomeEnabled: true, // TODO: Make this configurable
        countInEnabled: appState.countInEnabled,
        synthVolume: 0.7, // TODO: Make this configurable
        isMuted: appState.isSynthMuted
      },
      video: appState.videoConfig ? {
        source: appState.videoSource,
        recordedBPM: appState.videoConfig.recordedBPM,
        enabled: true
      } : undefined,
      ui: {
        splitRatio: appState.splitRatio,
        toolbarVisible: true,
        fretboardVisible: appState.showFretboard,
        theme: 'dark',
        zoom: appState.zoom,
        selectedDuration: appState.selectedDuration,
        selectedNoteType: appState.selectedNoteType
      }
    };
  }

  // Deserialize project data to application state
  deserializeState(projectData: StrumstickProjectData): Partial<AppState> {
    const timeSignature = `${projectData.tab.timeSignature.numerator}/${projectData.tab.timeSignature.denominator}`;
    
    return {
      tabData: projectData.tab.data,
      tempo: projectData.tab.bpm,
      timeSignature,
      selectedDuration: projectData.ui?.selectedDuration || 'quarter',
      selectedNoteType: projectData.ui?.selectedNoteType || 'note',
      zoom: projectData.ui?.zoom || 1.0,
      showFretboard: projectData.ui?.fretboardVisible ?? true,
      countInEnabled: projectData.playback.countInEnabled,
      isLooping: projectData.playback.loopEnabled,
      splitRatio: projectData.ui?.splitRatio || 0.5,
      videoSource: projectData.video?.source || '',
      videoConfig: projectData.video ? {
        source: projectData.video.source,
        recordedBPM: projectData.video.recordedBPM
      } : undefined,
      isSynthMuted: projectData.playback.isMuted,
      isVideoMuted: false // Default value, not stored in project
    };
  }

  // Validate project data structure
  validateProjectData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if data exists and is an object
    if (!data || typeof data !== 'object') {
      errors.push('Invalid project file format');
      return { isValid: false, errors, warnings };
    }

    // Check version
    if (!data.version || typeof data.version !== 'string') {
      errors.push('Missing or invalid version');
    }

    // Check metadata
    if (!data.metadata || typeof data.metadata !== 'object') {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.title || typeof data.metadata.title !== 'string') {
        errors.push('Missing or invalid title');
      }
      if (data.metadata.duration !== undefined && typeof data.metadata.duration !== 'number') {
        errors.push('Invalid duration format');
      }
    }

    // Check tab data
    if (!data.tab || typeof data.tab !== 'object') {
      errors.push('Missing tab section');
    } else {
      if (typeof data.tab.bpm !== 'number' || data.tab.bpm < 60 || data.tab.bpm > 300) {
        errors.push('Invalid BPM value (must be between 60-300)');
      }
      if (!Array.isArray(data.tab.data)) {
        errors.push('Invalid tab data format');
      }
    }

    // Check playback settings
    if (!data.playback || typeof data.playback !== 'object') {
      errors.push('Missing playback section');
    }

    // Warnings for optional sections
    if (!data.ui) {
      warnings.push('Missing UI preferences, using defaults');
    }
    if (!data.video) {
      warnings.push('No video sync data found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Handle version migration
  migrateVersion(data: StrumstickProjectData): StrumstickProjectData {
    // Currently only version 1.0.0 exists, but this is where we'd handle upgrades
    if (data.version === FileManager.CURRENT_VERSION) {
      return data;
    }

    console.log(`🔄 Migrating from version ${data.version} to ${FileManager.CURRENT_VERSION}`);
    
    // For now, just update the version
    return {
      ...data,
      version: FileManager.CURRENT_VERSION
    };
  }

  // Calculate project duration in seconds
  private calculateDuration(tabData: TabData, bpm: number): number {
    if (tabData.length === 0) return 0;
    
    // Each timeSlot is a 16th note
    const totalSixteenthNotes = tabData.length;
    const quarterNotes = totalSixteenthNotes / 4;
    const minutes = quarterNotes / bpm;
    
    return minutes * 60;
  }

  // Generate a filename from title
  private generateFilename(title: string): string {
    const sanitized = title
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${sanitized || 'untitled'}-${timestamp}${FileManager.FILE_EXTENSION}`;
  }

  // Read file content as text
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Save file using File System Access API or download fallback
  private async saveFile(blob: Blob, filename: string): Promise<boolean> {
    try {
      // Try File System Access API (Chrome)
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Strumstick Tab Files',
            accept: { [FileManager.MIME_TYPE]: [FileManager.FILE_EXTENSION] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        console.log('💾 File saved using File System Access API');
        return true;
      }
    } catch (error) {
      console.warn('File System Access API failed, falling back to download:', error);
    }

    // Fallback to download method
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log('💾 File saved using download method');
      return true;
    } catch (error) {
      console.error('❌ Download fallback failed:', error);
      return false;
    }
  }

  // Recent files management
  getRecentFiles(): RecentFile[] {
    try {
      const stored = localStorage.getItem(FileManager.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load recent files:', error);
      return [];
    }
  }

  addToRecentFiles(file: RecentFile): void {
    try {
      const recent = this.getRecentFiles();
      
      // Remove existing entry for this file
      const filtered = recent.filter(f => f.filename !== file.filename);
      
      // Add new entry at the beginning
      filtered.unshift(file);
      
      // Keep only the most recent files
      const trimmed = filtered.slice(0, FileManager.MAX_RECENT_FILES);
      
      localStorage.setItem(FileManager.LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save to recent files:', error);
    }
  }

  clearRecentFiles(): void {
    localStorage.removeItem(FileManager.LOCAL_STORAGE_KEY);
  }
}

// Re-export AutoSave from its separate file
export { AutoSave } from './AutoSave'; 