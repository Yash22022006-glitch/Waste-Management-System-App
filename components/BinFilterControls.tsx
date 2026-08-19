import React, { useState, useEffect, useRef } from 'react';
import { Filter, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Bin, BinFilters } from '../types';

interface BinFilterControlsProps {
  onFilterChange: (filters: BinFilters) => void;
  initialFilters?: BinFilters;
}

const defaultFilters: BinFilters = {
  searchTerm: '',
  status: 'all',
  minFillLevel: '',
  maxFillLevel: '',
  collectorId: 'all',
};

const BinFilterControls: React.FC<BinFilterControlsProps> = ({ onFilterChange, initialFilters = defaultFilters }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [statusFilter, setStatusFilter] = useState<Bin['status'] | 'all'>(initialFilters.status);
  const [minFillLevel, setMinFillLevel] = useState<number | ''>(initialFilters.minFillLevel);
  const [maxFillLevel, setMaxFillLevel] = useState<number | ''>(initialFilters.maxFillLevel);
  const [isExpanded, setIsExpanded] = useState(false);

  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(() => {
      onFilterChange({ searchTerm, status: statusFilter, minFillLevel, maxFillLevel, collectorId: 'all' });
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, statusFilter, minFillLevel, maxFillLevel, onFilterChange]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMinFillLevel('');
    setMaxFillLevel('');
    onFilterChange(defaultFilters);
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    minFillLevel !== '',
    maxFillLevel !== ''
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
            placeholder="Search serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-2 ${
            isExpanded || activeFilterCount > 0 
              ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
              : 'bg-white border-gray-100 text-gray-600 shadow-sm'
          }`}
        >
          <Filter size={20} />
          {activeFilterCount > 0 && !isExpanded && (
            <span className="bg-white text-primary-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm font-medium appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Bin['status'] | 'all')}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="full">Full</option>
              <option value="collected">Collected</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Fill (%)</label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm font-medium"
              placeholder="0"
              min="0"
              max="100"
              value={minFillLevel}
              onChange={(e) => setMinFillLevel(e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Fill (%)</label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm font-medium"
              placeholder="100"
              min="0"
              max="100"
              value={maxFillLevel}
              onChange={(e) => setMaxFillLevel(e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))))}
            />
          </div>

          <div className="sm:col-span-3 flex items-center justify-between pt-4 border-t border-gray-50">
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center space-x-1"
            >
              <X size={14} />
              <span>Clear Filters</span>
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center space-x-1"
            >
              <span>Apply Filters</span>
              <ChevronUp size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinFilterControls;