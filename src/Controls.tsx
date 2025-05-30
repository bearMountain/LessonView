import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import type { TabData } from './types';
import { DURATION_VALUES } from './types';

interface ControlsProps {
  tabData: TabData;
  onNotesPlaying: (notes: { fret: number; stringIndex: number }[]) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ tabData, onNotesPlaying, tempo, onTempoChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(-1);
  const partRef = useRef<Tone.Part | null>(null);

  // String tuning (in Hz) - Strumstick is tuned to D-A-D
  const stringFrequencies = [146.83, 220.00, 293.66]; // Low D, A, Hi D
  
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

  const playNote = async (fret: number, stringIndex: number, duration: number, scheduleTime?: number) => {
    // === CENTRAL SUSTAIN CONTROL ===
    // More natural scaling: quarter note = 1.0, whole note = 2.0, sixteenth = 0.5
    const baseSustainMultiplier = 0.8; // Base sustain factor
    const sustainMultiplier = baseSustainMultiplier * Math.sqrt(duration); // Square root for more natural scaling
    
    // Define the base notes for each string (Low D, A, Hi D)
    const baseNotes = ['D3', 'A3', 'D4'];
    const baseNote = baseNotes[stringIndex];
    
    // Use the scheduled time if provided (for accurate timing)
    const when = scheduleTime !== undefined ? scheduleTime : "+0";
    
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
    
    // Calculate note durations based on sustain multiplier and note duration
    // Use fixed durations that don't change with tempo - tempo should only affect spacing
    const baseDuration = 0.5; // Fixed base duration in seconds (independent of tempo)
    const mainDuration = baseDuration * sustainMultiplier;
    const harmonicDuration = baseDuration * 0.75 * sustainMultiplier;
    const subDuration = baseDuration * sustainMultiplier;
    
    // TRIGGER THE SOUNDS using scheduled time:
    
    // Convert time to number if it's a string for calculations
    const timeAsNumber = typeof when === 'string' ? 0 : when;
    
    // Pick noise first (very brief)
    noise.start(when);
    if (typeof when === 'number') {
      noise.stop(when + 0.005);
    } else {
      noise.stop("+0.005");
    }
    
    // Main guitar sound
    mainSynth.triggerAttackRelease(note, mainDuration, when);
    
    // Add harmonic layer slightly delayed (simulates string settling)
    if (typeof when === 'number') {
      harmonicSynth.triggerAttackRelease(harmonicNote, harmonicDuration, when + 0.002, 0.2);
      // Add body resonance slightly delayed
      subSynth.triggerAttackRelease(subNote, subDuration, when + 0.008, 0.15);
    } else {
      harmonicSynth.triggerAttackRelease(harmonicNote, harmonicDuration, "+0.002", 0.2);
      // Add body resonance slightly delayed
      subSynth.triggerAttackRelease(subNote, subDuration, "+0.008", 0.15);
    }

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

  const playTab = async () => {
    if (tabData.length === 0) return;
    
    console.log('=== STARTING PLAYBACK ===');
    await Tone.start();
    
    // Clear any existing part and transport FIRST
    console.log('Stopping and clearing existing transport...');
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
    
    // Reset transport position to ensure clean state
    Tone.Transport.position = 0;
    
    // Set tempo directly and verify
    console.log(`Setting tempo from ${Tone.Transport.bpm.value} to ${tempo} BPM`);
    Tone.Transport.bpm.value = tempo;
    
    // Wait a moment to ensure tempo is applied
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Tempo confirmed: ${Tone.Transport.bpm.value} BPM`);
    
    setIsPlaying(true);

    // Simple sequential approach - create an event for EVERY time position
    const events: Array<{
      time: number; // Time in beats
      notes: Array<{ fret: number; stringIndex: number; duration: number }>;
      timeIndex: number;
    }> = [];
    
    let currentTime = 0;
    
    // Walk through EVERY time position, regardless of whether it has notes
    tabData.forEach((timePosition, timeIndex) => {
      const notesToPlay = timePosition.notes.filter(note => note.type === 'note' && note.fret !== null);
      
      // Create an event for every time position (even if no notes to play)
      events.push({
        time: currentTime,
        notes: notesToPlay.map(note => ({
          fret: note.fret!,
          stringIndex: note.stringIndex,
          duration: DURATION_VALUES[note.duration]
        })),
        timeIndex
      });
      
      // Move forward by the time position's duration
      const stepDuration = DURATION_VALUES[timePosition.duration];
      console.log(`Position ${timeIndex + 1}: scheduled at ${currentTime} beats, step duration ${stepDuration} beats, ${notesToPlay.length} notes`);
      currentTime += stepDuration;
    });

    console.log(`Created ${events.length} events for ${tabData.length} time positions`);
    console.log(`Total duration: ${currentTime} beats at ${tempo} BPM = ${(currentTime * 60/tempo).toFixed(2)} seconds`);
    
    // Log event timing details
    events.forEach((event, index) => {
      const expectedTimeMs = (event.time * 60 * 1000) / tempo; // Convert beats to milliseconds
      console.log(`Event ${index + 1}: ${event.time} beats = ${expectedTimeMs.toFixed(0)}ms from start`);
    });

    let startTimeMs = 0;
    let lastEventTimeMs = 0;

    // Create and start part
    partRef.current = new Tone.Part((time, event) => {
      const nowMs = Date.now();
      if (startTimeMs === 0) {
        startTimeMs = nowMs;
        lastEventTimeMs = nowMs;
      }
      
      const elapsedMs = nowMs - startTimeMs;
      const deltaSinceLastMs = nowMs - lastEventTimeMs;
      const expectedElapsedMs = (event.time * 60 * 1000) / tempo;
      const timingError = elapsedMs - expectedElapsedMs;
      
      console.log(`🎵 Position ${event.timeIndex + 1}: elapsed=${elapsedMs}ms, expected=${expectedElapsedMs.toFixed(0)}ms, error=${timingError.toFixed(0)}ms, delta=${deltaSinceLastMs}ms, scheduleTime=${time}`);
      
      lastEventTimeMs = nowMs;
      setCurrentTimeIndex(event.timeIndex);
      
      if (event.notes.length > 0) {
        // Play all notes at this time position using the scheduled time
        event.notes.forEach(noteData => {
          console.log(`  🎸 Playing fret ${noteData.fret} on string ${noteData.stringIndex} (duration: ${noteData.duration}) at schedule time ${time}`);
          playNote(noteData.fret, noteData.stringIndex, noteData.duration, time);
        });
        
        // Update visual feedback with all playing notes
        const playingNotes = event.notes.map(noteData => ({
          fret: noteData.fret,
          stringIndex: noteData.stringIndex
        }));
        onNotesPlaying(playingNotes);
        
        // Clear visual feedback after a short time
        setTimeout(() => {
          onNotesPlaying([]);
        }, 500);
      } else {
        console.log(`  ⏸️ Rest/empty position`);
      }
      
      // Check if this is the last event
      if (event.timeIndex === tabData.length - 1) {
        console.log('🏁 Last position reached - stopping UI, letting notes ring...');
        setIsPlaying(false);
        setCurrentTimeIndex(-1);
        
        setTimeout(() => {
          console.log('🧹 Cleaning up transport');
          Tone.Transport.stop();
          Tone.Transport.cancel();
          if (partRef.current) {
            partRef.current.dispose();
            partRef.current = null;
          }
          onNotesPlaying([]);
        }, 1000);
      }
    }, events);

    // Final verification before starting
    console.log(`🚀 About to start - Transport BPM: ${Tone.Transport.bpm.value}, Transport position: ${Tone.Transport.position}, Events: ${events.length}`);
    
    // Start playback
    partRef.current.start();
    Tone.Transport.start();
    
    console.log(`✅ Playback started at ${Date.now()}`);
    console.log('=== PLAYBACK RUNNING ===');
  };

  const stopPlayback = () => {
    console.log('Manually stopping playback');
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentTimeIndex(-1);
    onNotesPlaying([]);
  };

  // Count total notes for display
  const totalNotes = tabData.reduce((count, timePos) => count + timePos.notes.length, 0);

  return (
    <div className="controls">
      <h3>Playback Controls</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Tempo: {tempo} BPM
          <input
            type="range"
            min="30"
            max="400"
            value={tempo}
            onChange={(e) => onTempoChange(parseInt(e.target.value))}
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>
      </div>
      
      <div>
        <button onClick={isPlaying ? stopPlayback : playTab} disabled={tabData.length === 0}>
          {isPlaying ? 'Stop' : 'Play Tab'}
        </button>
      </div>
      
      {isPlaying && currentTimeIndex >= 0 && (
        <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
          Playing time position {currentTimeIndex + 1} of {tabData.length}
        </div>
      )}
      
      {tabData.length === 0 && (
        <div style={{ marginTop: '1rem', fontSize: '14px', color: '#999' }}>
          Add some notes to the tab to enable playback
        </div>
      )}
      
      {tabData.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
          {tabData.length} time positions, {totalNotes} total notes
        </div>
      )}
    </div>
  );
};

export default Controls;