export interface DashboardStats {
  availableRooms: number;
  activeBookings: number;
  pendingTasks: number;
  todayRevenue: number;
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
