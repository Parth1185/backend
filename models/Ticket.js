import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    passengerName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true },
    fromStation: { type: String, required: true },
    toStation: { type: String, required: true },
    trainName: { type: String, required: true },
    trainNumber: { type: String, required: true },
    travelClass: { type: String, required: true },
    dateOfJourney: { type: Date, required: true },
    seatNumber: { type: Number, required: true },
    pnr: { type: String, required: true, unique: true },
    fromTime: { type: String, required: true },
    toTime: { type: String, required: true },
    qrCode: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
