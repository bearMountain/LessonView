import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  source?: string | File;
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
  isMuted?: boolean;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onMuteToggle?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  currentTime = 0,
  isPlaying = false,
  playbackRate = 1.0,
  isMuted = false,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onMuteToggle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Handle video source changes
  useEffect(() => {
    if (!source) {
      setVideoSrc('');
      return;
    }

    if (source instanceof File) {
      // Create object URL for File
      const url = URL.createObjectURL(source);
      setVideoSrc(url);
      
      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // Direct string URL
      setVideoSrc(source);
    }
  }, [source]);

  // Handle play/pause state
  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        onPlayStateChange?.(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, onPlayStateChange]);

  // Handle playback rate
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Handle external time updates
  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle mute state
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    onTimeUpdate?.(videoRef.current.currentTime);
  };

  const handleDurationChange = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    onDurationChange?.(dur);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    const error = video.error;
    
    if (error) {
      setVideoError(`Video error: ${error.message}`);
    }
  };

  const handleLoadedMetadata = () => {
    setVideoError(null);
  };

  return (
    <div className="video-player">
      {videoSrc ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="video-player__video"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onError={handleError}
            onLoadedMetadata={handleLoadedMetadata}
            controls={false} // We'll use custom controls
          />
          
          {/* Video Mute Button - Bottom Right */}
          {onMuteToggle && (
            <button
              className="video-player__mute-button"
              onClick={onMuteToggle}
              title={isMuted ? 'Unmute Video' : 'Mute Video'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
          
          {videoError && (
            <div className="video-player__error">
              {videoError}
            </div>
          )}
        </>
      ) : (
        <div className="video-player__placeholder">
          <div className="video-player__placeholder-content">
            <span className="video-player__placeholder-icon">🎬</span>
            <p>No video loaded</p>
            <p className="video-player__placeholder-hint">
              Add a video file to begin
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 