import { Router } from "express";
import { hotelRepository } from "../repository";
import { HttpError } from "../middleware/error";

export const hotelsRouter = Router();

hotelsRouter.get("/", (_req, res) => {
  res.json({ hotels: hotelRepository.list() });
});

hotelsRouter.get("/:id", (req, res) => {
  const hotel = hotelRepository.findById(req.params.id);
  if (!hotel) {
    throw new HttpError(404, `Hotel ${req.params.id} not found`);
  }
  res.json({ hotel });
});
