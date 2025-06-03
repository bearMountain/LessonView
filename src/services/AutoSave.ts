import { FileManager, type AppState, type StrumstickProjectData } from './FileManager';

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxAutoSaves: number;
  storageKey: string;
}

export interface AutoSaveEntry {
  timestamp: string;
  data: StrumstickProjectData;
  hash: string; // Simple hash to detect duplicates
}

export interface RecoveryInfo {
  hasRecoveryData: boolean;
  lastAutoSave?: Date;
  entries: AutoSaveEntry[];
}

export class AutoSave {
  private fileManager: FileManager;
  private config: AutoSaveConfig;
  private isDirty: boolean = false;
  private lastSave: Date | null = null;
  private intervalId: number | null = null;
  private lastStateHash: string = '';

  constructor(fileManager: FileManager, config?: Partial<AutoSaveConfig>) {
    this.fileManager = fileManager;
    this.config = {
      enabled: true,
      intervalMs: 30000, // 30 seconds
      maxAutoSaves: 5,
      storageKey: 'strumstick-autosave',
      ...config
    };
  }

  // Start auto-save service
  start(): void {
    if (!this.config.enabled) {
      console.log('📴 Auto-save is disabled');
      return;
    }

    this.stop(); // Clear any existing interval
    
    console.log(`🔄 Starting auto-save with ${this.config.intervalMs / 1000}s interval`);
    
    this.intervalId = window.setInterval(() => {
      this.performAutoSave();
    }, this.config.intervalMs);
  }

  // Stop auto-save service
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Auto-save stopped');
    }
  }

  // Mark the current state as dirty (needs saving)
  markDirty(): void {
    this.isDirty = true;
  }

  // Mark the current state as clean (just saved)
  markClean(): void {
    this.isDirty = false;
    this.lastSave = new Date();
  }

  // Perform an auto-save operation
  async performAutoSave(appState?: AppState): Promise<boolean> {
    if (!this.isDirty || !appState) {
      return false; // Nothing to save
    }

    try {
      console.log('💾 Performing auto-save...');
      
      // Generate state hash to detect if anything actually changed
      const stateHash = this.generateStateHash(appState);
      if (stateHash === this.lastStateHash) {
        console.log('📄 State unchanged, skipping auto-save');
        return false;
      }
      
      // Serialize the current state
      const projectData = this.fileManager.serializeState(appState, {
        title: '[Auto-Save] ' + (appState.tabData.length > 0 ? 'Work in Progress' : 'Empty Project')
      });

      // Save to local storage
      await this.saveToLocalStorage(projectData);
      
      // Update tracking
      this.lastStateHash = stateHash;
      this.markClean();
      
      console.log('✅ Auto-save completed');
      return true;
      
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      return false;
    }
  }

  // Get recovery information
  getRecoveryInfo(): RecoveryInfo {
    try {
      const entries = this.getAutoSaveEntries();
      
      return {
        hasRecoveryData: entries.length > 0,
        lastAutoSave: entries.length > 0 ? new Date(entries[0].timestamp) : undefined,
        entries
      };
    } catch (error) {
      console.error('Failed to get recovery info:', error);
      return {
        hasRecoveryData: false,
        entries: []
      };
    }
  }

  // Recover the most recent auto-save
  recoverLatest(): StrumstickProjectData | null {
    try {
      const entries = this.getAutoSaveEntries();
      
      if (entries.length === 0) {
        console.log('📭 No auto-save data to recover');
        return null;
      }

      const latest = entries[0]; // Entries are sorted by timestamp desc
      console.log(`🔄 Recovering auto-save from ${latest.timestamp}`);
      
      return latest.data;
      
    } catch (error) {
      console.error('❌ Failed to recover auto-save:', error);
      return null;
    }
  }

  // Clear all auto-save data
  clearAutoSaves(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
      console.log('🗑️ Auto-save data cleared');
    } catch (error) {
      console.error('Failed to clear auto-saves:', error);
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<AutoSaveConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };
    
    // Restart if enabled state changed
    if (wasEnabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.start();
      } else {
        this.stop();
      }
    } else if (this.config.enabled && this.intervalId !== null) {
      // Restart with new interval if needed
      this.start();
    }
  }

  // Get current auto-save status
  getStatus(): {
    enabled: boolean;
    isDirty: boolean;
    lastSave: Date | null;
    intervalMs: number;
    nextSaveIn: number; // Milliseconds until next save
  } {
    const nextSaveIn = this.lastSave 
      ? Math.max(0, this.config.intervalMs - (Date.now() - this.lastSave.getTime()))
      : this.config.intervalMs;

    return {
      enabled: this.config.enabled,
      isDirty: this.isDirty,
      lastSave: this.lastSave,
      intervalMs: this.config.intervalMs,
      nextSaveIn
    };
  }

  // Private methods

  private async saveToLocalStorage(projectData: StrumstickProjectData): Promise<void> {
    try {
      const autoSaveEntry: AutoSaveEntry = {
        timestamp: new Date().toISOString(),
        data: projectData,
        hash: this.generateDataHash(projectData)
      };

      // Get existing entries
      const entries = this.getAutoSaveEntries();
      
      // Check if this save is different from the last one
      if (entries.length > 0 && entries[0].hash === autoSaveEntry.hash) {
        console.log('📄 Data unchanged since last auto-save, skipping');
        return;
      }

      // Add new entry at the beginning
      entries.unshift(autoSaveEntry);

      // Keep only the most recent saves
      const trimmed = entries.slice(0, this.config.maxAutoSaves);

      // Save to local storage
      const serialized = JSON.stringify(trimmed);
      
      // Check storage quota (rough estimate)
      if (serialized.length > 5 * 1024 * 1024) { // 5MB limit
        console.warn('⚠️ Auto-save data is getting large, clearing older entries');
        const reduced = trimmed.slice(0, 2); // Keep only 2 most recent
        localStorage.setItem(this.config.storageKey, JSON.stringify(reduced));
      } else {
        localStorage.setItem(this.config.storageKey, serialized);
      }

      console.log(`💾 Auto-save stored (${trimmed.length} entries, ${(serialized.length / 1024).toFixed(1)}KB)`);
      
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded, clearing old auto-saves');
        this.clearAutoSaves();
        // Try saving just this entry
        try {
          const singleEntry = [{ timestamp: new Date().toISOString(), data: projectData, hash: this.generateDataHash(projectData) }];
          localStorage.setItem(this.config.storageKey, JSON.stringify(singleEntry));
        } catch (retryError) {
          console.error('❌ Failed to save even single auto-save entry:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  }

  private getAutoSaveEntries(): AutoSaveEntry[] {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return [];

      const entries: AutoSaveEntry[] = JSON.parse(stored);
      
      // Sort by timestamp (newest first) and validate
      return entries
        .filter(entry => entry && entry.timestamp && entry.data)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
    } catch (error) {
      console.error('Failed to parse auto-save entries:', error);
      return [];
    }
  }

  private generateStateHash(appState: AppState): string {
    // Create a simple hash of the important state
    const stateString = JSON.stringify({
      tabDataLength: appState.tabData.length,
      tempo: appState.tempo,
      timeSignature: appState.timeSignature,
      tabDataHash: this.generateDataHash(appState.tabData)
    });
    
    return this.simpleHash(stateString);
  }

  private generateDataHash(data: any): string {
    const dataString = JSON.stringify(data);
    return this.simpleHash(dataString);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
} 