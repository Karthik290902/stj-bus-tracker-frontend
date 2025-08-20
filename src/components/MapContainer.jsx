// Enhanced MapContainer.jsx with improved filtering
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import busAPI from '../services/busAPI.js';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzRGNDZFNSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzRGNDZFNSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  shadowUrl: null,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom bus icon with route color and status
const createBusIcon = (bus, routeColor = '#10B981') => {
  const color = routeColor && routeColor !== 'FF0000' ? `#${routeColor}` : '#10B981';
  const isMoving = bus.speed > 0;
  
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: 2px solid white;
        border-radius: 8px;
        width: 32px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 1000;
        ${!isMoving ? 'opacity: 0.7; border-color: #fbbf24;' : ''}
      ">
        ${bus.route_number || bus.number || '?'}
      </div>
    `,
    className: 'custom-bus-icon',
    iconSize: [32, 24],
    iconAnchor: [16, 12]
  });
};

// Custom bus stop icon
const createBusStopIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background: #4F46E5;
        border: 2px solid white;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      "></div>
    `,
    className: 'custom-stop-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

// Function to parse CSV data (fallback)
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',');
    const item = {};
    
    headers.forEach((header, i) => {
      item[header.trim()] = values[i] ? values[i].replace(/"/g, '').trim() : '';
    });
    
    return item;
  });
};

// Strict filtering function - ONLY show buses that match active filters
const applyClientSideFilters = (buses, activeFilters, selectedBusNumber) => {
  console.log('=== FILTERING START ===');
  console.log('Total buses:', buses.length);
  console.log('Active filters:', activeFilters, typeof activeFilters, Array.isArray(activeFilters));
  console.log('Selected bus number:', selectedBusNumber);
  
  // If no filters are active, show all buses
  if ((!activeFilters || activeFilters.length === 0) && (!selectedBusNumber || !selectedBusNumber.trim())) {
    console.log('No filters active - showing all buses');
    return buses;
  }
  
  let filteredBuses = [];
  
  // Filter by route numbers - STRICT matching
  if (activeFilters && activeFilters.length > 0) {
    console.log('Applying route filters...', activeFilters);
    
    filteredBuses = buses.filter(bus => {
      // Get the bus route number (try different field names)
      const busRoute = bus.route_number || bus.routenumber || bus.route;
      const busRouteStr = String(busRoute).trim();
      
      console.log(`Checking bus ${bus.id}: route_number=${bus.route_number}, routenumber=${bus.routenumber}, route=${bus.route}, final="${busRouteStr}"`);
      
      // Check if this bus route matches ANY of the active filters
      const matches = activeFilters.some(filter => {
        const filterStr = String(filter).trim();
        
        // Try different comparison methods
        const exactMatch = busRouteStr === filterStr;
        const numericMatch = Number(busRoute) === Number(filter);
        
        console.log(`  Comparing "${busRouteStr}" with filter "${filterStr}": exact=${exactMatch}, numeric=${numericMatch}`);
        
        if (exactMatch || numericMatch) {
          console.log(`✅ Bus ${bus.id} matches filter "${filterStr}"`);
          return true;
        }
        
        return false;
      });
      
      if (!matches) {
        console.log(`❌ Bus ${bus.id} (route: "${busRouteStr}") does not match any filter`);
      }
      
      return matches;
    });
    
    console.log(`After route filtering: ${filteredBuses.length} buses remain out of ${buses.length}`);
    console.log('Filtered buses:', filteredBuses.map(b => ({ id: b.id, route: b.route_number })));
  } else {
    // No route filters, start with all buses
    filteredBuses = [...buses];
  }
  
  // Filter by specific bus number if provided
  if (selectedBusNumber && selectedBusNumber.trim()) {
    const searchNumber = selectedBusNumber.trim().toLowerCase();
    console.log(`Applying bus number filter: "${searchNumber}"`);
    
    filteredBuses = filteredBuses.filter(bus => {
      const busNumber = String(bus.number || bus.vehicle || bus.veh || bus.id || '').toLowerCase();
      const matches = busNumber.includes(searchNumber);
      
      if (matches) {
        console.log(`✅ Bus ${bus.id} (number: "${busNumber}") matches search "${searchNumber}"`);
      }
      
      return matches;
    });
    
    console.log(`After bus number filtering: ${filteredBuses.length} buses remain`);
  }
  
  console.log('=== FILTERING COMPLETE ===');
  console.log(`Final result: ${filteredBuses.length}/${buses.length} buses will be shown`);
  console.log('Final filtered buses:', filteredBuses.map(b => ({
    id: b.id,
    number: b.number,
    route: b.route_number || b.routenumber || b.route
  })));
  
  return filteredBuses;
};

const MapContainer = ({ activeFilters = [], selectedBusNumber = '' }) => {
  const [allBuses, setAllBuses] = useState([]); // Store all buses
  const [filteredBuses, setFilteredBuses] = useState([]); // Display filtered buses
  const [busStops, setBusStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState('connecting');

  // St. John's coordinates
  const ST_JOHNS_CENTER = [47.5615, -52.7126];

  // Check API health
  const checkAPIHealth = useCallback(async () => {
    try {
      const health = await busAPI.healthCheck();
      setApiStatus(health.success ? 'connected' : 'error');
      console.log('API Health Check:', health);
    } catch (error) {
      setApiStatus('offline');
      console.error('API health check failed:', error);
    }
  }, []);

  // Apply filters whenever buses or filters change
  useEffect(() => {
    console.log('=== FILTER UPDATE TRIGGERED ===');
    console.log('Total buses available:', allBuses.length);
    console.log('Active filters received:', activeFilters, 'Type:', typeof activeFilters, 'IsArray:', Array.isArray(activeFilters));
    console.log('Selected bus number received:', selectedBusNumber, 'Type:', typeof selectedBusNumber);
    
    // Force re-render by ensuring we have the latest props
    console.log('Props check - activeFilters:', activeFilters, 'selectedBusNumber:', selectedBusNumber);
    
    // Log some sample bus data to understand the format
    if (allBuses.length > 0) {
      console.log('Sample bus data (first 3):');
      allBuses.slice(0, 3).forEach((bus, i) => {
        console.log(`Bus ${i + 1}:`, {
          id: bus.id,
          number: bus.number,
          route_number: bus.route_number,
          routenumber: bus.routenumber,
          route: bus.route
        });
      });
    }
    
    const filtered = applyClientSideFilters(allBuses, activeFilters, selectedBusNumber);
    
    console.log('Setting filtered buses to:', filtered.length, 'buses');
    setFilteredBuses(filtered);
    
    console.log(`=== FILTER RESULT: ${filtered.length}/${allBuses.length} buses will be shown ===`);
    
    // Force a small delay to ensure state update
    setTimeout(() => {
      console.log('Filtered buses state after update:', filteredBuses.length);
    }, 100);
    
  }, [allBuses, activeFilters, selectedBusNumber]);

  // Load routes data from API with file fallback
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setIsLoadingRoutes(true);
        setDataError(null);
        
        console.log('Loading routes...');
        
        // Try API first
        try {
          const apiRoutes = await busAPI.getRoutes();
          console.log('Routes API response:', apiRoutes);
          
          if (apiRoutes.success && apiRoutes.data && apiRoutes.data.length > 0) {
            const routesMap = {};
            apiRoutes.data.forEach(route => {
              routesMap[route.route_short_name] = {
                id: route.route_id,
                shortName: route.route_short_name,
                longName: route.route_long_name,
                color: route.route_color,
                textColor: route.route_text_color
              };
            });
            setRoutes(routesMap);
            console.log(`✅ Loaded ${apiRoutes.data.length} routes from API`);
            return;
          }
        } catch (apiError) {
          console.log('⚠️ API routes failed, trying file fallback:', apiError);
        }

        // Fallback to file
        try {
          const response = await fetch('/routes.txt');
          if (response.ok) {
            const csvText = await response.text();
            const parsedRoutes = parseCSV(csvText);
            
            const routesMap = {};
            parsedRoutes.forEach(route => {
              routesMap[route.route_short_name] = {
                id: route.route_id,
                shortName: route.route_short_name,
                longName: route.route_long_name,
                color: route.route_color,
                textColor: route.route_text_color
              };
            });
            
            console.log(`✅ Loaded ${parsedRoutes.length} routes from file`);
            setRoutes(routesMap);
          } else {
            throw new Error('Routes file not found');
          }
        } catch (fileError) {
          console.error('📁 File fallback failed:', fileError);
          setDataError('Failed to load routes data');
        }
        
      } catch (error) {
        console.error('❌ Error loading routes:', error);
        setDataError(prev => prev ? `${prev} | Routes loading failed` : 'Routes loading failed');
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    loadRoutes();
  }, []);

  // Load bus stops from API with file fallback
  useEffect(() => {
    const loadBusStops = async () => {
      try {
        setIsLoadingStops(true);
        
        console.log('Loading bus stops...');
        
        // Try API first
        try {
          const apiStops = await busAPI.getStops(1000);
          console.log('Stops API response:', apiStops);
          
          if (apiStops.success && apiStops.data && apiStops.data.length > 0) {
            const processedStops = apiStops.data.map(stop => ({
              id: stop.stop_id,
              code: stop.stop_code,
              name: stop.stop_name,
              lat: parseFloat(stop.stop_lat),
              lng: parseFloat(stop.stop_lon),
              wheelchairAccessible: stop.wheelchair_boarding === 1
            })).filter(stop => !isNaN(stop.lat) && !isNaN(stop.lng));
            
            setBusStops(processedStops);
            console.log(`✅ Loaded ${processedStops.length} stops from API`);
            return;
          }
        } catch (apiError) {
          console.log('⚠️ API stops failed, trying file fallback:', apiError);
        }

        // Fallback to file
        try {
          const response = await fetch('/stops.txt');
          if (response.ok) {
            const csvText = await response.text();
            const parsedStops = parseCSV(csvText);
            
            const processedStops = parsedStops.map(stop => ({
              id: stop.stop_id,
              code: stop.stop_code,
              name: stop.stop_name,
              lat: parseFloat(stop.stop_lat),
              lng: parseFloat(stop.stop_lon),
              wheelchairAccessible: stop.wheelchair_boarding === '1'
            })).filter(stop => !isNaN(stop.lat) && !isNaN(stop.lng));
            
            console.log(`✅ Loaded ${processedStops.length} bus stops from file`);
            setBusStops(processedStops);
          } else {
            throw new Error('Stops file not found');
          }
        } catch (fileError) {
          console.error('📁 File fallback failed:', fileError);
          setDataError(prev => prev ? `${prev} | Stops loading failed` : 'Stops loading failed');
        }
        
      } catch (error) {
        console.error('❌ Error loading bus stops:', error);
        setDataError(prev => prev ? `${prev} | Stops loading failed` : 'Stops loading failed');
      } finally {
        setIsLoadingStops(false);
      }
    };

    loadBusStops();
  }, []);

  // Fetch live bus data from API (always fetch all buses for better filtering)
  const fetchLiveBusData = useCallback(async () => {
    try {
      setIsLoadingBuses(true);
      setDataError(null);
      
      console.log('Fetching all live buses...');

      // Fetch ALL buses without server-side filtering for better client-side control
      const response = await busAPI.getLiveBuses({});
      console.log('Live buses API response:', response);
      
      if (response.success && response.data) {
        // Transform API data
        const transformedBuses = response.data.map((bus, index) => {
          let busData;
          
          // Handle different data formats from your API
          if (bus.vehicle !== undefined) {
            // Direct Metrobus API format
            busData = {
              id: bus.vehicle || `bus_${index}`,
              number: bus.vehicle || 'Unknown',
              route_number: bus.routenumber || bus.route || 'Unknown',
              lat: parseFloat(bus.bus_lat || bus.lat),
              lng: parseFloat(bus.bus_lon || bus.lng),
              heading: bus.heading || 'Unknown',
              speed: parseFloat(bus.speed) || 0,
              timestamp: bus.timestamp || new Date().toISOString(),
              current_location: bus.current_location,
              deviation: bus.deviation,
              service: bus.service
            };
          }
          else if (bus.veh !== undefined || bus.lat !== undefined) {
            // Backend transformed format
            busData = {
              id: bus.veh || bus.vehicle || `bus_${index}`,
              number: bus.veh || bus.vehicle || 'Unknown',
              route_number: bus.route || bus.routenumber || 'Unknown',
              lat: parseFloat(bus.lat || bus.bus_lat),
              lng: parseFloat(bus.lng || bus.bus_lon),
              heading: bus.hdg || bus.heading || 'Unknown',
              speed: parseFloat(bus.spd || bus.speed) || 0,
              timestamp: bus.timestamp || new Date().toISOString()
            };
          }
          else if (bus.bus_id !== undefined) {
            // Database format
            busData = {
              id: bus.bus_id || `bus_${index}`,
              number: bus.bus_id || 'Unknown',
              route_number: bus.route_number || 'Unknown',
              lat: parseFloat(bus.latitude),
              lng: parseFloat(bus.longitude),
              heading: bus.heading || 'Unknown',
              speed: parseFloat(bus.speed) || 0,
              timestamp: bus.timestamp || new Date().toISOString(),
              current_location: bus.current_location,
              deviation: bus.deviation
            };
          }
          else {
            // Fallback
            console.warn('Unknown bus data format:', bus);
            busData = {
              id: `bus_${index}`,
              number: 'Unknown',
              route_number: 'Unknown',
              lat: 0,
              lng: 0,
              heading: 'Unknown',
              speed: 0,
              timestamp: new Date().toISOString()
            };
          }

          return busData;
        }).filter(bus => !isNaN(bus.lat) && !isNaN(bus.lng) && bus.lat !== 0 && bus.lng !== 0);

        setAllBuses(transformedBuses);
        setLastUpdated(new Date());
        setApiStatus('connected');
        
        console.log(`✅ Loaded ${transformedBuses.length} total buses`);
        
        if (transformedBuses.length > 0) {
          setDataError(null);
        }
      } else {
        console.warn('⚠️ API returned unsuccessful response:', response);
        setApiStatus('error');
        const errorMessage = response.message || response.error || 'Unknown API error';
        setDataError(`API Error: ${errorMessage}`);
      }
      
    } catch (error) {
      console.error('❌ Error fetching live bus data:', error);
      setApiStatus('error');
      setDataError(`Connection Error: ${error.message}`);
    } finally {
      setIsLoadingBuses(false);
    }
  }, []); // Remove dependencies to always fetch all buses

  // Set up live data polling and health checks
  useEffect(() => {
    console.log('Setting up API polling...');
    
    checkAPIHealth();
    fetchLiveBusData();
    
    const busDataInterval = setInterval(() => {
      console.log('Polling for bus updates...');
      fetchLiveBusData();
    }, 30000);
    
    const healthCheckInterval = setInterval(() => {
      console.log('Health check...');
      checkAPIHealth();
    }, 60000);
    
    return () => {
      console.log('Cleaning up intervals...');
      clearInterval(busDataInterval);
      clearInterval(healthCheckInterval);
    };
  }, [fetchLiveBusData, checkAPIHealth]);

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0">
      <LeafletMap 
        center={ST_JOHNS_CENTER} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Bus Stop Markers */}
        {!isLoadingStops && busStops.map(stop => (
          <Marker 
            key={`stop-${stop.id}`}
            position={[stop.lat, stop.lng]}
            icon={createBusStopIcon()}
            zIndexOffset={0} // lower than buses
          >
            <Popup>
              <div className="p-2 min-w-[200px] z-0">
                <h3 className="font-bold text-sm mb-1">{stop.name}</h3>
                <div className="text-xs space-y-1 text-gray-600">
                  <div><strong>Stop ID:</strong> {stop.code}</div>
                  <div><strong>Location:</strong> {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}</div>
                  {stop.wheelchairAccessible && (
                    <div className="text-blue-600">♿ Wheelchair Accessible</div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Filtered Bus Markers - ONLY show buses that match filters */}
        {filteredBuses.length > 0 && filteredBuses.map(bus => {
          const routeInfo = routes[bus.route_number];
          return (
            <Marker 
              key={`bus-${bus.id}`}
              position={[bus.lat, bus.lng]}
              icon={createBusIcon(bus, routeInfo?.color)}
              zIndexOffset={1000} // higher than bus stops 
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm mb-1">Bus #{bus.number}</h3>
                  <div className="text-xs space-y-1">
                    <div><strong>Route:</strong> {bus.route_number} {routeInfo?.longName && `- ${routeInfo.longName}`}</div>
                    <div><strong>Speed:</strong> {bus.speed} km/h</div>
                    <div><strong>Heading:</strong> {bus.heading}</div>
                    <div><strong>Status:</strong> {bus.speed === 0 ? 'Stopped' : 'Moving'}</div>
                    {bus.current_location && (
                      <div><strong>Location:</strong> {bus.current_location}</div>
                    )}
                    {bus.deviation && (
                      <div><strong>Schedule:</strong> {bus.deviation}</div>
                    )}
                    {bus.service && (
                      <div><strong>Service:</strong> {bus.service}</div>
                    )}
                    {bus.timestamp && (
                      <div><strong>Last Update:</strong> {new Date(bus.timestamp).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Show message when filters are active but no buses match */}
        {(activeFilters.length > 0 || (selectedBusNumber && selectedBusNumber.trim())) && filteredBuses.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 z-[1000]">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">No buses found</div>
              <div className="text-sm text-gray-500">
                No buses match your current filters:
                {activeFilters.length > 0 && (
                  <div className="mt-1">Routes: {activeFilters.join(', ')}</div>
                )}
                {selectedBusNumber && selectedBusNumber.trim() && (
                  <div className="mt-1">Bus number: {selectedBusNumber}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </LeafletMap>
      
      {/* API Status Indicator */}
      <div className={`absolute top-15 right-8 px-3 py-2 rounded-lg text-sm z-[1000] ${
        apiStatus === 'connected' 
          ? 'bg-green-100 border border-green-400 text-green-700' 
          : apiStatus === 'error'
          ? 'bg-yellow-100 border border-yellow-400 text-yellow-700'
          : 'bg-red-100 border border-red-400 text-red-700'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            apiStatus === 'connected' 
              ? 'bg-green-500 animate-pulse' 
              : apiStatus === 'error'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}></div>
          <span>
            {apiStatus === 'connected' && 'Live Data Active'}
            {apiStatus === 'error' && 'API Issues'}
            {apiStatus === 'offline' && 'API Offline'}
            {apiStatus === 'connecting' && 'Connecting...'}
          </span>
        </div>
        {lastUpdated && (
          <div className="text-xs mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {/* Loading indicators */}
      {(isLoadingStops || isLoadingRoutes || isLoadingBuses) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            Loading {isLoadingBuses ? 'live buses' : isLoadingStops ? 'stops' : 'routes'}...
          </div>
        </div>
      )}
      
      {/* Error indicator */}
      {dataError && (
        <div className="absolute bottom-20 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm z-[1000] max-w-xs">
          <strong>Issues:</strong> {dataError}
          <button 
            onClick={() => setDataError(null)}
            className="ml-2 text-red-900 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Enhanced Debug Info 
      {(process.env.NODE_ENV === 'development' || filteredBuses.length === 0) && (
        <div className="absolute bottom-20 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg text-xs z-[1000] max-w-sm">
          <div><strong>Debug Info:</strong></div>
          <div>Total Buses: {allBuses.length}</div>
          <div>Filtered Buses: {filteredBuses.length}</div>
          <div>Stops: {busStops.length}</div>
          <div>Routes: {Object.keys(routes).length}</div>
          <div>Active Filters: {activeFilters.length > 0 ? activeFilters.join(', ') : 'None'}</div>
          <div>Bus Number Filter: {selectedBusNumber || 'None'}</div>
          <div>API Status: {apiStatus}</div>
          <div>Loading: {isLoadingBuses ? 'Yes' : 'No'}</div>
          {lastUpdated && <div>Last Update: {lastUpdated.toLocaleTimeString()}</div>}
          {filteredBuses.length > 0 && (
            <div className="mt-1 pt-1 border-t border-blue-300">
              <div><strong>Visible Routes:</strong></div>
              <div className="text-xs">
                {[...new Set(filteredBuses.map(b => b.route_number))].sort().join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
      */}
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded border"></div>
            <span>Live Bus ({filteredBuses.length}{allBuses.length !== filteredBuses.length ? `/${allBuses.length}` : ''})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-full border"></div>
            <span>Bus Stop ({busStops.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded border opacity-70" style={{borderColor: '#fbbf24'}}></div>
            <span>Stopped Bus</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        Powered by OpenStreetMap | Routes: {Object.keys(routes).length}
      </div>
    </div>
  );
};

export default MapContainer;