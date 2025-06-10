import * as Tone from 'tone';

/**
 * Guitar-like synthesizer that simulates picked string sounds
 * Based on the original synth from Controls.tsx commit f5bf878
 */
export class GuitarSynth {
  private static instance: GuitarSynth;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): GuitarSynth {
    if (!GuitarSynth.instance) {
      GuitarSynth.instance = new GuitarSynth();
    }
    return GuitarSynth.instance;
  }

  /**
   * Initialize the audio context - must be called after user interaction
   */
  public async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await Tone.start();
      this.isInitialized = true;
      console.log('🎸 GuitarSynth initialized');
    }
  }

  /**
   * Map fret numbers to semitones using diatonic scale
   * 0-D, 1-E, 2-F#, 3-G, 4-A, 5-B, 6-C, 7-C#, 8-D (octave), etc.
   */
  private getSemitones(fret: number): number {
    // First octave mapping (diatonic scale)
    const firstOctaveMap = [0, 2, 4, 5, 7, 9, 10, 11];
    // Calculate which octave we're in
    const octave = Math.floor(fret / 8);
    // Get the position within the octave  
    const position = fret % 8;
    // Get the semitones for this position
    const semitones = firstOctaveMap[position];
    // Add 12 semitones for each octave
    return semitones + (octave * 12);
  }

  /**
   * Play a single note with guitar-like characteristics
   * @param fret - Fret number (0-12)
   * @param stringIndex - String index (0=Low D, 1=A, 2=High D)
   * @param duration - Note duration (optional, defaults to "2n")
   * @param velocity - Note velocity 0-1 (optional, defaults to 0.7)
   */
  public async playNote(
    fret: number, 
    stringIndex: number, 
    duration: Tone.Unit.Time = "2n",
    velocity: number = 0.7
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Define the base notes for each string (Low D, A3, Hi D)
    const baseNotes = ['D3', 'A3', 'D4'];
    const baseNote = baseNotes[stringIndex];
    
    // Create a reverb effect
    const reverb = new Tone.Reverb({
      decay: 5,
      preDelay: 0.01,
      wet: 0.25
    }).toDestination();
    
    // Add subtle distortion for pick-like attack
    const distortion = new Tone.Distortion(0.05).connect(reverb);
    
    // Create a synth that sounds like a picked guitar string
    const synth = new Tone.Synth({
      oscillator: {
        type: "sawtooth"  // Rich harmonics like guitar strings
      },
      envelope: {
        attack: 0.005,    // Very sharp attack to simulate pick
        decay: 0.1,       // Quick initial decay
        sustain: 0.7,     // Good sustain level
        release: 3.5      // Long release for ring-out
      }
    }).connect(distortion);
    
    // Create a second layer for the "body" resonance
    const bodyResonance = new Tone.Synth({
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 4
      }
    }).connect(reverb);
    
    // Calculate the note based on the fret number using our diatonic mapping
    const semitones = this.getSemitones(fret);
    const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
    
    console.log(`🎸 Playing: String ${stringIndex}, Fret ${fret} -> ${note}`);
    
    // Play both the picked string and body resonance
    synth.triggerAttackRelease(note, duration, undefined, velocity);
    
    // Body resonance at lower volume and slightly delayed
    setTimeout(() => {
      bodyResonance.triggerAttackRelease(note, duration, "+0.01", velocity * 0.3);
    }, 5);
    
    // Clean up after the sound dies out
    setTimeout(() => {
      synth.dispose();
      bodyResonance.dispose();
      distortion.dispose();
      reverb.dispose();
    }, 6000);
  }

  /**
   * Play multiple notes simultaneously (chord)
   * @param notes - Array of {fret, string} objects
   * @param duration - Note duration (optional)
   * @param velocity - Note velocity (optional)
   */
  public async playChord(
    notes: Array<{fret: number, string: number}>, 
    duration: Tone.Unit.Time = "2n",
    velocity: number = 0.7
  ): Promise<void> {
    // Play all notes simultaneously
    const promises = notes.map(note => 
      this.playNote(note.fret, note.string, duration, velocity)
    );
    
    await Promise.all(promises);
  }

  /**
   * Preview a single note (for UI interactions)
   * @param fret - Fret number (0-12)
   * @param stringIndex - String index (0-2)
   */
  public async previewNote(fret: number, stringIndex: number): Promise<void> {
    await this.playNote(fret, stringIndex, "8n", 0.5);
  }

  /**
   * Check if the synth is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }
} 