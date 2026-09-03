import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { bookingRepository } from "../src/repository";

describe("hotels routes", () => {
  const app = createApp();

  it("lists seeded hotels", async () => {
    const res = await request(app).get("/api/hotels");
    expect(res.status).toBe(200);
    expect(res.body.hotels.length).toBeGreaterThan(0);
  });

  it("returns a hotel by id", async () => {
    const res = await request(app).get("/api/hotels/h-1");
    expect(res.status).toBe(200);
    expect(res.body.hotel.id).toBe("h-1");
  });

  it("returns 404 for unknown hotel", async () => {
    const res = await request(app).get("/api/hotels/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("request_error");
  });
});

describe("bookings routes", () => {
  const app = createApp();

  beforeEach(() => {
    bookingRepository.clear();
  });

  it("creates a booking for a valid request", async () => {
    const res = await request(app).post("/api/bookings").send({
      hotelId: "h-1",
      guestName: "Alice",
      checkIn: "2030-01-01",
      checkOut: "2030-01-05",
      guests: 2,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking.hotelId).toBe("h-1");
    expect(res.body.booking.id).toMatch(/^b-/);
  });

  it("rejects invalid payloads with a structured 400", async () => {
    const res = await request(app).post("/api/bookings").send({
      hotelId: "h-1",
      guestName: "",
      checkIn: "not-a-date",
      checkOut: "2030-01-05",
      guests: 2,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it("rejects unknown hotelId", async () => {
    const res = await request(app).post("/api/bookings").send({
      hotelId: "does-not-exist",
      guestName: "Bob",
      checkIn: "2030-01-01",
      checkOut: "2030-01-05",
      guests: 1,
    });
    expect(res.status).toBe(400);
  });

  it("rejects checkOut before checkIn", async () => {
    const res = await request(app).post("/api/bookings").send({
      hotelId: "h-1",
      guestName: "Bob",
      checkIn: "2030-01-05",
      checkOut: "2030-01-01",
      guests: 1,
    });
    expect(res.status).toBe(400);
  });

  it("fetches and deletes a booking", async () => {
    const created = await request(app).post("/api/bookings").send({
      hotelId: "h-2",
      guestName: "Carol",
      checkIn: "2030-02-01",
      checkOut: "2030-02-03",
      guests: 1,
    });
    const id = created.body.booking.id;

    const fetched = await request(app).get(`/api/bookings/${id}`);
    expect(fetched.status).toBe(200);

    const deleted = await request(app).delete(`/api/bookings/${id}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app).get(`/api/bookings/${id}`);
    expect(afterDelete.status).toBe(404);
  });
});

describe("health routes", () => {
  const app = createApp();

  it("healthz returns ok", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("readyz returns ready after startup", async () => {
    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
  });

  it("exposes prometheus metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("http_requests_total");
  });
});

describe("request id middleware", () => {
  const app = createApp();

  it("propagates a client-supplied X-Request-Id", async () => {
    const res = await request(app).get("/healthz").set("X-Request-Id", "test-req-123");
    expect(res.headers["x-request-id"]).toBe("test-req-123");
  });

  it("generates a request id when none supplied", async () => {
    const res = await request(app).get("/healthz");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});
