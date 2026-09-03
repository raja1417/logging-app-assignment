import { randomUUID } from "crypto";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  pricePerNight: number;
  rating: number;
  availableRooms: number;
}

export interface Booking {
  id: string;
  hotelId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  createdAt: string;
}

const hotels: Hotel[] = [
  { id: "h-1", name: "Goa Beach Resort", city: "Goa", pricePerNight: 120, rating: 4.5, availableRooms: 12 },
  { id: "h-2", name: "Mumbai Grand Palace", city: "Mumbai", pricePerNight: 200, rating: 4.2, availableRooms: 5 },
  { id: "h-3", name: "Delhi Heritage Inn", city: "Delhi", pricePerNight: 90, rating: 3.9, availableRooms: 20 },
  { id: "h-4", name: "Bengaluru Tech Suites", city: "Bengaluru", pricePerNight: 150, rating: 4.6, availableRooms: 8 },
];

const bookings = new Map<string, Booking>();

export class HotelRepository {
  list(): Hotel[] {
    return hotels;
  }

  findById(id: string): Hotel | undefined {
    return hotels.find((h) => h.id === id);
  }
}

export class BookingRepository {
  create(input: Omit<Booking, "id" | "createdAt">): Booking {
    const booking: Booking = {
      ...input,
      id: `b-${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    bookings.set(booking.id, booking);
    return booking;
  }

  findById(id: string): Booking | undefined {
    return bookings.get(id);
  }

  delete(id: string): boolean {
    return bookings.delete(id);
  }

  clear(): void {
    bookings.clear();
  }
}

export const hotelRepository = new HotelRepository();
export const bookingRepository = new BookingRepository();
