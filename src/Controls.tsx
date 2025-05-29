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
    
    // Create a synth
    const synth = new Tone.Synth().toDestination();
    
    // Calculate the note based on the fret number using our diatonic mapping
    const semitones = getSemitones(fret);
    const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
    
    // Play the note
    synth.triggerAttackRelease(note, "8n");
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