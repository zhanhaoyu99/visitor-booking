export interface Service {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TimeSlotTemplate {
  id: string;
  serviceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface SpecialDate {
  id: string;
  serviceId: string;
  date: string;
  isClosed: boolean;
  note: string | null;
}

export interface DateSlotOverride {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  bookingCode: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  idNumber: string | null;
  note: string | null;
  status: BookingStatus;
  createdAt: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  available: number;
}
