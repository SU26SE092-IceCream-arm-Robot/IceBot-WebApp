export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager';
  avatarUrl?: string;
  createdAt: string;
}

export interface KioskMachine {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  lastPing: string;
  iceCreamStock: number;
  cupStock: number;
}

export interface Order {
  id: string;
  kioskId: string;
  kioskName: string;
  totalAmount: number;
  paymentMethod: 'momo' | 'vnpay' | 'cash';
  status: 'success' | 'failed' | 'pending';
  itemsCount: number;
  createdAt: string;
}

export interface IceCreamProduct {
  id: string;
  name: string;
  flavor: string;
  price: number;
  imagePath: string;
  isAvailable: boolean;
}
