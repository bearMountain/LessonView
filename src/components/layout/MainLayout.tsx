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
  return (
    <div className="main-layout">
      <header className="main-layout__toolbar">
        {toolbar}
      </header>
      
      <aside className="main-layout__left-sidebar">
        {leftSidebar}
      </aside>
      
      <main className="main-layout__center-workspace">
        {centerWorkspace}
      </main>
      
      <aside className="main-layout__right-sidebar">
        {rightSidebar}
      </aside>
      
      <section className="main-layout__fretboard">
        {fretboard}
      </section>
      
      <footer className="main-layout__bottom-panel">
        {bottomPanel}
      </footer>
    </div>
  );
};

export default MainLayout; 