import React from 'react';
import '../App.css';

export default function HomePage() {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1>Ocean Biodiversity & Climate Change Explorer</h1>
        <p>Explore World Ocean Database and Ocean Biodiversity Information System data to understand climate impacts on marine life.</p>
      </header>
      <nav className="homepage-nav">
        <a href="/species">Species Page</a>
        <a href="/map">Interactive Map</a>
        <a href="/insights">Insights Page</a>
        <a href="/test">Test Data</a>
      </nav>
    </div>
  );
}