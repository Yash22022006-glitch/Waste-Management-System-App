import { BIN_COUNT, generateMockBin, NOTIFICATION_THRESHOLD, BIN_ASSIGNMENT_THRESHOLD } from '../constants';
import { Bin } from '../types';
import { authService } from './authService'; // Import authService

class BinService {
  private bins: Bin[] = [];
  private listeners: Set<(bins: Bin[]) => void> = new Set();
  private intervalId: number | undefined;
  private assignmentTriggeredForBin: Set<string> = new Set(); // Tracks bins that have triggered assignment

  constructor() {
    this.initializeBins();
  }

  private initializeBins() {
    for (let i = 1; i <= BIN_COUNT; i++) {
      this.bins.push(generateMockBin(String(i)));
    }
  }

  public startRealtimeUpdates(intervalMs: number) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = window.setInterval(() => {
      this.updateBinFillLevels();
    }, intervalMs);
  }

  public stopRealtimeUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private updateBinFillLevels() {
    this.bins = this.bins.map(bin => {
      let newFillLevel = bin.fillLevel;
      let newStatus: Bin['status'] = bin.status; // Default to current status

      if (bin.status === 'active' || bin.status === 'full') {
        const change = Math.floor(Math.random() * 5) - 1; // -1 to +3 change
        newFillLevel = Math.max(0, Math.min(100, bin.fillLevel + change));
      } else if (bin.status === 'collected') {
        // After being collected, reset fill level and status to active
        newFillLevel = Math.floor(Math.random() * 20); // Reset to low fill after collection
        newStatus = 'active';

        // Automatically unassign the bin from any collector
        authService.assignBinToCollector(bin.id, null);
        this.assignmentTriggeredForBin.delete(bin.id); // Reset assignment tracking
      }

      // Determine new status based on fill level
      if (newFillLevel >= 100) {
        newStatus = 'full';
      } else if (newStatus !== 'collected') { // Don't change status if it was just collected
        newStatus = 'active'; // Reset to active if not full or collected
      }

      const updatedBin = {
        ...bin,
        fillLevel: newFillLevel,
        lastUpdated: new Date().toISOString(),
        status: newStatus,
      };

      // NEW LOGIC: Automatic assignment if fill level reaches threshold and not already assigned
      if (updatedBin.fillLevel >= BIN_ASSIGNMENT_THRESHOLD && !this.assignmentTriggeredForBin.has(updatedBin.id)) {
        const currentAssignedCollector = authService.getAllUsers().find(u => 
          u.role === 'collector' && u.assignedBinIds?.includes(updatedBin.id)
        );

        if (!currentAssignedCollector) {
          const collectorToAssign = authService.getCollectorWithLeastAssignments();
          if (collectorToAssign) {
            authService.assignBinToCollector(updatedBin.id, collectorToAssign.id);
            this.assignmentTriggeredForBin.add(updatedBin.id); // Mark as triggered
            console.log(`Bin ${updatedBin.serialNumber} auto-assigned to ${collectorToAssign.username}`);
          }
        } else {
          // Bin is already assigned and above threshold, ensure it's tracked
          this.assignmentTriggeredForBin.add(updatedBin.id);
        }
      } else if (updatedBin.fillLevel < BIN_ASSIGNMENT_THRESHOLD && this.assignmentTriggeredForBin.has(updatedBin.id)) {
        // If fill level drops below threshold (e.g., after collection), reset tracking
        this.assignmentTriggeredForBin.delete(updatedBin.id);
      }

      return updatedBin;
    });
    this.notifyListeners();
  }

  public getBins(): Bin[] {
    return [...this.bins];
  }

  public getBinById(id: string): Bin | undefined {
    return this.bins.find(bin => bin.id === id);
  }

  public markBinAsCollected(binId: string): Bin | undefined {
    const binIndex = this.bins.findIndex(bin => bin.id === binId);
    if (binIndex > -1) {
      const updatedBin = {
        ...this.bins[binIndex],
        status: 'collected' as Bin['status'],
        fillLevel: 0, // Immediately set to 0, will be randomized slightly on next update
        lastUpdated: new Date().toISOString(),
      };
      this.bins[binIndex] = updatedBin;
      this.notifyListeners();
      return updatedBin;
    }
    return undefined;
  }

  // Fix: Make subscribe return a cleanup function for better lifecycle management with React hooks.
  public subscribe(listener: (bins: Bin[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getBins()); // Immediately send current state
    return () => this.listeners.delete(listener); // Return the unsubscribe function
  }

  // The direct `unsubscribe` method is no longer needed as `subscribe` now returns a cleanup function.
  // If a global unsubscribe is ever needed for a specific listener instance not managed by a React hook,
  // the listener itself can be passed to `listeners.delete()`.
  // public unsubscribe(listener: (bins: Bin[]) => void) {
  //   this.listeners.delete(listener);
  // }

  private notifyListeners() {
    const currentBins = this.getBins();
    this.listeners.forEach(listener => listener(currentBins));
  }
}

export const binService = new BinService();