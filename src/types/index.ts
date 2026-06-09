export type SportType = 'badminton' | 'tabletennis' | 'gym';

export type VenueStatus = 'available' | 'booked' | 'maintenance' | 'competition';

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'no_show';

export type UserRole = 'user' | 'admin';

export interface Venue {
  id: string;
  name: string;
  type: SportType;
  capacity: number;
  pricePerHour: number;
  isFree: boolean;
  description: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  venueId: string;
  date: string;
  status: VenueStatus;
  competitionName?: string;
  competitionId?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  venueId: string;
  venueName: string;
  sportType: SportType;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  contactName: string;
  contactPhone: string;
  price: number;
  status: OrderStatus;
  createdAt: string;
  isVerified: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'competition' | 'rule';
  date: string;
  isImportant: boolean;
  competitionId?: string;
}

export interface AdminSettings {
  dailyBookingLimit: number;
  openTime: string;
  closeTime: string;
}

export interface DailyStats {
  date: string;
  bookings: number;
  checkIns: number;
}

export interface CompetitionInfo {
  id: string;
  name: string;
  venueId: string;
  venueName: string;
  sportType: SportType;
  date: string;
  slotIds: string[];
  startTime: string;
  endTime: string;
  timeRanges: string;
}

export interface Statistics {
  totalBookings: number;
  totalCheckIns: number;
  attendanceRate: number;
  noShowCount: number;
  dailyData: DailyStats[];
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface BookingFormData {
  sportType: SportType | null;
  venueId: string | null;
  date: string;
  timeSlotId: string | null;
  peopleCount: number;
  contactName: string;
  contactPhone: string;
}
