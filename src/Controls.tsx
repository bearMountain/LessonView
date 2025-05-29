import React, { useState } from 'react';
import * as Tone from 'tone';

interface ControlsProps {
  tabData: (number | null)[][][];
}

const Controls: React.FC<ControlsProps> = ({ tabData }) => {
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

  const playNote = async (fret: number, stringIndex: number) => {
    // Define the base notes for each string (Low D, A, Hi D)
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
    const semitones = getSemitones(fret);
    const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
    
    // Play both the picked string and body resonance
    synth.triggerAttackRelease(note, "2n");
    // Body resonance at lower volume and slightly delayed
    setTimeout(() => {
      bodyResonance.triggerAttackRelease(note, "2n", "+0.01", 0.3);
    }, 5);
    
    // Clean up after the sound dies out
    setTimeout(() => {
      synth.dispose();
      bodyResonance.dispose();
      distortion.dispose();
      reverb.dispose();
    }, 6000);
  };

  const handlePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      setIsPlaying(true);
      
      // Play through all measures
      for (const measure of tabData) {
        for (const beat of measure) {
          // Play all non-null notes in the beat simultaneously
          beat.forEach((fret, stringIndex) => {
            if (fret !== null) {
              playNote(fret, stringIndex);
            }
          });
          
          // Wait for the duration of a beat (quarter note)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={handlePlay} disabled={isPlaying}>Play</button>
      <button onClick={handlePause} disabled={!isPlaying}>Pause</button>
    </div>
  );
};

export default Controls; 