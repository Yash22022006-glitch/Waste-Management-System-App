export enum UserRole {
  ADMIN = 'admin',
  COLLECTOR = 'collector',
  COMMUNITY_MEMBER = 'community_member',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  assignedBinIds?: string[]; // Added for collectors
  photoUrl?: string; // Add this line
  fullName?: string; // New: User's full name
  age?: number; // New: User's age
  area?: string; // New: User's area/location description
  currentLocation?: { // New: Real-time location for users, esp. collectors
    lat: number;
    lng: number;
  };
  status?: 'idle' | 'enroute' | 'collecting' | 'active'; // New: Status for collectors
}

export interface Bin {
  id: string;
  serialNumber: string;
  fillLevel: number; // Percentage from 0 to 100
  location: {
    lat: number;
    lng: number;
  };
  lastUpdated: string; // ISO string date
  status: 'active' | 'inactive' | 'full' | 'collected';
}

export enum NotificationType {
  BIN_FULL = 'BIN_FULL',
  BIN_NEAR_FULL = 'BIN_NEAR_FULL',
  REPORT_RECEIVED = 'REPORT_RECEIVED',
  BIN_COLLECTED = 'BIN_COLLECTED',
  GENERAL_ALERT = 'GENERAL_ALERT',
  BIN_UNCOLLECTED_CRITICAL = 'BIN_UNCOLLECTED_CRITICAL', // New type for critical unemptied bin alerts
  BIN_ASSIGNED_NEAR_FULL = 'BIN_ASSIGNED_NEAR_FULL', // New: Notification when bin is assigned near full
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string; // ISO string date
  read: boolean;
  binId?: string;
  reportId?: string;
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export interface Report {
  id: string;
  userId: string;
  binId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  issue: string; // Description of the issue
  status: ReportStatus;
  submittedAt: string; // ISO string date
  resolvedAt?: string;
  summary?: string; // AI-generated summary
  assignedTo?: string; // Collector ID
  imageUrl?: string; // Optional Base64 encoded image
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface BinFilters {
  searchTerm: string;
  status: Bin['status'] | 'all';
  minFillLevel: number | '';
  maxFillLevel: number | '';
  collectorId?: string | 'all'; // New: Filter by assigned collector ID
}