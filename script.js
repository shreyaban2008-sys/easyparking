


const hotels = {
  grand: {
    name: "Grand Palace Hotel",
    spaces: 8
  },
  royal: {
    name: "Royal Orchid Hotel",
    spaces: 8
  }
};

const STORAGE_KEY = "parkease_demo_reservations";

let reservations = [];

try {
  reservations = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  if (!Array.isArray(reservations)) reservations = [];
} catch {
  reservations = [];
}

let selectedSpace = null;

const hotelInput = document.getElementById("hotel");
const dateInput = document.getElementById("date");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");

const parkingGrid = document.getElementById("parkingGrid");
const spaceCount = document.getElementById("spaceCount");
const selectedMessage = document.getElementById("selectedMessage");
const searchMessage = document.getElementById("searchMessage");
const bookingMessage = document.getElementById("bookingMessage");

function saveReservations() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(reservations)
    );
    return true;
  } catch {
    return false;
  }
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = "message " + type;
}

function getTimeRange() {
  return {
    hotel: hotelInput.value,
    date: dateInput.value,
    start: startInput.value,
    end: endInput.value
  };
}

function validTimeRange() {
  const range = getTimeRange();

  if (!range.date || !range.start || !range.end) {
    return "Please select a date and both times.";
  }

  if (range.start >= range.end) {
    return "Departure time must be after arrival time.";
  }

  const chosenDate = new Date(range.date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (chosenDate < today) {
    return "Please select today or a future date.";
  }

  return "";
}

function overlaps(a, b) {
  return a.date === b.date &&
    a.start < b.end &&
    b.start < a.end;
}

function isReserved(spaceId, range) {
  return reservations.some(reservation =>
    reservation.hotel === range.hotel &&
    reservation.spaceId === spaceId &&
    reservation.status === "Reserved" &&
    overlaps(reservation, range)
  );
}

function renderSpaces() {
  const range = getTimeRange();
  const hotel = hotels[range.hotel];

  parkingGrid.replaceChildren();

  const error = validTimeRange();

  if (error) {
    selectedSpace = null;
    spaceCount.textContent = "Select a valid time";
    setMessage(selectedMessage, error, "error");
    return;
  }

  let availableCount = 0;

  for (let i = 1; i <= hotel.spaces; i++) {
    const spaceId = "P" + String(i).padStart(2, "0");
    const reserved = isReserved(spaceId, range);
    const isSelected = selectedSpace === spaceId && !reserved;

    if (!reserved) availableCount++;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "space";
    button.textContent = spaceId;

    const subtitle = document.createElement("small");
    subtitle.textContent = reserved ? "Reserved" : "Available";
    button.appendChild(subtitle);

    if (reserved) {
      button.disabled = true;
    } else {
      if (isSelected) button.classList.add("chosen");

      button.addEventListener("click", () => {
        selectedSpace = spaceId;
        setMessage(
          selectedMessage,
          spaceId + " selected. Complete the form below."
        );
        renderSpaces();
      });
    }

    parkingGrid.appendChild(button);
  }

  if (selectedSpace && isReserved(selectedSpace, range)) {
    selectedSpace = null;
  }

  spaceCount.textContent =
    availableCount + " of " + hotel.spaces + " available";

  if (!selectedSpace) {
    setMessage(
      selectedMessage,
      "Choose an available parking space."
    );
  }
}

function renderPublicBoard() {
  const tbody = document.getElementById("reservationList");
  tbody.replaceChildren();

  const sorted = [...reservations]
    .filter(r => r.status === "Reserved")
    .sort((a, b) =>
      (a.date + a.start).localeCompare(b.date + b.start)
    );

  if (sorted.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No reservations yet.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  sorted.forEach(r => {
    const row = document.createElement("tr");

    [
      hotels[r.hotel]?.name || "Hotel",
      r.date,
      r.spaceId,
      r.start + "–" + r.end,
      "Reserved"
    ].forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;

      if (index === 4) cell.className = "status";

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });
}

function renderMyReservations() {
  const container = document.getElementById("myReservations");
  container.replaceChildren();

  const mine = reservations.filter(
    r => r.status === "Reserved"
  );

  if (mine.length === 0) {
    container.textContent = "You have no active demo reservations.";
    return;
  }

  mine.forEach(r => {
    const item = document.createElement("div");
    item.className = "my-booking";

    const details = document.createElement("p");
    details.textContent =
      hotels[r.hotel]?.name + " · " + r.spaceId +
      " · " + r.date + " · " + r.start + "–" + r.end;

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "cancel";
    cancel.textContent = "Cancel reservation";

    cancel.addEventListener("click", () => {
      if (!confirm("Cancel this demo reservation?")) return;

      reservations = reservations.filter(
        booking => booking.id !== r.id
      );

      if (!saveReservations()) {
        setMessage(
          bookingMessage,
          "Could not save the cancellation. Check browser storage.",
          "error"
        );
        return;
      }

      selectedSpace = null;
      setMessage(bookingMessage, "Reservation cancelled.", "success");
      renderAll();
    });

    item.append(details, cancel);
    container.appendChild(item);
  });
}

function renderAll() {
  renderSpaces();
  renderPublicBoard();
  renderMyReservations();
}

document.getElementById("searchForm").addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const error = validTimeRange();

    if (error) {
      setMessage(searchMessage, error, "error");
      renderSpaces();
      return;
    }

    selectedSpace = null;
    setMessage(searchMessage, "Availability updated.", "success");
    setMessage(selectedMessage, "Choose an available space.");
    renderAll();
  }
);

[hotelInput, dateInput, startInput, endInput].forEach(input => {
  input.addEventListener("change", () => {
    selectedSpace = null;
    setMessage(searchMessage, "");
    renderAll();
  });
});

document.getElementById("bookingForm").addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const error = validTimeRange();

    if (error) {
      setMessage(bookingMessage, error, "error");
      return;
    }

    if (!selectedSpace) {
      setMessage(
        bookingMessage,
        "Please select an available parking space first.",
        "error"
      );
      return;
    }

    const range = getTimeRange();

    if (isReserved(selectedSpace, range)) {
      selectedSpace = null;
      renderAll();
      setMessage(
        bookingMessage,
        "That space has already been reserved. Choose another.",
        "error"
      );
      return;
    }

    const customerName =
      document.getElementById("customerName").value.trim();

    const vehicle =
      document.getElementById("vehicle").value.trim();

    if (!customerName || !vehicle) {
      setMessage(
        bookingMessage,
        "Enter your name and vehicle number.",
        "error"
      );
      return;
    }

    const booking = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      hotel: range.hotel,
      date: range.date,
      start: range.start,
      end: range.end,
      spaceId: selectedSpace,
      customerName,
      vehicle,
      status: "Reserved"
    };

    reservations.push(booking);

    if (!saveReservations()) {
      reservations = reservations.filter(
        r => r.id !== booking.id
      );
      setMessage(
        bookingMessage,
        "Storage failed. Please check your browser settings.",
        "error"
      );
      return;
    }

    selectedSpace = null;
    document.getElementById("bookingForm").reset();

    setMessage(
      bookingMessage,
      "Reservation saved! Your space is reserved in this browser demo.",
      "success"
    );

    renderAll();
  }
);

// Set the date field to today.
const now = new Date();
const localToday = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0")
].join("-");

dateInput.min = localToday;
dateInput.value = localToday;

renderAll();
