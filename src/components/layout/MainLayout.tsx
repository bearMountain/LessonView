import React from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  children?: React.ReactNode;
  toolbar?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  fretboard?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  centerWorkspace?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  toolbar,
  leftSidebar,
  rightSidebar,
  fretboard,
  bottomPanel,
  centerWorkspace,
}) => {
  // Determine layout class based on which components are provided
  const layoutClass = [
    'main-layout',
    fretboard ? 'main-layout--with-fretboard' : 'main-layout--no-fretboard',
    leftSidebar ? '' : 'main-layout--no-left-sidebar',
    rightSidebar ? '' : 'main-layout--no-right-sidebar',
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClass}>
      <header className="main-layout__toolbar">
        {toolbar}
      </header>
      
      {leftSidebar && (
        <aside className="main-layout__left-sidebar">
          {leftSidebar}
        </aside>
      )}
      
      <main className="main-layout__center-workspace">
        {centerWorkspace}
      </main>
      
      {rightSidebar && (
        <aside className="main-layout__right-sidebar">
          {rightSidebar}
        </aside>
      )}
      
      {fretboard && (
        <section className="main-layout__fretboard">
          {fretboard}
        </section>
      )}
      
      <footer className="main-layout__bottom-panel">
        {bottomPanel}
      </footer>
    </div>
  );
};

export default MainLayout; 