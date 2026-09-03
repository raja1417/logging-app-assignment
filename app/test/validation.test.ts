import { describe, expect, it } from "vitest";
import { createBookingSchema } from "../src/lib/validation";

describe("createBookingSchema", () => {
  it("accepts a valid booking payload", () => {
    const result = createBookingSchema.safeParse({
      hotelId: "h-1",
      guestName: "Alice",
      checkIn: "2030-01-01",
      checkOut: "2030-01-05",
      guests: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing guestName", () => {
    const result = createBookingSchema.safeParse({
      hotelId: "h-1",
      guestName: "",
      checkIn: "2030-01-01",
      checkOut: "2030-01-05",
      guests: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date strings", () => {
    const result = createBookingSchema.safeParse({
      hotelId: "h-1",
      guestName: "Alice",
      checkIn: "not-a-date",
      checkOut: "2030-01-05",
      guests: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects guests outside allowed range", () => {
    const result = createBookingSchema.safeParse({
      hotelId: "h-1",
      guestName: "Alice",
      checkIn: "2030-01-01",
      checkOut: "2030-01-05",
      guests: 0,
    });
    expect(result.success).toBe(false);
  });
});
