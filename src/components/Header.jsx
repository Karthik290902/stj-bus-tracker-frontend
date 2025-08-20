import React from 'react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 z-50 flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 font-bold text-lg">
          🚌
        </div>
        <h1 className="text-white text-xl font-bold">St. John's Bus Tracker</h1>
      </div>
    </header>
  );
};

export default Header;
