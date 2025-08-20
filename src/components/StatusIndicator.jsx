import React from 'react';

const StatusIndicator = ({ isLiveTracking }) => {
  return (
    <div className="fixed top-20 right-6 bg-white rounded-xl shadow-lg z-10 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isLiveTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium text-gray-700">
          {isLiveTracking ? 'Live Tracking Active' : 'Tracking Offline'}
        </span>
      </div>
    </div>
  );
};

export default StatusIndicator;