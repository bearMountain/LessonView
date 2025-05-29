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
    // Define the base notes for each string (Low D, A, Hi D)
    const baseNotes = ['D3', 'A3', 'D4'];
    const baseNote = baseNotes[stringIndex];
    
    // Create a reverb effect
    const reverb = new Tone.Reverb({
      decay: 4.5, // Reduced from 5 (10% shorter)
      preDelay: 0.01,
      wet: 0.25
    }).toDestination();
    
    // Add subtle distortion for pick-like attack
    const distortion = new Tone.Distortion(0.08).connect(reverb); // Slightly more distortion
    
    // Add chorus for richer guitar sound
    const chorus = new Tone.Chorus({
      frequency: 2,
      delayTime: 2.5,
      depth: 0.3,
      wet: 0.2
    }).connect(distortion);
    
    // Create the main guitar synth with multiple oscillators for richness
    const mainSynth = new Tone.Synth({
      oscillator: {
        type: "sawtooth8"  // More harmonics than basic sawtooth
      },
      envelope: {
        attack: 0.003,    // Even sharper pick attack
        decay: 0.08,      // Quick initial decay
        sustain: 0.6,     // Good sustain level
        release: 3.15     // Reduced from 3.5 (10% shorter)
      }
    }).connect(chorus);
    
    // Create a harmonic layer for guitar body resonance
    const harmonicSynth = new Tone.Synth({
      oscillator: {
        type: "triangle4"  // Rich harmonic content
      },
      envelope: {
        attack: 0.015,
        decay: 0.2,
        sustain: 0.3,
        release: 3.6      // Reduced from 4 (10% shorter)
      }
    }).connect(reverb);
    
    // Create a subtle sub-harmonic for depth
    const subSynth = new Tone.Synth({
      oscillator: {
        type: "sine"
      },
      envelope: {
        attack: 0.02,
        decay: 0.4,
        sustain: 0.15,
        release: 2.7      // Reduced from 3 (10% shorter)
      }
    }).connect(reverb);
    
    // Calculate the note based on the fret number using our diatonic mapping
    const semitones = getSemitones(fret);
    const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
    const subNote = Tone.Frequency(baseNote).transpose(semitones - 12).toNote(); // One octave lower
    
    // Play the main guitar sound
    mainSynth.triggerAttackRelease(note, "2n");
    
    // Add harmonic layer slightly delayed for realism
    setTimeout(() => {
      harmonicSynth.triggerAttackRelease(note, "2n", "+0.005", 0.25);
    }, 2);
    
    // Add subtle sub-harmonic for body resonance
    setTimeout(() => {
      subSynth.triggerAttackRelease(subNote, "2n", "+0.01", 0.1);
    }, 5);
    
    // Clean up after the sound dies out (reduced cleanup time by 10%)
    setTimeout(() => {
      mainSynth.dispose();
      harmonicSynth.dispose();
      subSynth.dispose();
      chorus.dispose();
      distortion.dispose();
      reverb.dispose();
    }, 5400); // Reduced from 6000
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