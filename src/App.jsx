// src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import FilterPanel from './components/FilterPanel';
import StatusIndicator from './components/StatusIndicator';
import FloatingActionButton from './components/FloatingActionButton';

function App() {
  const [selectedBusNumber, setSelectedBusNumber] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [isLiveTracking, setIsLiveTracking] = useState(true);

  const popularRoutes = ['1', '2', '3', '10', '11', '14', '15', '16', '18'];

  const toggleFilter = (route) => {
    setActiveFilters(prev => 
      prev.includes(route) 
        ? prev.filter(r => r !== route)
        : [...prev, route]
    );
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedBusNumber('');
  };

  const handleTrackBus = () => {
    if (selectedBusNumber) {
      console.log(`Tracking bus ${selectedBusNumber}`);
      // Here we'll integrate with the Metrobus API
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <MapContainer
        activeFilters={activeFilters}
        selectedBusNumber={selectedBusNumber}
      />
      <div className='fixed top-20 left-24 bg-white rounded-2xl shadow-2xl z-40 w-80 '>
        <FilterPanel
          selectedBusNumber={selectedBusNumber}
          setSelectedBusNumber={setSelectedBusNumber}
          activeFilters={activeFilters}
          popularRoutes={popularRoutes}
          toggleFilter={toggleFilter}
          clearAllFilters={clearAllFilters}
          handleTrackBus={handleTrackBus}
        />
      </div>
      
      <StatusIndicator isLiveTracking={isLiveTracking} />
      {/*<FloatingActionButton />*/}
    </div>
  );
}

export default App;