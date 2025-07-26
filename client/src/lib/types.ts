export interface DashboardStats {
  availableRooms: number;
  activeBookings: number;
  pendingTasks: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  weeklyGrowth: number;
  paymentMethodBreakdown: {
    cash: number;
    cashApp: number;
  };
  todayCashPayments: number;
  todayCashAppPayments: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  overduePaymentsCount: number;
  overduePaymentsAmount: number;
  lastPaymentTime?: string;
  cashDrawerStats?: CashDrawerStats[];
}

export interface CashDrawerStats {
  managerId: string;
  managerName: string;
  property: string;
  currentCashHolding: number;
  lastTurnInDate: string | null;
  lastTurnInAmount: number | null;
  totalCashCollectedToday: number;
  pendingTurnIn: number;
}

export interface CashTurnIn {
  id: string;
  managerId: string;
  managerName: string;
  property: string;
  amount: number;
  turnInDate: Date;
  notes?: string;
  receivedBy?: string;
  createdAt: Date;
}

export interface AdminCashDrawer {
  id: string;
  type: 'cash_received' | 'cashapp_received' | 'bank_deposit_cash' | 'bank_deposit_cashapp' | 'house_bank_transfer';
  amount: number;
  source?: string; // Manager name or transaction source
  description: string;
  transactionDate: Date;
  createdBy: string;
  createdAt: Date;
}

export interface HouseBankTransaction {
  id: string;
  type: 'transfer_in' | 'expense_supplies' | 'expense_contractor' | 'expense_maintenance' | 'expense_other';
  amount: number;
  category: 'supplies' | 'contractors' | 'maintenance' | 'utilities' | 'other';
  vendor?: string;
  description: string;
  receiptUrl?: string;
  transactionDate: Date;
  createdBy: string;
  createdAt: Date;
}

export interface HouseBankStats {
  currentBalance: number;
  totalTransfersIn: number;
  totalExpenses: number;
  expensesByCategory: {
    supplies: number;
    contractors: number;
    maintenance: number;
    utilities: number;
    other: number;
  };
  recentTransactions: HouseBankTransaction[];
}

export interface AdminDrawerStats {
  currentCashHolding: number;
  currentCashAppHolding: number;
  totalCashReceived: number;
  totalCashAppReceived: number;
  totalCashDeposited: number;
  totalCashAppDeposited: number;
  lastCashDeposit?: {
    amount: number;
    date: Date;
  };
  lastCashAppDeposit?: {
    amount: number;
    date: Date;
  };
}

export interface PaymentWithStaff {
  id: string;
  bookingId: string;
  amount: string;
  method: string;
  transactionId?: string;
  dateReceived: Date;
  receivedBy: string;
  receivedByName: string;
  notes?: string;
  createdAt: Date;
}

export interface RoomWithDetails {
  id: string;
  propertyId: string;
  roomNumber: number;
  status: string;
  doorCode: string | null;
  codeExpiry: string | null;
  cleaningStatus: string;
  linenStatus: string;
  lastCleaned: string | null;
  lastLinenChange: string | null;
  notes: string | null;
}

export interface PropertyWithRooms {
  id: string;
  name: string;
  description: string;
  frontDoorCode: string;
  codeExpiry: string | null;
  rateDaily: string;
  rateWeekly: string;
  rateMonthly: string;
  rooms: RoomWithDetails[];
}

export interface CleaningTaskWithDetails {
  id: string;
  roomId: string | null;
  propertyId: string | null;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InquiryStatus {
  id: string;
  status: string;
  booking: {
    roomId: string;
    doorCode: string;
    frontDoorCode: string;
    startDate: string;
    endDate: string;
  } | null;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'helper';
  property?: string;
  name: string;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  propertyId: string;
  item: string;
  quantity: number;
  threshold: number;
  unit: string;
  notes?: string;
  lastUpdated: Date;
}

export interface MaintenanceItem {
  id: string;
  propertyId: string;
  roomId?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'in_progress' | 'completed';
  dateReported: Date;
  completedAt?: Date;
  notes?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  number: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';
  cleaningStatus: 'clean' | 'dirty' | 'in_progress';
  linenStatus: 'fresh' | 'used' | 'washing';
  doorCode?: string;
  codeExpiry?: Date;
  lastCleaned?: Date;
  lastLinenChange?: Date;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  frontDoorCode?: string;
  rateDaily: string;
  rateWeekly: string;
  rateMonthly: string;
}

export interface CleaningTask {
  id: string;
  roomId?: string;
  propertyId: string;
  type: string;
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  createdAt: Date;
}

export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  plan: string;
  startDate: Date;
  endDate?: Date;
  totalAmount: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  doorCode?: string;
  frontDoorCode?: string;
  codeExpiry?: Date;
  notes?: string;
}