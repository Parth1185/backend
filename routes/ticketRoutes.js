
import express from "express";
import QRCode from "qrcode";
import axios from "axios";
import Ticket from "../models/Ticket.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/tbook", requireAuth, async (req, res) => {
  try {
    const {
      passengerName,
      age,
      gender,
      mobile,
      fromStation,
      toStation,
      trainName,
      trainNumber,
      travelClass,
      dateOfJourney,
    } = req.body;

    if (
      !passengerName ||
      !age ||
      !gender ||
      !mobile ||
      !fromStation ||
      !toStation ||
      !trainName ||
      !trainNumber ||
      !travelClass ||
      !dateOfJourney
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let fromTime = null;
    let toTime = null;

    try {
      const apiResponse = await axios.get(
        `http://localhost:5000/api/train/getTrainOn`,
        {
          params: { from: fromStation, to: toStation, date: dateOfJourney },
        }
      );

      const trains = apiResponse.data?.data || [];
      const selectedTrain = trains.find(
        (train) =>
          train.train_base?.train_no === trainNumber &&
          train.train_base?.train_name.toLowerCase() === trainName.toLowerCase()
      );

      if (!selectedTrain) {
        return res.status(404).json({
          message: "Train not found for the selected route and date",
        });
      }

      fromTime = selectedTrain.train_base.from_time;
      toTime = selectedTrain.train_base.to_time;
    } catch (apiError) {
      return res.status(500).json({
        message: "Failed to fetch train timings from backend API",
        error: apiError.message,
      });
    }

    const seatNumber = Math.floor(Math.random() * 70) + 1;
    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const qrText = `
PNR: ${pnr}
Name: ${passengerName}
Train: ${trainName} (${trainNumber})
From: ${fromStation} at ${fromTime}
To: ${toStation} at ${toTime}
Seat: ${seatNumber}
Date: ${dateOfJourney}`;

    const qrCode = await QRCode.toDataURL(qrText);
    const [dd, mm, yyyy] = dateOfJourney.split("-");
    const journeyDate = new Date(`${yyyy}-${mm}-${dd}`);

    const newTicket = new Ticket({
      passengerName,
      age,
      gender,
      mobile,
      fromStation,
      toStation,
      trainName,
      trainNumber,
      travelClass,
      dateOfJourney: journeyDate,
      seatNumber,
      pnr,
      fromTime,
      toTime,
      qrCode,
      userId: req.userId,
    });

    await newTicket.save();

    return res.status(201).json({ message: "Ticket booked successfully", ticket: newTicket });
  } catch (error) {
    return res.status(500).json({ message: "Server error while booking ticket", error: error.message });
  }
});

router.post("/cancel/:id", requireAuth, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found or unauthorized" });

    await ticket.deleteOne();
    res.json({ message: "Ticket cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while cancelling ticket" });
  }
});

router.get("/thistory", requireAuth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.userId }).sort({ dateOfJourney: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching ticket history" });
  }
});


// ⭐ Get all tickets (Admin Only)
router.get("/all", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching all tickets" });
  }
});

// ⭐ Delete any ticket (Admin only)
router.delete("/delete/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.deleteOne();
    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting ticket" });
  }
});


export default router;