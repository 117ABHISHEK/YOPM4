import express from "express";
import session from "express-session";
import passport from "passport";
import "../passport-setup.js"; // Corrected path to the root directory
import "./strategies/google.js";
import "./strategies/github.js"; // This now correctly uses a relative path
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // If not authenticated, redirect to the login page
  res.redirect("/");
};

// Routes
import authRoutes from "./routes/auth.js";
app.use("/auth", authRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'login.html'));
});

app.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'dashboard.html'));
});

export default app;
