import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as Tone from 'tone';
import type { TabData } from './types';
import { DURATION_VALUES } from './types';

interface ControlsProps {
  tabData: TabData;
  cursorPosition: { timeIndex: number; stringIndex: number };
  onNotesPlaying: (notes: { fret: number; stringIndex: number }[]) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  onPlayPreviewNote?: (fret: number, stringIndex: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export interface ControlsRef {
  playPreviewNote: (fret: number, stringIndex: number) => void;
  playTab: () => void;
  stopPlayback: () => void;
}

const Controls = forwardRef<ControlsRef, ControlsProps>(({ tabData, cursorPosition, onNotesPlaying, tempo, onTempoChange, onPlayPreviewNote, onPlaybackStateChange }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(-1);
  const partRef = useRef<Tone.Part | null>(null);
  const synthsRef = useRef<{
    strings: Array<{
      main: Tone.Synth | null;
      harmonic: Tone.Synth | null;
      sub: Tone.Synth | null;
      noise: Tone.Noise | null;
    }>;
    effects: {
      reverb: Tone.Reverb | null;
      distortion: Tone.Distortion | null;
      filter: Tone.Filter | null;
      chorus: Tone.Chorus | null;
      vibrato: Tone.Vibrato | null;
    };
  }>({
    strings: [
      { main: null, harmonic: null, sub: null, noise: null }, // String 0
      { main: null, harmonic: null, sub: null, noise: null }, // String 1
      { main: null, harmonic: null, sub: null, noise: null }, // String 2
    ],
    effects: {
      reverb: null,
      distortion: null,
      filter: null,
      chorus: null,
      vibrato: null,
    }
  });

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

  // Initialize reusable synth instances
  const initializeSynths = () => {
    if (synthsRef.current.strings[0].main) return; // Already initialized
    
    try {
      // Create effects chain (shared by all strings)
      const reverb = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01,
        wet: 0.2
      }).toDestination();
      
      const distortion = new Tone.Distortion(0.15).connect(reverb);
      const filter = new Tone.Filter({
        frequency: 3500,
        type: "lowpass",
        rolloff: -12
      }).connect(distortion);
      
      const chorus = new Tone.Chorus({
        frequency: 3,
        delayTime: 2.5,
        depth: 0.4,
        wet: 0.3
      }).connect(filter);
      
      const vibrato = new Tone.Vibrato({
        frequency: 4.5,
        depth: 0.08
      }).connect(chorus);
      
      // Store shared effects
      synthsRef.current.effects = { reverb, distortion, filter, chorus, vibrato };
      
      // Create synths for each string (0, 1, 2)
      for (let stringIndex = 0; stringIndex < 3; stringIndex++) {
        const mainSynth = new Tone.Synth({
          oscillator: { type: "sawtooth" },
          detune: -2,
          envelope: {
            attack: 0.001,
            decay: 0.05,
            sustain: 0.2,
            release: 2.8
          }
        }).connect(vibrato);
        
        const harmonicSynth = new Tone.Synth({
          oscillator: { type: "square4" },
          detune: 3,
          envelope: {
            attack: 0.002,
            decay: 0.15,
            sustain: 0.4,
            release: 3.2
          }
        }).connect(filter);
        
        const subSynth = new Tone.Synth({
          oscillator: { type: "triangle" },
          detune: 1,
          envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0.2,
            release: 2.5
          }
        }).connect(reverb);
        
        const noise = new Tone.Noise({ type: "pink" }).connect(
          new Tone.Filter({
            frequency: 2000,
            type: "bandpass"
          }).connect(
            new Tone.Gain(0.03).connect(reverb)
          )
        );
        
        // Store synths for this string
        synthsRef.current.strings[stringIndex] = { 
          main: mainSynth, 
          harmonic: harmonicSynth, 
          sub: subSynth, 
          noise: noise 
        };
      }
      
      console.log('✅ Synths initialized for all 3 strings');
    } catch (error) {
      console.error('Error initializing synths:', error);
    }
  };

  // Cleanup synth instances
  const disposeSynths = () => {
    try {
      const synths = synthsRef.current;
      
      // Dispose synths for each string
      for (let stringIndex = 0; stringIndex < 3; stringIndex++) {
        const stringSynths = synths.strings[stringIndex];
        if (stringSynths.main) stringSynths.main.dispose();
        if (stringSynths.harmonic) stringSynths.harmonic.dispose();
        if (stringSynths.sub) stringSynths.sub.dispose();
        if (stringSynths.noise) stringSynths.noise.dispose();
        
        // Reset this string's references
        synths.strings[stringIndex] = { main: null, harmonic: null, sub: null, noise: null };
      }
      
      // Dispose shared effects
      const effects = synths.effects;
      if (effects.reverb) effects.reverb.dispose();
      if (effects.distortion) effects.distortion.dispose();
      if (effects.filter) effects.filter.dispose();
      if (effects.chorus) effects.chorus.dispose();
      if (effects.vibrato) effects.vibrato.dispose();
      
      // Reset effects references
      synths.effects = {
        reverb: null,
        distortion: null,
        filter: null,
        chorus: null,
        vibrato: null,
      };
      
      console.log('✅ Synths disposed for all strings');
    } catch (error) {
      console.error('Error disposing synths:', error);
    }
  };

  const playNote = async (fret: number, stringIndex: number, duration: number, scheduleTime?: number) => {
    // Ensure synths are initialized
    if (!synthsRef.current.strings[stringIndex].main) {
      console.error(`Synths for string ${stringIndex} not initialized`);
      return;
    }
    
    try {
      // Calculate sustain multiplier
      const baseSustainMultiplier = 0.8;
      const sustainMultiplier = baseSustainMultiplier * Math.sqrt(duration);
      
      // Define the base notes for each string (Low D, A, Hi D)
      const baseNotes = ['D3', 'A3', 'D4'];
      const baseNote = baseNotes[stringIndex];
      
      // Use the scheduled time if provided (for accurate timing)
      const when = scheduleTime !== undefined ? scheduleTime : "+0";
      
      // Calculate notes
      const semitones = getSemitones(fret);
      const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
      const subNote = Tone.Frequency(baseNote).transpose(semitones - 12).toNote();
      const harmonicNote = Tone.Frequency(baseNote).transpose(semitones + 12).toNote();
      
      // Calculate durations (tempo-independent)
      const baseDuration = 0.5;
      const mainDuration = baseDuration * sustainMultiplier;
      const harmonicDuration = baseDuration * 0.75 * sustainMultiplier;
      const subDuration = baseDuration * sustainMultiplier;
      
      // Get synth references
      const synths = synthsRef.current;
      
      // Play pick noise
      if (synths.strings[stringIndex].noise) {
        synths.strings[stringIndex].noise.start(when);
        const stopTime = typeof when === 'number' ? when + 0.005 : "+0.005";
        synths.strings[stringIndex].noise.stop(stopTime);
      }
      
      // Play main note
      if (synths.strings[stringIndex].main) {
        synths.strings[stringIndex].main.triggerAttackRelease(note, mainDuration, when);
      }
      
      // Play harmonic layer
      if (synths.strings[stringIndex].harmonic) {
        const harmonicTime = typeof when === 'number' ? when + 0.002 : "+0.002";
        synths.strings[stringIndex].harmonic.triggerAttackRelease(harmonicNote, harmonicDuration, harmonicTime, 0.2);
      }
      
      // Play sub layer
      if (synths.strings[stringIndex].sub) {
        const subTime = typeof when === 'number' ? when + 0.008 : "+0.008";
        synths.strings[stringIndex].sub.triggerAttackRelease(subNote, subDuration, subTime, 0.15);
      }
      
    } catch (error) {
      console.error(`Error in playNote for string ${stringIndex}:`, error);
    }
  };

  const playPreviewNote = async (fret: number, stringIndex: number) => {
    // Ensure synths are initialized
    if (!synthsRef.current.strings[stringIndex]?.main) {
      // Initialize synths if not already done
      await Tone.start();
      initializeSynths();
    }
    
    // Quick preview with shorter duration for immediate feedback
    try {
      const baseDuration = 0.8; // Longer than playback notes for clear preview
      
      // Define the base notes for each string (Low D, A, Hi D)
      const baseNotes = ['D3', 'A3', 'D4'];
      const baseNote = baseNotes[stringIndex];
      
      // Calculate notes
      const semitones = getSemitones(fret);
      const note = Tone.Frequency(baseNote).transpose(semitones).toNote();
      
      // Get synth references
      const synths = synthsRef.current.strings[stringIndex];
      
      // Play main note immediately for preview
      if (synths.main) {
        synths.main.triggerAttackRelease(note, baseDuration);
      }
      
      // Shorter harmonic for preview
      if (synths.harmonic) {
        const harmonicNote = Tone.Frequency(baseNote).transpose(semitones + 12).toNote();
        synths.harmonic.triggerAttackRelease(harmonicNote, baseDuration * 0.7, "+0.002", 0.15);
      }
      
    } catch (error) {
      console.error(`Error in preview note for string ${stringIndex}:`, error);
    }
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    playPreviewNote: playPreviewNote,
    playTab: playTab,
    stopPlayback: stopPlayback,
  }));

  const playTab = async () => {
    if (tabData.length === 0) return;
    
    console.log('=== STARTING METRONOME PLAYBACK ===');
    console.log(`Starting from cursor position: timeIndex=${cursorPosition.timeIndex}`);
    
    try {
      await Tone.start();
      
      // Initialize reusable synths
      initializeSynths();
      
      // Clear any existing transport scheduling
      console.log('Stopping and clearing existing transport...');
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;
      
      // Set tempo - Transport will handle BPM changes automatically
      console.log(`Setting tempo to ${tempo} BPM`);
      Tone.Transport.bpm.value = tempo;
      
      setIsPlaying(true);
      onPlaybackStateChange?.(true);
      setCurrentTimeIndex(cursorPosition.timeIndex);
      
      // Calculate starting position in sixteenth notes
      let startingSixteenthNote = 0;
      for (let i = 0; i < Math.min(cursorPosition.timeIndex, tabData.length); i++) {
        startingSixteenthNote += DURATION_VALUES[tabData[i].duration] * 4; // Convert to sixteenth notes
      }
      
      // Metronome state - starting from cursor position
      let currentSixteenthNote = startingSixteenthNote;
      let tabCursor = cursorPosition.timeIndex; // Start from cursor position
      let positionStartBeat = startingSixteenthNote; // When current position started
      
      // Calculate total duration in sixteenth notes for completion detection
      const totalSixteenthNotes = tabData.reduce((total, timePos) => {
        return total + (DURATION_VALUES[timePos.duration] * 4); // Convert quarter notes to sixteenth notes
      }, 0);
      
      console.log(`Tab has ${tabData.length} positions, ${totalSixteenthNotes} total sixteenth notes`);
      console.log(`Starting at sixteenth note ${startingSixteenthNote}, cursor at position ${tabCursor}`);
      
      // Log the timing plan from cursor position onward
      let planBeat = startingSixteenthNote;
      for (let i = cursorPosition.timeIndex; i < tabData.length; i++) {
        const timePos = tabData[i];
        const durationSixteenths = DURATION_VALUES[timePos.duration] * 4;
        const notesToPlay = timePos.notes.filter(note => note.type === 'note' && note.fret !== null);
        console.log(`Position ${i + 1}: starts at 16th ${planBeat}, duration ${durationSixteenths} 16ths, ${notesToPlay.length} notes`);
        planBeat += durationSixteenths;
      }
      
      // The metronome: fires every sixteenth note
      const metronomeId = Tone.Transport.scheduleRepeat((time) => {
        try {
          console.log(`🎵 Tick ${currentSixteenthNote}: cursor=${tabCursor}, posStart=${positionStartBeat}`);
          
          // Check if we're at the start of the current time position
          if (currentSixteenthNote === positionStartBeat && tabCursor < tabData.length) {
            const currentTimePos = tabData[tabCursor];
            const notesToPlay = currentTimePos.notes.filter(note => note.type === 'note' && note.fret !== null);
            
            setCurrentTimeIndex(tabCursor);
            
            if (notesToPlay.length > 0) {
              console.log(`  🎸 Playing ${notesToPlay.length} notes at position ${tabCursor + 1}`);
              
              // Update visual feedback first (clear previous notes)
              const playingNotes = notesToPlay.map(note => ({
                fret: note.fret!,
                stringIndex: note.stringIndex
              }));
              onNotesPlaying(playingNotes);
              
              // Play all notes at this position using the exact scheduled time
              notesToPlay.forEach(note => {
                console.log(`    Note: fret ${note.fret} on string ${note.stringIndex} (duration: ${note.duration})`);
                try {
                  playNote(note.fret!, note.stringIndex, DURATION_VALUES[note.duration], time);
                } catch (noteError) {
                  console.error(`Error playing note ${note.fret} on string ${note.stringIndex}:`, noteError);
                }
              });
              
            } else {
              console.log(`  ⏸️ Rest at position ${tabCursor + 1}`);
              // Clear visual feedback for rests
              onNotesPlaying([]);
            }
            
            // Move to next position
            const currentPosDuration = DURATION_VALUES[currentTimePos.duration] * 4; // Convert to sixteenth notes
            positionStartBeat += currentPosDuration;
            tabCursor++;
            
            console.log(`  ➡️ Advanced to cursor ${tabCursor}, next position starts at 16th ${positionStartBeat}`);
          }
          
          // Check if we've reached the end
          if (tabCursor >= tabData.length) {
            console.log('🏁 Reached end of tab, stopping...');
            // Use setTimeout to avoid cleanup issues during callback
            setTimeout(() => stopPlayback(), 10);
            return;
          }
          
          // Advance the metronome
          currentSixteenthNote++;
          
        } catch (error) {
          console.error('Error in metronome callback:', error);
          // Stop playback on error to prevent further issues
          setTimeout(() => stopPlayback(), 10);
        }
      }, "16n"); // Fire every sixteenth note
      
      // Store the metronome ID for cleanup
      partRef.current = { dispose: () => Tone.Transport.clear(metronomeId) } as any;
      
      // Start the transport
      Tone.Transport.start();
      
      console.log(`✅ Metronome started at ${tempo} BPM`);
      console.log('=== PLAYBACK RUNNING ===');
    } catch (error) {
      console.error('Error in playTab:', error);
      // Force reset even if playback failed
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      setCurrentTimeIndex(-1);
      onNotesPlaying([]);
      
      // Try to force clean the transport
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch (e) {
        console.error('Failed to clean transport:', e);
      }
    }
  };

  const stopPlayback = () => {
    console.log('🛑 Manually stopping metronome playback');
    
    try {
      // Stop and clear the transport
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;
      
      // Clean up the metronome callback
      if (partRef.current) {
        partRef.current.dispose();
        partRef.current = null;
      }
      
      // Reset UI state
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      setCurrentTimeIndex(-1);
      onNotesPlaying([]); // Clear any remaining visual feedback
      
      // Dispose reusable synths
      disposeSynths();
      
      console.log('✅ Playback stopped and cleaned up');
    } catch (error) {
      console.error('Error during playback cleanup:', error);
      // Force reset even if cleanup failed
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      setCurrentTimeIndex(-1);
      onNotesPlaying([]);
      
      // Try to force clean the transport
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch (e) {
        console.error('Failed to clean transport:', e);
      }
    }
  };

  // Count total notes for display
  const totalNotes = tabData.reduce((count, timePos) => count + timePos.notes.length, 0);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

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
          {isPlaying ? 'Stop' : `Play from position ${cursorPosition.timeIndex + 1}`}
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
});

export default Controls;