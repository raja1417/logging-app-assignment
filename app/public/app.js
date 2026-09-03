const logList = document.getElementById("log-list");

function clientLog(message, data) {
  const entry = { ts: new Date().toISOString(), level: "info", message, ...data };
  const li = document.createElement("li");
  li.textContent = JSON.stringify(entry);
  logList.prepend(li);
  while (logList.children.length > 50) {
    logList.removeChild(logList.lastChild);
  }
  // eslint-disable-next-line no-console
  console.log(entry);
}

async function loadHotels() {
  const res = await fetch("/api/hotels");
  const data = await res.json();
  clientLog("hotels_loaded", { count: data.hotels.length, request_id: res.headers.get("x-request-id") });

  const list = document.getElementById("hotels-list");
  const select = document.getElementById("hotelId");
  list.innerHTML = "";
  select.innerHTML = "";

  data.hotels.forEach((hotel) => {
    const card = document.createElement("div");
    card.className = "hotel-card";
    card.innerHTML = `<strong>${hotel.name}</strong><br/>${hotel.city} — $${hotel.pricePerNight}/night<br/>⭐ ${hotel.rating} · ${hotel.availableRooms} rooms left`;
    list.appendChild(card);

    const option = document.createElement("option");
    option.value = hotel.id;
    option.textContent = `${hotel.name} (${hotel.city})`;
    select.appendChild(option);
  });
}

async function submitBooking(event) {
  event.preventDefault();
  const payload = {
    hotelId: document.getElementById("hotelId").value,
    guestName: document.getElementById("guestName").value,
    checkIn: document.getElementById("checkIn").value,
    checkOut: document.getElementById("checkOut").value,
    guests: Number(document.getElementById("guests").value),
  };

  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  const resultEl = document.getElementById("booking-result");

  if (res.ok) {
    resultEl.textContent = `Booking confirmed: ${data.booking.id}`;
    clientLog("booking_created", { booking_id: data.booking.id, status: res.status });
  } else {
    resultEl.textContent = `Error: ${data.message}`;
    clientLog("booking_failed", { status: res.status, message: data.message });
  }
}

document.getElementById("booking-form").addEventListener("submit", submitBooking);
loadHotels().catch((err) => clientLog("hotels_load_failed", { error: String(err) }));
