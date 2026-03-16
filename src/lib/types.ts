export interface Service {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TimeSlotTemplate {
  id: string;
  service_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  capacity: number;
}

export interface SpecialDate {
  id: string;
  service_id: string;
  date: string; // YYYY-MM-DD
  is_closed: boolean;
  note: string | null;
}

export interface DateSlotOverride {
  id: string;
  service_id: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  capacity: number;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  booking_code: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  name: string;
  phone: string;
  id_number: string | null;
  note: string | null;
  status: BookingStatus;
  created_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  available: number;
}
