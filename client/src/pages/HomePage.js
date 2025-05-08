import React from 'react';
import marineLifeImage from '../marinelife.jpg';
import '../App.css';

export default function HomePage() {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
  <h1>Ocean Biodiversity & Climate Change Explorer</h1>
  <p className="homepage-tagline">
    Explore World Ocean Database and Ocean Biodiversity Information System data to understand climate impacts on marine life.
  </p>
  <img
    src={marineLifeImage}
    alt="Marine life"
    className="homepage-image"
  />
</header>
    </div>
  );
}