import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SpeciesPage from './pages/SpeciesPage';
import MapPage from './pages/MapPage';
import InsightsPage from './pages/InsightsPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/species" element={<SpeciesPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
