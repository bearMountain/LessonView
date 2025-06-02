import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as Tone from 'tone';
import type { TabData } from './types';
import { getTotalNoteDuration } from './types';

interface ControlsProps {
  tabData: TabData;
  cursorPosition: { timeSlot: number; stringIndex: number };
  onNotesPlaying: (notes: { fret: number; stringIndex: number }[]) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onCurrentTimeSlotChange?: (timeSlot: number) => void;
  onCountInStateChange?: (isCountingIn: boolean, beat?: number, totalBeats?: number) => void;
  countInEnabled?: boolean;
  timeSignature?: string;
  isMuted?: boolean;
}

export interface ControlsRef {
  playPreviewNote: (fret: number, stringIndex: number) => void;
  playTab: () => void;
  stopPlayback: (clearVisualFeedback?: boolean) => void;
}

const Controls = forwardRef<ControlsRef, ControlsProps>(({ tabData, cursorPosition, onNotesPlaying, tempo, onTempoChange, onPlaybackStateChange, onCurrentTimeSlotChange, onCountInStateChange, countInEnabled, timeSignature, isMuted }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<number>(-1);
  const partRef = useRef<{ dispose: () => void } | null>(null);
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
  const currentlyPlayingNotesRef = useRef<Set<string>>(new Set());
  const finalNoteTimeoutRef = useRef<number | null>(null);

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

  // Helper functions to manage currently playing notes for precise visual feedback
  const addPlayingNote = (fret: number, stringIndex: number, timeSlot: number) => {
    const noteKey = `${fret}-${stringIndex}-${timeSlot}`;
    currentlyPlayingNotesRef.current.add(noteKey);
    updateVisualFeedback();
    return noteKey;
  };

  const removePlayingNote = (noteKey: string) => {
    currentlyPlayingNotesRef.current.delete(noteKey);
    updateVisualFeedback();
  };

  const updateVisualFeedback = () => {
    const playingNotes = Array.from(currentlyPlayingNotesRef.current).map(noteKey => {
      const [fretStr, stringIndexStr] = noteKey.split('-');
      return {
        fret: parseInt(fretStr),
        stringIndex: parseInt(stringIndexStr)
      };
    });
    onNotesPlaying(playingNotes);
  };

  const clearAllPlayingNotes = () => {
    currentlyPlayingNotesRef.current.clear();
    onNotesPlaying([]);
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

  const playNote = async (fret: number, stringIndex: number, duration: number, scheduleTime?: number, onNoteEnd?: () => void) => {
    // Ensure synths are initialized
    if (!synthsRef.current.strings[stringIndex].main) {
      console.error(`Synths for string ${stringIndex} not initialized`);
      return;
    }
    
    // Skip audio if muted, but still handle visual feedback and timing
    if (isMuted) {
      // Schedule the completion callback using Tone's precise timing even when muted
      if (onNoteEnd) {
        Tone.Transport.scheduleOnce(() => {
          onNoteEnd();
        }, `+${duration}`);
      }
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
      
      // Schedule the completion callback using Tone's precise timing
      if (onNoteEnd) {
        // Schedule callback to fire after the note duration
        // Using relative time from now (when this scheduling happens)
        Tone.Transport.scheduleOnce(() => {
          onNoteEnd();
        }, `+${duration}`);
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

    // Show finger circle for preview note
    onNotesPlaying([{ fret, stringIndex }]);
    
    // Skip audio if muted, but still show visual feedback
    if (isMuted) {
      // Clear the visual feedback after a short delay
      setTimeout(() => {
        onNotesPlaying([]);
      }, 800); // Same duration as unmuted preview
      return;
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
      
      // Clear the visual feedback after the note finishes
      setTimeout(() => {
        onNotesPlaying([]);
      }, baseDuration * 1000 + 100); // Clear after note duration plus small buffer
      
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
    
    console.log('=== STARTING TRANSPORT-BASED PLAYBACK ===');
    console.log(`Starting from cursor position: timeSlot=${cursorPosition.timeSlot}`);
    console.log(`Count-in enabled: ${countInEnabled}`);
    
    try {
      await Tone.start();
      
      // Ensure synths are initialized
      if (!synthsRef.current.strings[0].main) {
        initializeSynths();
      }
      
      // Clear any existing transport scheduling
      console.log('Stopping and clearing existing transport...');
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;
      
      // Clear any lingering visual feedback from previous playback
      clearAllPlayingNotes();
      
      // Set tempo - Transport will handle BPM changes automatically
      console.log(`Setting tempo to ${tempo} BPM`);
      Tone.Transport.bpm.value = tempo;
      
      setIsPlaying(true);
      onPlaybackStateChange?.(true);
      
      // Set initial playback indicator position to cursor location
      setCurrentTimeSlot(cursorPosition.timeSlot);
      onCurrentTimeSlotChange?.(cursorPosition.timeSlot);
      
      // Parse time signature to get beats per measure
      const [numerator] = (timeSignature || '4/4').split('/').map(Number);
      const beatsPerMeasure = numerator || 4;
      
      // Create metronome synth for count-in clicks
      let clickSynth: Tone.MembraneSynth | null = null;
      if (countInEnabled) {
        clickSynth = new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 2,
          envelope: {
            attack: 0.001,
            decay: 0.3,
            sustain: 0.01,
            release: 0.3
          }
        }).toDestination();
      }
      
      // If count-in is enabled, we'll schedule count-in beats before the tab data
      let countInSlots = 0;
      if (countInEnabled) {
        // Each beat is 4 sixteenth notes
        countInSlots = beatsPerMeasure * 4;
        console.log(`📍 Count-in will use ${countInSlots} slots (${beatsPerMeasure} beats)`);
      }
      
      // Track current position
      let absoluteSlot = 0; // Absolute position including count-in
      let tabCursor = cursorPosition.timeSlot; // Position in the actual tab data
      let countInBeat = 0;
      
      // The metronome: fires every sixteenth note
      const metronomeId = Tone.Transport.scheduleRepeat((time) => {
        try {
          // Handle count-in phase
          if (countInEnabled && absoluteSlot < countInSlots) {
            // We're in count-in phase
            // Play click on every 4th slot (quarter notes)
            if (absoluteSlot % 4 === 0) {
              countInBeat++;
              console.log(`🎵 Count-in beat ${countInBeat}/${beatsPerMeasure}`);
              
              // Update count-in state
              onCountInStateChange?.(true, countInBeat, beatsPerMeasure);
              
              // Play click sound (higher pitch for beat 1)
              const pitch = countInBeat === 1 ? 'C5' : 'C4';
              clickSynth!.triggerAttackRelease(pitch, '8n', time);
              
              // On the last count-in beat, notify completion
              if (countInBeat === beatsPerMeasure) {
                // Schedule the count-in state change for after this beat
                Tone.Transport.schedule(() => {
                  onCountInStateChange?.(false);
                  // Dispose of the click synth after use
                  if (clickSynth) {
                    clickSynth.dispose();
                    clickSynth = null;
                  }
                }, `+4n`); // After this beat completes
              }
            }
            
            // Keep the indicator at cursor position during count-in
            // Don't change currentTimeSlot during count-in
            
            absoluteSlot++;
            return; // Don't process tab data yet
          }
          
          // Main playback phase - check if we've reached the end
          if (tabCursor >= tabData.length) {
            // Don't process any more notes, but keep the transport running
            // The note completion callbacks will handle stopping when the last note finishes
            return;
          }
          
          const currentTimePos = tabData[tabCursor];
          
          if (currentTimePos) {
            // Filter for only note events (not rests)
            const notesToPlay = currentTimePos.notes.filter(note => note.type === 'note' && note.fret !== null);
            
            setCurrentTimeSlot(tabCursor);
            onCurrentTimeSlotChange?.(tabCursor);
            
            if (notesToPlay.length > 0) {
              console.log(`🎸 Playing ${notesToPlay.length} notes at position ${tabCursor + 1}`);
              
              // Play all notes at this position using the exact scheduled time
              notesToPlay.forEach(note => {
                // Skip if this note is tied from a previous note (already playing)
                if (note.isTiedFrom !== undefined) {
                  console.log(`  Skipping tied note: fret ${note.fret} on string ${note.stringIndex} (tied from slot ${note.isTiedFrom})`);
                  return;
                }
                
                console.log(`  Note: fret ${note.fret} on string ${note.stringIndex}`);
                
                // Calculate note duration including tied notes
                const totalDurationInQuarterNotes = getTotalNoteDuration(tabData, tabCursor, note.stringIndex);
                const durationInSeconds = (totalDurationInQuarterNotes * 60) / tempo;
                
                console.log(`  Duration: ${totalDurationInQuarterNotes} quarter notes = ${durationInSeconds.toFixed(2)}s (including ties)`);
                
                // Check if this is one of the last notes in the tab
                const isLastPosition = tabCursor === tabData.length - 1 || 
                  (tabCursor < tabData.length - 1 && tabData.slice(tabCursor + 1).every(pos => 
                    pos.notes.length === 0 || pos.notes.every(n => n.type === 'rest')
                  ));
                
                // Add note to tracking system
                const noteKey = addPlayingNote(note.fret!, note.stringIndex, tabCursor);
                
                // Play the note with completion callback
                playNote(note.fret!, note.stringIndex, durationInSeconds, time, () => {
                  // This callback is called when the note ends - remove from visual feedback
                  removePlayingNote(noteKey);
                  
                  // If this was the last note, check if we should stop
                  if (isLastPosition && currentlyPlayingNotesRef.current.size === 0) {
                    console.log('🏁 Last note finished, stopping playback...');
                    // Schedule stop in next tick to ensure clean shutdown
                    Tone.Transport.schedule(() => {
                      stopPlayback();
                    }, "+0.1");
                  }
                });
              });
              
            } else {
              console.log(`⏸️ Rest at position ${tabCursor + 1}`);
              // Don't clear visual feedback on rests - let the circles persist
            }
          }
          
          // Move to next position
          tabCursor++;
          absoluteSlot++;
          
        } catch (error) {
          console.error('Error in metronome callback:', error);
          // Stop playback on error to prevent further issues
          stopPlayback();
        }
      }, "16n", 0); // Fire every sixteenth note, starting immediately
      
      // Store the metronome ID for cleanup
      partRef.current = { dispose: () => Tone.Transport.clear(metronomeId) };
      
      // If starting from a cursor position with count-in, we need to account for that
      if (countInEnabled) {
        // Start from the beginning to include count-in
        Tone.Transport.position = "0:0:0";
      } else {
        // Jump directly to cursor position
        const transportPosition = `0:0:${cursorPosition.timeSlot}`;
        Tone.Transport.position = transportPosition;
        console.log(`📍 Set transport position to ${transportPosition}`);
      }
      
      // Set a maximum playback time to prevent infinite loops
      const maxPlaybackTime = (tabData.length / 4) * (60 / tempo) + 30; // Tab duration + 30 seconds buffer
      
      Tone.Transport.scheduleOnce(() => {
        console.log('⏰ Maximum playback time reached, stopping...');
        stopPlayback();
      }, `+${maxPlaybackTime}`);
      
      // Start the transport
      Tone.Transport.start();
      
      console.log(`✅ Transport started at ${tempo} BPM`);
      console.log('=== PLAYBACK RUNNING ===');
    } catch (error) {
      console.error('Error in playTab:', error);
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      setCurrentTimeSlot(-1);
      clearAllPlayingNotes();
      
      // Try to force clean the transport
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      } catch (e) {
        console.error('Failed to clean transport:', e);
      }
    }
  };

  const stopPlayback = (clearVisualFeedback: boolean = true) => {
    console.log('🛑 Stopping Transport playback, clearVisualFeedback:', clearVisualFeedback);
    
    try {
      // Clear any pending timeout
      if (finalNoteTimeoutRef.current) {
        clearTimeout(finalNoteTimeoutRef.current);
        finalNoteTimeoutRef.current = null;
      }
      
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
      
      // Only reset currentTimeSlot if we're fully stopping (not pausing)
      if (clearVisualFeedback) {
        setCurrentTimeSlot(-1);
        onCurrentTimeSlotChange?.(-1);
      }
      // If we're pausing (clearVisualFeedback=false), keep currentTimeSlot as is
      
      // Only clear visual feedback if requested
      if (clearVisualFeedback) {
        clearAllPlayingNotes();
      }
      
      console.log('✅ Transport stopped and cleaned up');
    } catch (error) {
      console.error('Error during Transport cleanup:', error);
      // Force reset even if cleanup failed
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      
      if (clearVisualFeedback) {
        setCurrentTimeSlot(-1);
        onCurrentTimeSlotChange?.(-1);
        clearAllPlayingNotes();
      }
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStopClick = () => stopPlayback();

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
        <button 
          onClick={isPlaying ? handleStopClick : playTab}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isPlaying ? '#dc3545' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '12px'
          }}
        >
          {isPlaying ? 'Stop' : `Play from position ${cursorPosition.timeSlot + 1}`}
        </button>
      </div>
      
      {isPlaying && currentTimeSlot >= 0 && (
        <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
          Playing time position {currentTimeSlot + 1} of {tabData.length}
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