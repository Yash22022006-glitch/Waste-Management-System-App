import React from 'react';
import { motion } from 'motion/react';
import { Trash2, CheckCircle2, Clock, User as UserIcon } from 'lucide-react';
import { Bin, UserRole } from '../types';

interface BinCardProps {
  bin: Bin;
  onClick?: (bin: Bin) => void;
  showCollectedButton?: boolean;
  onCollected?: (binId: string) => void;
  isCollecting?: boolean;
  assignedCollectorName?: string;
}

const BinCard: React.FC<BinCardProps> = ({ 
  bin, 
  onClick, 
  showCollectedButton, 
  onCollected, 
  isCollecting, 
  assignedCollectorName,
}) => {
  const getFillColor = (fillLevel: number): string => {
    if (fillLevel >= 80) return 'bg-red-500';
    if (fillLevel >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusColor = (fillLevel: number): string => {
    if (fillLevel >= 80) return 'text-red-600 bg-red-50';
    if (fillLevel >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const handleClick = () => {
    if (onClick) {
      onClick(bin);
    }
  };

  const handleCollected = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCollected && bin.id) {
      onCollected(bin.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel overflow-hidden group relative flex flex-col justify-between"
      onClick={handleClick}
    >
      {/* Status Bar */}
      <div className={`h-1 w-full ${bin.fillLevel >= 80 ? 'bg-red-500' : bin.fillLevel >= 50 ? 'bg-amber-500' : 'bg-blue-500'}`} />
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mono">Node ID</span>
              <span className="text-xs font-bold text-blue-500 mono">{bin.serialNumber}</span>
            </div>
            <h4 className="text-sm font-bold text-[var(--text-main)] mt-1 line-clamp-1">{bin.locationName}</h4>
          </div>
          <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${bin.fillLevel >= 80 ? 'bg-red-500/20 text-red-600' : bin.fillLevel >= 50 ? 'bg-amber-500/20 text-amber-600' : 'bg-blue-500/20 text-blue-600'}`}>
            {bin.fillLevel >= 80 ? 'Critical' : bin.fillLevel >= 50 ? 'Warning' : 'Normal'}
          </div>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mono">Fill Level</span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-4xl font-black mono tracking-tighter ${bin.fillLevel > 80 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                {Math.round(bin.fillLevel)}
              </span>
              <span className="text-xs font-bold text-gray-500 mono">%</span>
            </div>
          </div>
          
          <div className="w-16 h-16 relative flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-2 border-black/5" />
             <div 
               className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ${bin.fillLevel > 80 ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-blue-500'}`}
               style={{ 
                 clipPath: `inset(${100 - bin.fillLevel}% 0 0 0)`,
                 opacity: 0.6
               }}
             />
             <Trash2 className={`w-6 h-6 ${bin.fillLevel > 80 ? 'text-red-500' : 'text-gray-700'}`} />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px] font-bold mono">
            <div className="flex items-center text-gray-500">
              <Clock size={12} className="mr-1" />
              <span>LAST SYNC</span>
            </div>
            <span className="text-[var(--text-muted)]">{new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {assignedCollectorName && (
            <div className="flex items-center justify-between text-[10px] font-bold mono">
              <div className="flex items-center text-gray-500">
                <UserIcon size={12} className="mr-1" />
                <span>OPERATOR</span>
              </div>
              <span className="text-blue-600 uppercase">{assignedCollectorName}</span>
            </div>
          )}
        </div>

        {showCollectedButton && (
          <button
            onClick={handleCollected}
            disabled={isCollecting || bin.status === 'collected'}
            className="w-full mt-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center space-x-2"
          >
            {isCollecting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : bin.status === 'collected' ? (
              <CheckCircle2 size={16} />
            ) : null}
            <span>{isCollecting ? 'Processing...' : bin.status === 'collected' ? 'Collected' : 'Execute Collection'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BinCard;