export type ScreenType =
  | 'login'
  | 'scan'
  | 'inventory'
  | 'history'
  | 'account'
  | 'profile-security'
  | 'preferences'
  | 'digital-signatures'
  | 'register'
  | 'password-reset'
  | 'payment'
  | 'pricing'
  | 'ai-chat'
  | 'wallet';

export type TransitionType = 'push' | 'push_back' | 'none';

export type UserRole = 'User' | 'Producer' | 'Logistics' | 'Retailer';

export interface UserProfile {
  name: string;
  role: UserRole;
  identifier: string;
  joinedDate: string;
  origin: string;
  avatarUrl: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  batchId: string;
  scannedAt: string;
  status: 'verified' | 'alert';
  imageUrl: string;
  origin?: string;
  harvestDate?: string;
  certifications?: string;
}

export interface HistoryCheckpoint {
  id: string;
  title: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'pending';
  validSignature?: boolean;
}
