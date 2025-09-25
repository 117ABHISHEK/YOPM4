const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  players: [{ type: String, required: true }], // usernames
  scores: { p1: Number, p2: Number },
  winner: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Match", matchSchema);
