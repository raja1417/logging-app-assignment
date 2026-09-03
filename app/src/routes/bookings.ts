import { Router } from "express";
import { bookingRepository, hotelRepository } from "../repository";
import { createBookingSchema } from "../lib/validation";
import { HttpError } from "../middleware/error";

export const bookingsRouter = Router();

bookingsRouter.post("/", (req, res) => {
  const input = createBookingSchema.parse(req.body);

  const hotel = hotelRepository.findById(input.hotelId);
  if (!hotel) {
    throw new HttpError(400, `Unknown hotelId ${input.hotelId}`);
  }
  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    throw new HttpError(400, "checkOut must be after checkIn");
  }

  const booking = bookingRepository.create(input);
  res.status(201).json({ booking });
});

bookingsRouter.get("/:id", (req, res) => {
  const booking = bookingRepository.findById(req.params.id);
  if (!booking) {
    throw new HttpError(404, `Booking ${req.params.id} not found`);
  }
  res.json({ booking });
});

bookingsRouter.delete("/:id", (req, res) => {
  const deleted = bookingRepository.delete(req.params.id);
  if (!deleted) {
    throw new HttpError(404, `Booking ${req.params.id} not found`);
  }
  res.status(204).send();
});
