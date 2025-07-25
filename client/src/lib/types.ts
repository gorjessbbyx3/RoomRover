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
