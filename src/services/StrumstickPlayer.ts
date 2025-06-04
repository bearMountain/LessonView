// Strumstick Player with Tone.js Integration
// Based on Strumstick Tab Viewer Architecture Specification v2.0

import * as Tone from 'tone';
import type { Tab, NoteStack, Duration } from '../types/notestack';
import { STRING_TUNINGS, DURATION_TO_TICKS } from '../types/notestack';

export class StrumstickPlayer {
  private synth: Tone.PolySynth;
  private currentPart: Tone.Part | null = null;
  private onPositionChange?: (position: number) => void;

  constructor() {
    this.synth = new Tone.PolySynth().toDestination();
    
    // Configure the synth for a more guitar-like sound
    this.synth.set({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.8
      }
    });
  }

  /**
   * Load a tab for playback
   */
  loadTab(tab: Tab): void {
    // Clear existing part
    if (this.currentPart) {
      this.currentPart.dispose();
    }

    // Generate playback sequence (handles repeats)
    const playbackSequence = this.generatePlaybackSequence(tab);
    
    // Convert to Tone.js events
    const events = playbackSequence
      .filter(stack => stack.notes.length > 0)
      .map(stack => ({
        time: this.positionToToneTime(stack.musicalPosition),
        pitches: stack.notes.map(note => this.fretToPitch(note.fret, note.string)),
        duration: this.durationToToneNotation(stack.duration),
        position: stack.musicalPosition
      }));

    // Create Tone.js Part
    this.currentPart = new Tone.Part((time, event) => {
      this.synth.triggerAttackRelease(event.pitches, event.duration, time);
      
      // Update position callback
      if (this.onPositionChange) {
        // Schedule the position update to happen at the correct time
        Tone.Transport.scheduleOnce(() => {
          if (this.onPositionChange) {
            this.onPositionChange(event.position);
          }
        }, time);
      }
    }, events);

    this.currentPart.start(0);
  }

  /**
   * Set position change callback
   */
  setPositionChangeCallback(callback: (position: number) => void): void {
    this.onPositionChange = callback;
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    await Tone.start();
    Tone.Transport.start();
  }

  /**
   * Pause playback
   */
  pause(): void {
    Tone.Transport.pause();
  }

  /**
   * Stop playback
   */
  stop(): void {
    Tone.Transport.stop();
  }
  
  /**
   * Jump to a specific musical position
   */
  jumpTo(musicalPosition: number): void {
    Tone.Transport.position = this.positionToToneTime(musicalPosition);
  }
  
  /**
   * Set the BPM
   */
  setBPM(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Get current transport position in ticks
   */
  getCurrentPosition(): number {
    const position = Tone.Transport.position;
    // Convert Tone.js Time to string before parsing
    const positionString = Tone.Time(position).toBarsBeatsSixteenths();
    return this.toneTimeToPosition(positionString);
  }

  /**
   * Check if currently playing
   */
  get isPlaying(): boolean {
    return Tone.Transport.state === 'started';
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.currentPart) {
      this.currentPart.dispose();
    }
    this.synth.dispose();
  }

  // === Private Helper Methods ===

  /**
   * Convert musical position (ticks) to Tone.js time notation
   */
  private positionToToneTime(position: number): string {
    const measures = Math.floor(position / 3840);  // 3840 ticks per measure in 4/4
    const beats = Math.floor((position % 3840) / 960);  // 960 ticks per quarter note
    const sixteenths = Math.floor((position % 960) / 240);  // 240 ticks per sixteenth note
    return `${measures}:${beats}:${sixteenths}`;
  }

  /**
   * Convert Tone.js time notation back to ticks
   */
  private toneTimeToPosition(timeNotation: string | number): number {
    if (typeof timeNotation === 'number') {
      // If it's already a number, assume it's in seconds and convert
      return Math.round(timeNotation * Tone.Transport.bpm.value * 4); // Rough conversion
    }

    const parts = timeNotation.split(':');
    if (parts.length !== 3) return 0;

    const measures = parseInt(parts[0]) || 0;
    const beats = parseInt(parts[1]) || 0;
    const sixteenths = parseInt(parts[2]) || 0;

    return (measures * 3840) + (beats * 960) + (sixteenths * 240);
  }

  /**
   * Convert duration to Tone.js notation
   */
  private durationToToneNotation(duration: Duration): string {
    const mapping: Record<Duration, string> = { 
      'whole': '1n', 
      'half': '2n', 
      'quarter': '4n', 
      'eighth': '8n', 
      'sixteenth': '16n' 
    };
    return mapping[duration];
  }

  /**
   * Convert fret and string to pitch
   */
  private fretToPitch(fret: number, string: number): string {
    const baseMidi = Tone.Frequency(STRING_TUNINGS[string]).toMidi();
    return Tone.Frequency(baseMidi + fret, 'midi').toNote();
  }

  /**
   * Generate playback sequence with repeat handling
   */
  private generatePlaybackSequence(tab: Tab): NoteStack[] {
    const playbackSequence: NoteStack[] = [];
    const sortedStacks = [...tab].sort((a, b) => a.musicalPosition - b.musicalPosition);
    
    let i = 0;
    const repeatStack: { startStackId: string; timesPlayed: number; maxRepeats: number }[] = [];
    
    while (i < sortedStacks.length) {
      const stack = sortedStacks[i];
      playbackSequence.push(stack);
      
      // Handle repeat end
      if (stack.repeatEnd) {
        const activeRepeat = repeatStack.find(r => r.startStackId === stack.repeatEnd!.jumpToStackId);
        
        if (!activeRepeat) {
          // First time hitting repeat end
          repeatStack.push({
            startStackId: stack.repeatEnd.jumpToStackId,
            timesPlayed: 1,
            maxRepeats: stack.repeatEnd.timesToRepeat || 1
          });
          
          // Jump back
          i = sortedStacks.findIndex(s => s.id === stack.repeatEnd!.jumpToStackId);
          continue;
        } else if (activeRepeat.timesPlayed < activeRepeat.maxRepeats) {
          // Repeat again
          activeRepeat.timesPlayed++;
          i = sortedStacks.findIndex(s => s.id === stack.repeatEnd!.jumpToStackId);
          continue;
        } else {
          // Done repeating
          const stackIndex = repeatStack.indexOf(activeRepeat);
          repeatStack.splice(stackIndex, 1);
        }
      }
      
      i++;
    }
    
    return playbackSequence;
  }
}

// Export a singleton instance
let playerInstance: StrumstickPlayer | null = null;

export const getStrumstickPlayer = (): StrumstickPlayer => {
  if (!playerInstance) {
    playerInstance = new StrumstickPlayer();
  }
  return playerInstance;
};

export const disposeStrumstickPlayer = (): void => {
  if (playerInstance) {
    playerInstance.dispose();
    playerInstance = null;
  }
}; 