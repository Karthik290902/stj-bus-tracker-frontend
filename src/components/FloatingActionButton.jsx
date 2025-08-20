import React from 'react';

const FloatingActionButton = () => {
  return (
    <button className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-40 md:hidden">
      <span className="text-xl">📍</span>
    </button>
  );
};

export default FloatingActionButton;