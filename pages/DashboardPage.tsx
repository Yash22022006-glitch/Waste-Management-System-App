import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { binService } from '../services/binService';
import { Bin, BinFilters, UserRole, User } from '../types';
import BinCard from '../components/BinCard';
import { useAuth } from '../hooks/useAuth';
import { UPDATE_INTERVAL_MS } from '../constants';
import BinFilterControls from '../components/BinFilterControls';
import { authService } from '../services/authService'; // Import authService

const DashboardPage: React.FC = () => {
  const [allBins, setAllBins] = useState<Bin[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [collectingBinId, setCollectingBinId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BinFilters>({
    searchTerm: '',
    status: 'all',
    minFillLevel: '',
    maxFillLevel: '',
    collectorId: 'all',
  });
  const { user, isAdmin } = useAuth();

  const fetchBins = useCallback(() => {
    setAllBins(binService.getBins());
  }, []);

  const fetchUsers = useCallback(() => {
    setAllUsers(authService.getAllUsers());
  }, []);

  useEffect(() => {
    fetchBins();
    fetchUsers();

    const unsubscribeBins = binService.subscribe(setAllBins); 
    binService.startRealtimeUpdates(UPDATE_INTERVAL_MS); 

    const unsubscribeUsers = authService.subscribe(setAllUsers);

    return () => {
      unsubscribeBins();
      unsubscribeUsers();
      binService.stopRealtimeUpdates();
    };
  }, [fetchBins, fetchUsers]);

  const handleCollected = useCallback(async (binId: string) => {
    if (user?.role === UserRole.COLLECTOR) {
      setCollectingBinId(binId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      binService.markBinAsCollected(binId);
      setCollectingBinId(null);
    }
  }, [user]);

  const handleFilterChange = useCallback((newFilters: BinFilters) => {
    setFilters(newFilters);
  }, []);

  const binIdToAssignedCollector = useMemo(() => {
    const map = new Map<string, { id: string, username: string, fullName: string }>();
    allUsers.forEach(u => {
      if (u.role === UserRole.COLLECTOR && u.assignedBinIds) {
        u.assignedBinIds.forEach(binId => {
          map.set(binId, { id: u.id, username: u.username, fullName: u.fullName || u.username });
        });
      }
    });
    return map;
  }, [allUsers]);

  const displayedBins = useMemo(() => {
    if (!user) return [];
    
    if (user.role === UserRole.ADMIN) {
      return allBins;
    } else if (user.role === UserRole.COLLECTOR) {
      return allBins.filter(bin => user.assignedBinIds?.includes(bin.id));
    } else {
      return allBins.slice(0, 10);
    }
  }, [allBins, user]);

  const filteredBins = useMemo(() => {
    return displayedBins.filter(bin => {
      if (filters.searchTerm && !bin.serialNumber.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.status !== 'all' && bin.status !== filters.status) {
        return false;
      }
      if (filters.minFillLevel !== '' && bin.fillLevel < Number(filters.minFillLevel)) {
        return false;
      }
      if (filters.maxFillLevel !== '' && bin.fillLevel > Number(filters.maxFillLevel)) {
        return false;
      }
      return true;
    });
  }, [displayedBins, filters]);

  return (
    <div className="p-4 sm:p-6 min-h-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter glow-text">COMMAND CENTER</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow" />
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mono">System Live // Real-time Node Monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="glass-panel px-4 py-2 flex flex-col items-end">
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Bins</span>
            <span className="text-xl font-black text-[var(--text-main)] mono">{allBins.length}</span>
          </div>
          <div className="glass-panel px-4 py-2 flex flex-col items-end border-blue-500/50">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Critical</span>
            <span className="text-xl font-black text-blue-600 mono">{allBins.filter(b => b.fillLevel > 80).length}</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="glass-panel p-2">
        <BinFilterControls 
          onFilterChange={handleFilterChange} 
          initialFilters={filters} 
        />
      </div>

      {/* Main Content: Bento Grid */}
      <div className="flex-grow">
        {filteredBins.length === 0 ? (
          <div className="h-64 glass-panel flex flex-col items-center justify-center border-dashed border-gray-800">
            <p className="text-gray-600 font-bold mono uppercase tracking-widest">No Nodes Detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBins.map((bin) => (
              <BinCard
                key={bin.id}
                bin={bin}
                showCollectedButton={user?.role === UserRole.COLLECTOR} 
                onCollected={handleCollected}
                isCollecting={collectingBinId === bin.id}
                assignedCollectorName={binIdToAssignedCollector.get(bin.id)?.fullName || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;