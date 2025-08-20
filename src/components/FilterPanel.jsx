import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const FilterPanel = ({
  selectedBusNumber,
  setSelectedBusNumber,
  activeFilters,
  popularRoutes,
  toggleFilter,
  clearAllFilters,
  handleTrackBus,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchRoute, setSearchRoute] = useState(''); // NEW state for search input

  return (
    <>
      {/* Toggle (Magnifying Glass) */}
      {!isOpen && (
        <button
          className="fixed top-24 left-15 z-50 bg-white p-3 rounded-full shadow-lg hover:scale-105 transition"
          onClick={() => setIsOpen(true)}
          aria-label="Open Filter Panel"
        >
          <Search className="w-5 h-5 text-indigo-600" />
        </button>
      )}

      {/* Slide-out Filter Panel */}
      <div
        className={`fixed top-20 left-15 z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="relative bg-white rounded-2xl shadow-2xl w-80 backdrop-blur-sm border border-white/20">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            onClick={() => setIsOpen(false)}
            aria-label="Close Filter Panel"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 pt-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white text-xs">
                🔍
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Filter Buses</h2>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Route
              </label>
              <input
                type="text"
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                placeholder="Enter route number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Routes Available
              </label>
              <div className="flex flex-wrap gap-2">
                {popularRoutes.map((route) => (
                  <button
                    key={route}
                    onClick={() => toggleFilter(route)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilters.includes(route)
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Route {route}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (searchRoute.trim()) {
                    toggleFilter(searchRoute); // ✅ filter by route instead of bus
                    setSearchRoute(''); // clear input after tracking
                  }
                }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                🎯 Track Bus
              </button>
              <button
                onClick={clearAllFilters}
                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Active filters:</div>
                <div className="flex flex-wrap gap-1">
                  {activeFilters.map((filter) => (
                    <span
                      key={filter}
                      className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs"
                    >
                      Route {filter}
                      <button
                        onClick={() => toggleFilter(filter)}
                        className="hover:bg-indigo-200 rounded-full"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
