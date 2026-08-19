import { COLLECTOR_MOVEMENT_INTERVAL_MS, COLLECTOR_MOVEMENT_STEP_KM, MOCK_USERS_INITIAL, generateRandomLocation, getDistance, COLLECTION_DISTANCE_THRESHOLD_KM, SF_CENTER } from '../constants';
import { User, UserRole, Bin } from '../types';
import { binService } from './binService'; // Import binService

interface LoginResponse {
  success: boolean;
  user: User | null;
  token: string | null;
  message?: string;
}

interface SignupResponse {
  success: boolean;
  user: User | null;
  token: string | null;
  message?: string;
}

// Internal mock user store
let mockUsers: User[] = [...MOCK_USERS_INITIAL];
const PASSWORD = '123'; // All mock users share this password

class AuthService {
  private listeners: Set<(users: User[]) => void> = new Set();
  private _collectorMoveIntervalId: number | undefined;

  constructor() {
    // Ensure binService is initialized before starting simulation that depends on it
    // This might cause a circular dependency if not handled carefully,
    // but for mock services it's generally fine.
    // Explicitly call startCollectorMovementSimulation from App.tsx or MapPage.tsx
    // to ensure binService is ready.
  }

  public async login(username: string, password: string): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers.find(u => u.username === username);

    if (user && password === PASSWORD) {
      const token = `mock-jwt-${user.id}-${Date.now()}`;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return { success: true, user, token };
    } else {
      return { success: false, user: null, token: null, message: 'Invalid username or password' };
    }
  }

  public async signup(username: string, password: string, role: UserRole, assignedBinIds: string[] = []): Promise<SignupResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (mockUsers.some(u => u.username === username)) {
      return { success: false, user: null, token: null, message: 'Username already exists' };
    }

    const newUser: User = {
      id: `user-${mockUsers.length + 1}-${Date.now()}`,
      username,
      role,
      fullName: username.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      age: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
      area: 'Unassigned Area',
      ...(role === UserRole.COLLECTOR && { 
        assignedBinIds,
        currentLocation: generateRandomLocation(SF_CENTER.lat, SF_CENTER.lng, 2), // Random initial location around SF_CENTER
        status: 'idle'
      }),
    };
    mockUsers.push(newUser);
    this.notifyListeners(); // Notify listeners about user change

    const token = `mock-jwt-${newUser.id}-${Date.now()}`;
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', token);
    return { success: true, user: newUser, token };
  }

  public logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  public getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? (JSON.parse(userStr) as User) : null;
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public getAllUsers(): User[] {
    return [...mockUsers];
  }

  public getAvailableCollectors(): User[] {
    return mockUsers.filter(u => u.role === UserRole.COLLECTOR);
  }

  public getCollectorWithLeastAssignments(): User | undefined {
    const collectors = this.getAvailableCollectors();
    if (collectors.length === 0) return undefined;

    // Get active bins to properly count current assignments
    const allBins = binService.getBins();
    const activeBins = allBins.filter(bin => bin.status !== 'collected');

    // Create a map of collectorId to their active assigned bin count
    const collectorAssignmentCounts = new Map<string, number>();
    collectors.forEach(collector => {
      const activeAssignments = (collector.assignedBinIds || []).filter(binId => 
        activeBins.some(b => b.id === binId)
      ).length;
      collectorAssignmentCounts.set(collector.id, activeAssignments);
    });

    let leastAssignments = Infinity;
    let collectorWithLeastAssignments: User | undefined;

    for (const collector of collectors) {
      const count = collectorAssignmentCounts.get(collector.id) || 0;
      if (count < leastAssignments) {
        leastAssignments = count;
        collectorWithLeastAssignments = collector;
      }
    }
    return collectorWithLeastAssignments;
  }

  public async addUser(username: string, role: UserRole, assignedBinIds: string[] = []): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (mockUsers.some(u => u.username === username)) {
      return { success: false, message: 'Username already exists' };
    }

    const newUser: User = {
      id: `user-${mockUsers.length + 1}-${Date.now()}`,
      username,
      role,
      fullName: username.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      age: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
      area: 'Unassigned Area',
      ...(role === UserRole.COLLECTOR && { 
        assignedBinIds,
        currentLocation: generateRandomLocation(SF_CENTER.lat, SF_CENTER.lng, 2), // Random initial location
        status: 'idle'
      }),
    };
    mockUsers.push(newUser);
    this.notifyListeners();
    return { success: true };
  }

  public async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const initialLength = mockUsers.length;
    mockUsers = mockUsers.filter(u => u.id !== userId);

    if (mockUsers.length < initialLength) {
      this.notifyListeners();
      return { success: true };
    } else {
      return { success: false, message: 'User not found' };
    }
  }

  public async updateUserProfilePhoto(userId: string, photoUrl: string | null): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    const updatedUser = { ...mockUsers[userIndex], photoUrl: photoUrl || undefined }; // Store undefined if null
    mockUsers[userIndex] = updatedUser;

    // If the updated user is the currently logged-in user, update localStorage
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    this.notifyListeners(); // Notify all subscribed components
    return { success: true };
  }

  public async updateUserProfile(userId: string, updatedFields: Partial<User>): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    const updatedUser = { ...mockUsers[userIndex], ...updatedFields };
    mockUsers[userIndex] = updatedUser;

    // If the updated user is the currently logged-in user, update localStorage
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    this.notifyListeners(); // Notify all subscribed components
    return { success: true };
  }

  public updateUserLocation(userId: string, lat: number, lng: number, status?: User['status']) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        currentLocation: { lat, lng },
        ...(status && { status })
      };
      this.notifyListeners();
    }
  }

  /**
   * Assigns a bin to a collector. If the bin was previously assigned to another collector,
   * it will be unassigned from them first. If collectorId is null, the bin will be unassigned from all.
   * @param binId The ID of the bin to assign.
   * @param collectorId The ID of the collector to assign the bin to, or null to unassign.
   */
  public async assignBinToCollector(binId: string, collectorId: string | null): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate quick API call for internal use

    let targetCollectorUpdated = false;

    mockUsers = mockUsers.map(user => {
      if (user.role === UserRole.COLLECTOR) {
        let currentAssignedBinIds = user.assignedBinIds ? [...user.assignedBinIds] : [];
        const wasAssignedToThisUser = currentAssignedBinIds.includes(binId);

        // Remove bin from this collector if it was assigned to them
        currentAssignedBinIds = currentAssignedBinIds.filter(id => id !== binId);

        // If this is the target collector (and not unassigning), add the bin
        if (collectorId !== null && user.id === collectorId && !currentAssignedBinIds.includes(binId)) {
          currentAssignedBinIds.push(binId);
          targetCollectorUpdated = true;
        }

        // Only update if changes were made
        if (wasAssignedToThisUser || targetCollectorUpdated) {
          return { ...user, assignedBinIds: currentAssignedBinIds };
        }
      }
      return user;
    });

    if (collectorId !== null && !targetCollectorUpdated) {
      // This means the target collector wasn't in the initial map loop, or didn't have assignedBinIds
      // Find the actual target collector and update them
      const targetCollectorIndex = mockUsers.findIndex(u => u.id === collectorId && u.role === UserRole.COLLECTOR);
      if (targetCollectorIndex !== -1) {
        const targetCollector = mockUsers[targetCollectorIndex];
        const assignedBinIds = targetCollector.assignedBinIds ? [...targetCollector.assignedBinIds] : [];
        if (!assignedBinIds.includes(binId)) {
          assignedBinIds.push(binId);
          mockUsers[targetCollectorIndex] = { ...targetCollector, assignedBinIds };
          targetCollectorUpdated = true;
        }
      } else {
        return { success: false, message: 'Target collector not found.' };
      }
    }
    
    this.notifyListeners(); // Notify all subscribed components about user (collector) changes
    return { success: true };
  }

  public startCollectorMovementSimulation(intervalMs: number) {
    if (this._collectorMoveIntervalId) {
      clearInterval(this._collectorMoveIntervalId);
    }
    this._collectorMoveIntervalId = window.setInterval(() => {
      const allBins: Bin[] = binService.getBins();

      mockUsers = mockUsers.map(user => {
        if (user.role === UserRole.COLLECTOR && user.currentLocation) {
          let newLocation = { ...user.currentLocation };
          let newStatus: User['status'] = 'idle';

          // 1. Clean up assigned bins (remove collected ones)
          let activeAssignedBinIds = (user.assignedBinIds || []).filter(binId =>
            allBins.some(bin => bin.id === binId && (bin.status === 'active' || bin.status === 'full'))
          );
          user.assignedBinIds = activeAssignedBinIds; // Update collector's assignments

          // 2. Determine target for movement
          if (activeAssignedBinIds.length > 0) {
            // Find the closest assigned bin
            let closestBin: Bin | undefined;
            let minDistance = Infinity;

            for (const binId of activeAssignedBinIds) {
              const assignedBin = allBins.find(b => b.id === binId);
              if (assignedBin) {
                const distance = getDistance(
                  newLocation.lat, newLocation.lng,
                  assignedBin.location.lat, assignedBin.location.lng
                );
                if (distance < minDistance) {
                  minDistance = distance;
                  closestBin = assignedBin;
                }
              }
            }

            if (closestBin && minDistance <= COLLECTION_DISTANCE_THRESHOLD_KM) {
              // Collector is at the bin, set status to collecting
              newStatus = 'collecting';
              // Location remains the same (at the bin or slightly jitter)
            } else if (closestBin) {
              // Collector is enroute to the closest bin
              newStatus = 'enroute';

              const targetLat = closestBin.location.lat;
              const targetLng = closestBin.location.lng;

              // Calculate direction vector
              const deltaLat = targetLat - newLocation.lat;
              const deltaLng = targetLng - newLocation.lng;

              // Normalize vector to get direction
              const angle = Math.atan2(deltaLng, deltaLat);

              // Move a step in that direction
              const moveLat = COLLECTOR_MOVEMENT_STEP_KM / 111 * Math.cos(angle); // Approx km to degrees lat
              const moveLng = COLLECTOR_MOVEMENT_STEP_KM / (111 * Math.cos(newLocation.lat * Math.PI / 180)) * Math.sin(angle); // Approx km to degrees lng

              // Ensure we don't overshoot
              const actualMoveLat = Math.abs(deltaLat) > Math.abs(moveLat) ? moveLat : deltaLat;
              const actualMoveLng = Math.abs(deltaLng) > Math.abs(moveLng) ? moveLng : deltaLng;
              
              newLocation = {
                lat: newLocation.lat + actualMoveLat,
                lng: newLocation.lng + actualMoveLng,
              };
            }
          } else {
            // No active assigned bins, move back to depot or stay idle
            newStatus = 'idle';
            const distanceToDepot = getDistance(newLocation.lat, newLocation.lng, SF_CENTER.lat, SF_CENTER.lng);

            if (distanceToDepot > COLLECTOR_MOVEMENT_STEP_KM) { // If far from depot, move towards it
              const targetLat = SF_CENTER.lat;
              const targetLng = SF_CENTER.lng;

              const deltaLat = targetLat - newLocation.lat;
              const deltaLng = targetLng - newLocation.lng;
              const angle = Math.atan2(deltaLng, deltaLat);

              const moveLat = COLLECTOR_MOVEMENT_STEP_KM / 111 * Math.cos(angle);
              const moveLng = COLLECTOR_MOVEMENT_STEP_KM / (111 * Math.cos(newLocation.lat * Math.PI / 180)) * Math.sin(angle);

              newLocation = {
                lat: newLocation.lat + moveLat,
                lng: newLocation.lng + moveLng,
              };
            } else { // If close to depot, small random jitter
              newLocation = generateRandomLocation(newLocation.lat, newLocation.lng, 0.005); // Very small jitter
            }
          }
          
          return {
            ...user,
            currentLocation: newLocation,
            status: newStatus,
            assignedBinIds: activeAssignedBinIds, // Ensure updated assigned bin list is stored
          };
        }
        return user;
      });
      this.notifyListeners();
    }, intervalMs);
  }

  public stopCollectorMovementSimulation() {
    if (this._collectorMoveIntervalId) {
      clearInterval(this._collectorMoveIntervalId);
      this._collectorMoveIntervalId = undefined;
    }
  }


  public subscribe(listener: (users: User[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllUsers()); // Provide initial state
    return () => this.listeners.delete(listener); // Return unsubscribe function
  }

  private notifyListeners(): void {
    const currentUsers = this.getAllUsers();
    this.listeners.forEach(listener => listener(currentUsers));
  }
}

export const authService = new AuthService();