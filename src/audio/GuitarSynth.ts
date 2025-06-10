import * as Tone from 'tone';

/**
 * Guitar-like synthesizer that simulates picked string sounds
 * Optimized version with shared effects and voice management
 */
export class GuitarSynth {
  private static instance: GuitarSynth;
  private isInitialized = false;
  
  // Shared audio effects (created once, reused)
  private reverb: Tone.Reverb | null = null;
  private distortion: Tone.Distortion | null = null;
  private limiter: Tone.Limiter | null = null;
  
  // Voice management
  private readonly MAX_VOICES = 8; // Limit concurrent notes
  private activeVoices: Map<string, {synth: Tone.Synth, bodyResonance: Tone.Synth}> = new Map();
  
  private constructor() {}

  public static getInstance(): GuitarSynth {
    if (!GuitarSynth.instance) {
      GuitarSynth.instance = new GuitarSynth();
    }
    return GuitarSynth.instance;
  }

  /**
   * Initialize the audio context and shared effects
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Tone.start();
      
      // Create shared effects chain (created once, reused for all notes)
      this.limiter = new Tone.Limiter(-6); // Prevent clipping
      
      this.reverb = new Tone.Reverb({
        decay: 3,
        preDelay: 0.01,
        wet: 0.2 // Reduced wetness to prevent muddiness
      });
      
      this.distortion = new Tone.Distortion(0.03); // Reduced distortion
      
      // Connect effects chain: distortion -> reverb -> limiter -> destination
      this.distortion.connect(this.reverb);
      this.reverb.connect(this.limiter);
      this.limiter.toDestination();
      
      this.isInitialized = true;
      console.log('🎸 GuitarSynth initialized with shared effects');
    } catch (error) {
      console.error('Failed to initialize GuitarSynth:', error);
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
   * Stop the oldest voice to make room for new ones
   */
  private stealVoice(): void {
    if (this.activeVoices.size === 0) return;
    
    // Get the first (oldest) voice
    const iterator = this.activeVoices.keys();
    const oldestKey = iterator.next().value;
    
    if (!oldestKey) return;
    
    const voice = this.activeVoices.get(oldestKey);
    
    if (voice) {
      // Fade out quickly to avoid clicks
      voice.synth.triggerRelease();
      voice.bodyResonance.triggerRelease();
      
      // Clean up after short delay
      setTimeout(() => {
        voice.synth.dispose();
        voice.bodyResonance.dispose();
      }, 100);
      
      this.activeVoices.delete(oldestKey);
    }
  }

  /**
   * Create a unique voice key for tracking
   */
  private getVoiceKey(fret: number, string: number): string {
    return `${string}-${fret}-${Date.now()}`;
  }

  /**
   * Play a single note with voice management
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

    // Validate inputs
    if (stringIndex < 0 || stringIndex > 2 || fret < 0 || fret > 12) {
      console.warn(`Invalid note: string ${stringIndex}, fret ${fret}`);
      return;
    }

    // Voice stealing if at limit
    if (this.activeVoices.size >= this.MAX_VOICES) {
      this.stealVoice();
    }

    const baseNotes = ['D3', 'A3', 'D4'];
    const baseNote = baseNotes[stringIndex];
    
    // Create new voice using shared effects
    const synth = new Tone.Synth({
      oscillator: {
        type: "sawtooth"
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.7,
        release: 2.0 // Shorter release to reduce overlap
      }
    }).connect(this.distortion!);
    
    const bodyResonance = new Tone.Synth({
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 2.5
      }
    }).connect(this.reverb!);
    
    // Calculate note
    const semitones = this.getSemitones(fret);
    const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
    
    // Create voice key and track it
    const voiceKey = this.getVoiceKey(fret, stringIndex);
    this.activeVoices.set(voiceKey, { synth, bodyResonance });
    
    console.log(`🎸 Playing: String ${stringIndex}, Fret ${fret} -> ${note} (${this.activeVoices.size}/${this.MAX_VOICES} voices)`);
    
    // Play both layers with controlled volume
    const mainVolume = velocity * 0.7; // Reduce main volume
    const bodyVolume = velocity * 0.15; // Much quieter body resonance
    
    synth.triggerAttackRelease(note, duration, undefined, mainVolume);
    
    // Body resonance with slight delay and lower volume
    setTimeout(() => {
      if (this.activeVoices.has(voiceKey)) {
        bodyResonance.triggerAttackRelease(note, duration, "+0.01", bodyVolume);
      }
    }, 5);
    
    // Clean up voice after note ends
    const cleanupTime = Tone.Time(duration).toSeconds() + 3; // Add release time
    setTimeout(() => {
      if (this.activeVoices.has(voiceKey)) {
        synth.dispose();
        bodyResonance.dispose();
        this.activeVoices.delete(voiceKey);
      }
    }, cleanupTime * 1000);
  }

  /**
   * Play multiple notes simultaneously (chord) with better voice management
   */
  public async playChord(
    notes: Array<{fret: number, string: number}>, 
    duration: Tone.Unit.Time = "2n",
    velocity: number = 0.7
  ): Promise<void> {
    // Reduce velocity for chords to prevent overload
    const chordVelocity = Math.min(velocity * 0.8, 0.6);
    
    // Play all notes with slight timing spread to avoid phase issues
    const promises = notes.map((note, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          this.playNote(note.fret, note.string, duration, chordVelocity).then(resolve);
        }, index * 2); // 2ms spread between notes
      });
    });
    
    await Promise.all(promises);
  }

  /**
   * Preview a single note with reduced volume and duration
   */
  public async previewNote(fret: number, stringIndex: number): Promise<void> {
    await this.playNote(fret, stringIndex, "16n", 0.4);
  }

  /**
   * Emergency stop all voices
   */
  public stopAllVoices(): void {
    console.log(`🛑 Stopping ${this.activeVoices.size} active voices`);
    
    this.activeVoices.forEach((voice) => {
      voice.synth.triggerRelease();
      voice.bodyResonance.triggerRelease();
      
      setTimeout(() => {
        voice.synth.dispose();
        voice.bodyResonance.dispose();
      }, 100);
    });
    
    this.activeVoices.clear();
  }

  /**
   * Get current voice count (for debugging)
   */
  public getVoiceCount(): number {
    return this.activeVoices.size;
  }

  /**
   * Check if the synth is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up all resources
   */
  public dispose(): void {
    this.stopAllVoices();
    
    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
    if (this.distortion) {
      this.distortion.dispose();
      this.distortion = null;
    }
    if (this.limiter) {
      this.limiter.dispose();
      this.limiter = null;
    }
    
    this.isInitialized = false;
    console.log('🧹 GuitarSynth disposed');
  }
} 