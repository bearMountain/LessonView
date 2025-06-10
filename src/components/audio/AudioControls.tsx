// Functional Audio Controls Component
// Demonstrates our new functional audio system

import React from 'react'
import { useAudio, useAudioState, usePlaybackControls } from '../../contexts/AudioContext'

interface AudioControlsProps {
  className?: string
}

export const AudioControls: React.FC<AudioControlsProps> = ({ className = '' }) => {
  // Pure functional hooks
  const audioState = useAudioState()
  const { play, stop, pause, setTempo, jumpTo } = usePlaybackControls()
  const { setVolume, toggleLoop, previewNote, initializeAudio } = useAudio()

  const handlePlayToggle = async () => {
    if (audioState.isPlaying) {
      pause()
    } else {
      await play()
    }
  }

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempo(Number(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value) / 100)
  }

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    jumpTo(Number(e.target.value))
  }

  const handlePreviewNote = (fret: number, string: number) => {
    previewNote(fret, string)
  }

  return (
    <div className={`audio-controls ${className}`} style={{
      padding: '16px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
        🎵 Functional Audio System
      </h3>

      {/* Debug Info */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '8px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#856404'
      }}>
        <div><strong>🐛 Debug Info:</strong></div>
        <div><strong>Sequence Length:</strong> {audioState.sequence.length} note stacks</div>
        <div><strong>Current Position:</strong> {audioState.currentPosition} ticks</div>
        <div><strong>Audio State:</strong> {audioState.isPlaying ? 'Playing' : 'Stopped'}</div>
        <div><strong>Tempo:</strong> {audioState.tempo} BPM</div>
        {audioState.sequence.length > 0 && (
          <div><strong>First Stack:</strong> {JSON.stringify(audioState.sequence[0]).substring(0, 100)}...</div>
        )}
      </div>

      {/* Playback Controls */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: '#555' }}>Playback</h4>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={handlePlayToggle}
            style={{
              padding: '8px 16px',
              backgroundColor: audioState.isPlaying ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {audioState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button 
            onClick={stop}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⏹️ Stop
          </button>

          <button 
            onClick={toggleLoop}
            style={{
              padding: '8px 16px',
              backgroundColor: audioState.isLooping ? '#ffc107' : '#6c757d',
              color: audioState.isLooping ? '#000' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Loop {audioState.isLooping ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Tempo Control */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: '#555' }}>
          Tempo: {audioState.tempo} BPM
        </h4>
        <input
          type="range"
          min="60"
          max="200"
          value={audioState.tempo}
          onChange={handleTempoChange}
          style={{ width: '200px' }}
        />
      </div>

      {/* Volume Control */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: '#555' }}>
          Volume: {Math.round(audioState.volume * 100)}%
        </h4>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(audioState.volume * 100)}
          onChange={handleVolumeChange}
          style={{ width: '200px' }}
        />
      </div>

      {/* Position Control */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: '#555' }}>
          Position: {audioState.currentPosition} ticks
        </h4>
        <input
          type="range"
          min="0"
          max="7680" // 2 measures worth of ticks
          value={audioState.currentPosition}
          onChange={handlePositionChange}
          style={{ width: '200px' }}
        />
      </div>

      {/* Note Preview */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: '#555' }}>Note Preview</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', maxWidth: '200px' }}>
          {[0, 1, 2, 3, 4].map(fret => (
            <div key={fret} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[2, 1, 0].map(string => ( // High to low string order for display
                <button
                  key={`${string}-${fret}`}
                  onClick={() => handlePreviewNote(fret, string)}
                  style={{
                    padding: '4px',
                    fontSize: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    minHeight: '24px'
                  }}
                  title={`String ${string}, Fret ${fret}`}
                >
                  {fret}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Click buttons to preview notes. Columns = frets (0-4), Rows = strings (Hi D, A, Low D)
        </div>
      </div>

      {/* Status Display */}
      <div style={{ 
        marginTop: '16px', 
        padding: '8px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#495057'
      }}>
        <div><strong>Status:</strong> {audioState.isPlaying ? '▶️ Playing' : '⏸️ Stopped'}</div>
        <div><strong>Sequence:</strong> {audioState.sequence.length} note stacks loaded</div>
        <div><strong>Loop:</strong> {audioState.isLooping ? 'Enabled' : 'Disabled'}</div>
      </div>


    </div>
  )
}

export default AudioControls 