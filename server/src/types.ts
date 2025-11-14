export type UserRole = 'admin' | 'waiter' | 'kitchen' | 'bar' | 'cashier';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'CANCELLED';

export type PaymentMethod = 'cash' | 'card';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  pin: string | null;
  branchId: string; // Zorunlu
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'kitchen' | 'bar' | 'dessert' | 'campaign';
  menuCategory?: string; // Ana kategori: 'food', 'drink', 'dessert', 'campaign'
  items?: Array<{ id: string; name: string; category: 'kitchen' | 'bar' }>; // Kampanya menüleri için
  branchId: string; // Zorunlu
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  category: 'kitchen' | 'bar';
  status: OrderStatus;
  cancelledReason?: string;
  branchId: string; // Zorunlu
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  discount?: number;
  finalAmount: number;
  paidAt: string;
  cashierId: string;
  cashierName: string;
}

export interface Order {
  id: string;
  waiterId: string;
  waiterName: string;
  tableNumber?: number;
  items: OrderItem[];
  createdAt: string;
  totalAmount: number;
  payment?: Payment;
  isPaid: boolean;
  branchId: string; // Zorunlu
}

export interface DailyReport {
  totalRevenue: number;
  cancelledAmount: number;
  waiterSales: Record<string, { name: string; sales: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  paymentMethods: {
    cash: number;
    card: number;
  };
}
