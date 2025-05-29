import React, { useState } from 'react';
import * as Tone from 'tone';

interface ControlsProps {
  tabData: (number | null)[][][];
  onNotesPlaying?: (notes: { fret: number; stringIndex: number }[]) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ tabData, onNotesPlaying, tempo, onTempoChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Map fret numbers to semitones (0-D, 1-E, 2-F#, 3-G, 4-A, 5-B, 6-C, 7-C#, 8-D, etc.)
  const getSemitones = (fret: number): number => {
    // First octave mapping
    const firstOctaveMap = [0, 2, 4, 5, 7, 9, 10, 11];
    // Calculate which octave we're in
    const octave = Math.floor(fret / 8);
    // Get the position within the octave
    const position = fret % 8;
    // Get the semitones for this position
    const semitones = firstOctaveMap[position];
    // Add 12 semitones for each octave
    return semitones + (octave * 12);
  };

  // Calculate beat duration in milliseconds based on BPM
  const getBeatDuration = () => {
    // 60,000 ms per minute / BPM = ms per beat
    return 60000 / tempo;
  };

  const playNote = async (fret: number, stringIndex: number) => {
    // === CENTRAL SUSTAIN CONTROL ===
    // Adjust this single value to make notes ring longer (higher) or shorter (lower)
    // 1.0 = normal, 0.5 = half as long, 2.0 = twice as long
    const sustainMultiplier = 0.5;
    
    // Define the base notes for each string (Low D, A, Hi D)
    const baseNotes = ['D3', 'A3', 'D4'];
    const baseNote = baseNotes[stringIndex];
    
    // REVERB: Simulates the acoustic space/room
    const reverb = new Tone.Reverb({
      decay: 1.5 * sustainMultiplier,     // How long reverb lasts (shorter = drier, longer = more spacious)
      preDelay: 0.01, // Delay before reverb starts (simulates room size)
      wet: 0.2        // How much reverb vs dry signal (0 = no reverb, 1 = only reverb)
    }).toDestination();
    
    // DISTORTION: Adds harmonic saturation like tube amps/pickup saturation
    const distortion = new Tone.Distortion(0.15).connect(reverb); // Amount of saturation (0-1)
    
    // LOW PASS FILTER: Simulates the natural frequency response of guitar body/pickups
    const filter = new Tone.Filter({
      frequency: 3500,  // Cutoff frequency - higher = brighter, lower = warmer
      type: "lowpass",  // Removes frequencies above the cutoff
      rolloff: -12      // How steep the cutoff is (-12dB, -24dB, etc.)
    }).connect(distortion);
    
    // CHORUS: Creates slight pitch/timing variations for richer sound
    const chorus = new Tone.Chorus({
      frequency: 3,    // Speed of modulation (Hz)
      delayTime: 2.5,  // Base delay time (ms)
      depth: 0.4,      // How deep the modulation goes (0-1)
      wet: 0.3         // How much chorus effect vs dry (0-1)
    }).connect(filter);
    
    // VIBRATO: Adds subtle pitch wobble to make it less mechanically perfect
    const vibrato = new Tone.Vibrato({
      frequency: 4.5,   // Speed of vibrato (Hz) - faster = more nervous
      depth: 0.08       // Depth of pitch variation (0-1) - higher = more wobbly
    }).connect(chorus);
    
    // MAIN GUITAR SYNTH: Primary tone generator
    const mainSynth = new Tone.Synth({
      oscillator: {
        type: "sawtooth"  // Rich in harmonics (sawtooth = bright, square = hollow, sine = pure)
      },
      detune: -2,         // Slightly flat for realism (cents, -100 to 100)
      envelope: {
        attack: 0.001,    // Pick attack time - shorter = sharper pick attack
        decay: 0.05,      // Initial volume drop after attack
        sustain: 0.2,     // Sustained volume level (0-1)
        release: 2.8 * sustainMultiplier      // How long note takes to fade out
      }
    }).connect(vibrato);
    
    // HARMONIC LAYER: Adds upper harmonics for steel string brightness
    const harmonicSynth = new Tone.Synth({
      oscillator: {
        type: "square4"  // Square wave with 4 harmonics - adds metallic brightness
      },
      detune: 3,         // Slightly sharp to create beating with main oscillator
      envelope: {
        attack: 0.002,
        decay: 0.15,
        sustain: 0.4,     // Lower sustain than main - harmonics fade faster
        release: 3.2 * sustainMultiplier
      }
    }).connect(filter);
    
    // SUB-HARMONIC: Adds body/depth like guitar body resonance
    const subSynth = new Tone.Synth({
      oscillator: {
        type: "triangle" // Warm, round tone for body
      },
      detune: 1,         // Slight detuning for realism
      envelope: {
        attack: 0.005,    // Slower attack - body resonance builds up
        decay: 0.3,
        sustain: 0.2,     // Quiet but present
        release: 2.5 * sustainMultiplier
      }
    }).connect(reverb);
    
    // PICK NOISE: Simulates the actual pick hitting the string
    const noise = new Tone.Noise({
      type: "pink"      // Pink noise has more low-end than white noise
    }).connect(
      new Tone.Filter({
        frequency: 2000,  // Filter noise to sound like pick scrape
        type: "bandpass"  // Only frequencies around 2000Hz pass through
      }).connect(
        new Tone.Gain(0.03).connect(reverb) // Very quiet pick noise
      )
    );
    
    // Calculate the note based on the fret number using our diatonic mapping
    const semitones = getSemitones(fret);
    const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
    const subNote = Tone.Frequency(baseNote).transpose(semitones - 12).toNote(); // One octave lower
    const harmonicNote = Tone.Frequency(baseNote).transpose(semitones + 12).toNote(); // One octave higher
    
    // Calculate note durations based on sustain multiplier
    const mainDuration = Tone.Time("2n").toSeconds() * sustainMultiplier;
    const harmonicDuration = Tone.Time("1.5n").toSeconds() * sustainMultiplier;
    const subDuration = Tone.Time("2n").toSeconds() * sustainMultiplier;
    
    // TRIGGER THE SOUNDS:
    
    // Pick noise first (very brief)
    noise.start();
    noise.stop("+0.005"); // Stop after 5ms
    
    // Main guitar sound
    mainSynth.triggerAttackRelease(note, mainDuration);
    
    // Add harmonic layer slightly delayed (simulates string settling)
    setTimeout(() => {
      harmonicSynth.triggerAttackRelease(harmonicNote, harmonicDuration, "+0.002", 0.2);
    }, 1);
    
    // Add body resonance slightly delayed
    setTimeout(() => {
      subSynth.triggerAttackRelease(subNote, subDuration, "+0.008", 0.15);
    }, 3);
    
    // Clean up after the sound dies out (scaled with sustain)
    setTimeout(() => {
      mainSynth.dispose();
      harmonicSynth.dispose();
      subSynth.dispose();
      noise.dispose();
      vibrato.dispose();
      chorus.dispose();
      filter.dispose();
      distortion.dispose();
      reverb.dispose();
    }, 4500 * sustainMultiplier);
  };

  const handlePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      setIsPlaying(true);
      
      const beatDuration = getBeatDuration();
      
      // Play through all measures
      for (const measure of tabData) {
        for (const beat of measure) {
          // Collect currently playing notes
          const currentNotes: { fret: number; stringIndex: number }[] = [];
          
          // Play all non-null notes in the beat simultaneously
          beat.forEach((fret, stringIndex) => {
            if (fret !== null) {
              playNote(fret, stringIndex);
              currentNotes.push({ fret, stringIndex });
            }
          });
          
          // Show dots on fretboard
          if (onNotesPlaying) {
            onNotesPlaying(currentNotes);
          }
          
          // Wait for the duration of a beat based on tempo
          await new Promise(resolve => setTimeout(resolve, beatDuration));
          
          // Clear dots after beat
          if (onNotesPlaying) {
            onNotesPlaying([]);
          }
        }
      }
      
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    if (onNotesPlaying) {
      onNotesPlaying([]);
    }
  };

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = Math.max(30, Math.min(300, parseInt(e.target.value) || 120));
    onTempoChange(newTempo);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>
          Tempo (BPM):
          <input
            type="number"
            value={tempo}
            onChange={handleTempoChange}
            min="30"
            max="300"
            step="1"
            style={{ 
              marginLeft: 8, 
              width: 60, 
              padding: 4,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
        </label>
      </div>
      
      <button onClick={handlePlay} disabled={isPlaying}>Play</button>
      <button onClick={handlePause} disabled={!isPlaying}>Pause</button>
    </div>
  );
};

export default Controls; 