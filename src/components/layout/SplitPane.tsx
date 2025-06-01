import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SplitPane.css';

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  defaultSplitRatio?: number;
  minPaneSize?: number;
  orientation?: 'horizontal' | 'vertical';
  onSplitChange?: (ratio: number) => void;
}

const SplitPane: React.FC<SplitPaneProps> = ({
  children,
  defaultSplitRatio = 0.5,
  minPaneSize = 200,
  orientation = 'horizontal',
  onSplitChange,
}) => {
  const [splitRatio, setSplitRatio] = useState(defaultSplitRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newRatio: number;

    if (orientation === 'horizontal') {
      const x = e.clientX - rect.left;
      newRatio = x / rect.width;
    } else {
      const y = e.clientY - rect.top;
      newRatio = y / rect.height;
    }

    // Clamp the ratio to ensure minimum pane sizes
    const minRatio = minPaneSize / (orientation === 'horizontal' ? rect.width : rect.height);
    const maxRatio = 1 - minRatio;
    
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    
    setSplitRatio(newRatio);
    onSplitChange?.(newRatio);
  }, [isDragging, orientation, minPaneSize, onSplitChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  const paneStyle = orientation === 'horizontal'
    ? {
        firstPane: { width: `${splitRatio * 100}%` },
        secondPane: { width: `${(1 - splitRatio) * 100}%` },
      }
    : {
        firstPane: { height: `${splitRatio * 100}%` },
        secondPane: { height: `${(1 - splitRatio) * 100}%` },
      };

  return (
    <div 
      ref={containerRef}
      className={`split-pane split-pane--${orientation} ${isDragging ? 'split-pane--dragging' : ''}`}
    >
      <div className="split-pane__pane split-pane__pane--first" style={paneStyle.firstPane}>
        {children[0]}
      </div>
      
      <div 
        className="split-pane__divider"
        onMouseDown={handleMouseDown}
      >
        <div className="split-pane__divider-handle" />
      </div>
      
      <div className="split-pane__pane split-pane__pane--second" style={paneStyle.secondPane}>
        {children[1]}
      </div>
    </div>
  );
};

export default SplitPane; 