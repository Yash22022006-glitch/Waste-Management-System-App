import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { binService } from '../services/binService';
import { Bin, BinFilters, User, UserRole } from '../types';
import MapComponent from '../components/MapComponent';
import BinFilterControls from '../components/BinFilterControls';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { COLLECTOR_MOVEMENT_INTERVAL_MS } from '../constants';

const MapPage: React.FC = () => {
  const [allBins, setAllBins] = useState<Bin[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // New state to hold all users
  const [currentUserGeolocation, setCurrentUserGeolocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BinFilters>({
    searchTerm: '',
    status: 'all',
    minFillLevel: '',
    maxFillLevel: '',
  });
  const { user } = useAuth();

  const fetchBins = useCallback(() => {
    setAllBins(binService.getBins());
  }, []);

  const fetchUsers = useCallback(() => {
    setAllUsers(authService.getAllUsers());
  }, []);

  useEffect(() => {
    fetchBins(); // Initial fetch
    fetchUsers(); // Initial fetch of users

    const unsubscribeBins = binService.subscribe(setAllBins);
    const unsubscribeUsers = authService.subscribe(setAllUsers); // Subscribe to user updates

    // Start collector movement simulation
    authService.startCollectorMovementSimulation(COLLECTOR_MOVEMENT_INTERVAL_MS);

    // Watch current user's geolocation
    let geoWatchId: number | undefined;
    if (navigator.geolocation) {
      geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentUserGeolocation(newLocation);
          setGeolocationError(null);
          console.log(`Geolocation successful: Lat ${newLocation.lat}, Lng ${newLocation.lng}. Accuracy: ${position.coords.accuracy}m`);
        },
        (err) => {
          console.error("Error getting user location:", err.code, err.message, err); // Log code, message, and full object
          let errorMessage = `Geolocation error: `;
          if (err.code === err.PERMISSION_DENIED) {
            errorMessage += "Permission denied. Please enable location access in your browser settings.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            // Specific handling for "Network error" message
            if (err.message === "Network error.") {
              errorMessage += "Network error. Please check your internet connection and device's location services.";
            } else {
              errorMessage += "Position unavailable. Please ensure GPS/location services are enabled.";
            }
          } else if (err.code === err.TIMEOUT) {
            errorMessage += "Timed out while trying to get your location. Trying again...";
          } else {
            errorMessage += err.message || "An unknown error occurred.";
          }
          setGeolocationError(errorMessage);
          setCurrentUserGeolocation(null);
        },
        { enableHighAccuracy: true, timeout: 60000, maximumAge: Infinity }
      );
    } else {
      setGeolocationError("Geolocation is not supported by your browser.");
      console.warn("Geolocation is not supported by this browser.");
    }

    return () => {
      unsubscribeBins();
      unsubscribeUsers();
      authService.stopCollectorMovementSimulation(); // Stop simulation on unmount
      if (geoWatchId !== undefined) {
        navigator.geolocation.clearWatch(geoWatchId);
      }
    };
  }, [fetchBins, fetchUsers]);

  const handleFilterChange = useCallback((newFilters: BinFilters) => {
    setFilters(newFilters);
  }, []);

  const displayedBins = useMemo(() => {
    if (!user) return [];
    
    if (user.role === UserRole.ADMIN) {
      return allBins; // Admin sees all bins
    } else if (user.role === UserRole.COLLECTOR) {
      // Collector sees only their assigned bins
      return allBins.filter(bin => user.assignedBinIds?.includes(bin.id));
    } else { // COMMUNITY_MEMBER
      return allBins.slice(0, 10); // Community member sees the first 10 bins
    }
  }, [allBins, user]);

  const filteredBins = useMemo(() => {
    return displayedBins.filter(bin => {
      // Filter by search term (serial number)
      if (filters.searchTerm && !bin.serialNumber.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Filter by status
      if (filters.status !== 'all' && bin.status !== filters.status) {
        return false;
      }

      // Filter by min fill level
      if (filters.minFillLevel !== '' && bin.fillLevel < Number(filters.minFillLevel)) {
        return false;
      }

      // Filter by max fill level
      if (filters.maxFillLevel !== '' && bin.fillLevel > Number(filters.maxFillLevel)) {
        return false;
      }

      return true;
    });
  }, [displayedBins, filters]);

  // Filter for collector users
  const collectorUsers = useMemo(() => {
    return allUsers.filter(u => u.role === UserRole.COLLECTOR);
  }, [allUsers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-[var(--text-main)] mb-6">Waste Bin Map</h2>
      {geolocationError && (
        <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4" role="alert">
          {geolocationError}
        </p>
      )}
      <BinFilterControls onFilterChange={handleFilterChange} initialFilters={filters} />
      {filteredBins.length === 0 && collectorUsers.length === 0 && !currentUserGeolocation ? (
        <p className="text-gray-600 text-center text-lg mt-8">No bins or active collectors to display on the map.</p>
      ) : (
        <div className="max-w-4xl mx-auto mt-12">
          <MapComponent 
            bins={filteredBins} 
            collectors={collectorUsers} // Pass collector users
            currentUserLocation={currentUserGeolocation} // Pass current user's geolocation
            height="h-[40vh]" 
          />
        </div>
      )}
    </div>
  );
};

export default MapPage;