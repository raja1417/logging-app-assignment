import { z } from "zod";

export const createBookingSchema = z.object({
  hotelId: z.string().min(1, "hotelId is required"),
  guestName: z.string().min(1, "guestName is required").max(200),
  checkIn: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "checkIn must be a valid date"),
  checkOut: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "checkOut must be a valid date"),
  guests: z.number().int().min(1).max(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
