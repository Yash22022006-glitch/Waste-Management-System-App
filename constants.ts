import { Bin, Notification, User, UserRole, NotificationType } from './types';

export const BIN_COUNT = 15;
export const UPDATE_INTERVAL_MS = 5000; // Update bin fill levels every 5 seconds
export const COLLECTOR_MOVEMENT_INTERVAL_MS = 7000; // Update collector locations every 7 seconds
export const COLLECTOR_MOVEMENT_STEP_KM = 0.3; // Collectors move up to 0.3km per step (more noticeable)
export const NOTIFICATION_THRESHOLD = 80; // Notify when bin is 80% full
export const BIN_ASSIGNMENT_THRESHOLD = 75; // Automatically assign bin to collector at 75% full
export const COLLECTION_DISTANCE_THRESHOLD_KM = 0.05; // Distance to bin to be considered "collecting" (50 meters)

// San Francisco coordinates for mock bin locations
export const SF_CENTER = { lat: 37.7749, lng: -122.4194 };
export const SF_RADIUS_KM = 5; // Bins within 5km radius

// Helper to generate a random location within a radius
export const generateRandomLocation = (baseLat: number, baseLng: number, radiusKm: number) => {
  const latOffset = (Math.random() - 0.5) * (radiusKm / 111); // Approx 111km per degree lat
  const lngOffset = (Math.random() - 0.5) * (radiusKm / (111 * Math.cos(baseLat * Math.PI / 180)));
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset,
  };
};

// Helper to calculate distance between two lat/lng points in km (Haversine formula)
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};


// Mock User data for authentication
export const MOCK_USERS_INITIAL: User[] = [
  { 
    id: 'admin1', 
    username: 'murugan_222', 
    role: UserRole.ADMIN,
    fullName: 'Murugan Administrator',
    age: 45,
    area: 'Central District'
  },
  { 
    id: 'collector1', 
    username: 'collector', 
    role: UserRole.COLLECTOR, 
    assignedBinIds: [], // Start with no assigned bins for simulation
    fullName: 'Jane Collector',
    age: 30,
    area: 'West Side',
    currentLocation: generateRandomLocation(SF_CENTER.lat, SF_CENTER.lng, SF_RADIUS_KM / 2),
    status: 'idle'
  },
  { 
    id: 'collector2', 
    username: 'murugan_2222', 
    role: UserRole.COLLECTOR, 
    assignedBinIds: [], // Start with no assigned bins for simulation
    fullName: 'Murugan Binman',
    age: 35,
    area: 'East Sector',
    currentLocation: generateRandomLocation(SF_CENTER.lat, SF_CENTER.lng, SF_RADIUS_KM / 2),
    status: 'idle'
  },
  { 
    id: 'community1', 
    username: 'murugan&222', 
    role: UserRole.COMMUNITY_MEMBER, // Changed to murugan&222 for public user
    fullName: 'Murugan Community',
    age: 28,
    area: 'South Suburbs'
  },
];

export const generateMockBin = (id: string): Bin => {
  const { lat, lng } = generateRandomLocation(SF_CENTER.lat, SF_CENTER.lng, SF_RADIUS_KM);
  
  return {
    id: `bin-${id}`,
    serialNumber: `SN-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    fillLevel: Math.floor(Math.random() * 70), // Start with < 70% full
    location: {
      lat,
      lng,
    },
    lastUpdated: new Date().toISOString(),
    status: 'active',
  };
};

export const generateMockNotifications = (bins: Bin[]): Notification[] => {
  const notifications: Notification[] = [];
  bins.forEach(bin => {
    if (bin.fillLevel >= NOTIFICATION_THRESHOLD && bin.fillLevel < 100) {
      notifications.push({
        id: `notif-${bin.id}-${Date.now()}`,
        type: NotificationType.BIN_NEAR_FULL,
        message: `Bin ${bin.serialNumber} is ${bin.fillLevel}% full!`,
        timestamp: bin.lastUpdated,
        read: false,
        binId: bin.id,
      });
    } else if (bin.fillLevel === 100) {
      notifications.push({
        id: `notif-${bin.id}-${Date.now()}`,
        type: NotificationType.BIN_FULL,
        message: `Bin ${bin.serialNumber} is FULL! Immediate action required.`,
        timestamp: bin.lastUpdated,
        read: false,
        binId: bin.id,
      });
    }
  });
  return notifications;
};