import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import IntroAnimation from './components/IntroAnimation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LivePage from './pages/LivePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-container">
        {showIntro && (
          <IntroAnimation onComplete={() => setShowIntro(false)} />
        )}

        <Navbar onReplayIntro={handleReplayIntro} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/live" element={<LivePage />} />
          </Routes>
        </main>

        <Footer onReplayIntro={handleReplayIntro} />
      </div>
    </BrowserRouter>
  );
}
