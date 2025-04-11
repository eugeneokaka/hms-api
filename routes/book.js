const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Define available time slots
const TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00"]; // Five slots per day

// POST route for booking an appointment
router.post("/", async (req, res) => {
  console.log("book.js");
  try {
    const { userId, date, time } = req.body;
    console.log(req.body);

    if (!userId || !date || !time) {
      console.log("book.js: missing userId, date, or time");
      return res
        .status(400)
        .json({ message: "User ID, date, and time are required" });
    }

    // Validate the time slot
    if (!TIME_SLOTS.includes(time)) {
      console.log("book.js: invalid time slot");
      return res.status(400).json({ message: "Invalid time slot selected" });
    }

    // Convert date and time into a Date object (UTC format)
    const bookingDate = new Date(`${date}T${time}:00.000Z`);
    console.log("boogingdate:", bookingDate);

    // Count existing bookings for the selected date
    const dailyBookings = await prisma.booking.count({
      where: {
        date: { gte: new Date(date), lt: new Date(date + "T23:59:59.999Z") },
      },
    });
    console.log("daislybooking", dailyBookings);

    if (dailyBookings >= 5) {
      console.log("book.js: booking limit reached");
      return res
        .status(401)
        .json({ message: "Booking limit reached for this day" });
    }

    // Check if the selected time slot is already booked
    const existingSlot = await prisma.booking.findFirst({
      where: { date: bookingDate },
    });
    console.log("existing", existingSlot);

    if (existingSlot) {
      console.log("book.js: time slot already booked");
      return res.status(402).json({ message: "Time slot already booked" });
    }

    // Create a new booking
    const newBooking = await prisma.booking.create({
      data: {
        userId,
        date: bookingDate,
      },
    });
    console.log(newBooking);

    return res
      .status(201)
      .json({ message: "Booking successful", booking: newBooking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/available-dates", async (req, res) => {
  try {
    // Get all booked dates
    const bookedDates = await prisma.booking.findMany({
      select: { date: true },
    });

    // Extract booked dates into a Set for quick lookup
    const bookedDateSet = new Set(
      bookedDates.map((b) => b.date.toISOString().split("T")[0])
    );

    // Generate the next 30 days
    const today = new Date();
    const availableDates = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!bookedDateSet.has(formattedDate)) {
        availableDates.push(formattedDate);
      }
    }

    res.json(availableDates);
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ message: "Error fetching dates" });
  }
});
module.exports = router;
