import { centres } from "../data/centres";
import type { Booking, Centre } from "../types";

export type CentreSettings = Record<
  string,
  { open: boolean; slots: number; capacity: number }
>;
export const active = (b: Booking) =>
  ["booked", "arrived", "weighing"].includes(b.status);
export function localDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function remaining(
  c: Centre,
  bookings: Booking[],
  settings: CentreSettings,
  date: string,
) {
  return (
    (settings[c.id]?.capacity ??
      c.capacityTonnes * 1000 - c.capacityUsedTonnes * 1000) -
    bookings
      .filter(
        (b) =>
          b.centreId === c.id && b.date === date && b.status !== "cancelled",
      )
      .reduce((n, b) => n + b.quantityKg, 0)
  );
}
export function slots(
  c: Centre,
  date: string,
  bookings: Booking[],
  settings: CentreSettings,
) {
  const now = new Date();
  return Array.from(
    { length: Math.floor((c.closesAt - c.opensAt) / 60) },
    (_, i) => {
      const hour = c.opensAt / 60 + i;
      const id = `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`;
      const count = bookings.filter(
        (b) =>
          b.centreId === c.id &&
          b.date === date &&
          b.slotId === id &&
          b.status !== "cancelled",
      ).length;
      return {
        id,
        left: Math.max(0, (settings[c.id]?.slots ?? 6) - count),
        past:
          date < localDate() ||
          (date === localDate() &&
            hour * 60 <= now.getHours() * 60 + now.getMinutes()),
      };
    },
  );
}
export function recommend(
  crop: string,
  quantity: number,
  date: string,
  bookings: Booking[],
  settings: CentreSettings,
  queues: Record<string, number>,
) {
  return centres
    .filter(
      (c) =>
        settings[c.id]?.open !== false &&
        c.rates[crop] &&
        remaining(c, bookings, settings, date) >= quantity &&
        slots(c, date, bookings, settings).some((s) => !s.past && s.left > 0),
    )
    .sort(
      (a, b) =>
        (queues[a.id] ?? a.initialQueue) * a.minutesPerFarmer +
        a.distanceKm * 2 -
        ((queues[b.id] ?? b.initialQueue) * b.minutesPerFarmer +
          b.distanceKm * 2),
    );
}
export function bookingError(
  c: Centre,
  crop: string,
  quantity: number,
  date: string,
  slot: string,
  bookings: Booking[],
  settings: CentreSettings,
  phone: string,
) {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000)
    return "quantity";
  if (bookings.some((b) => b.farmerPhone === phone && active(b)))
    return "active";
  if (
    settings[c.id]?.open === false ||
    !c.rates[crop] ||
    remaining(c, bookings, settings, date) < quantity
  )
    return "capacity";
  if (
    !slots(c, date, bookings, settings).some(
      (s) => s.id === slot && !s.past && s.left > 0,
    )
  )
    return "slot";
  return null;
}
