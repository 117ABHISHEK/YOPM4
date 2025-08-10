import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from public folder
app.use(express.static('public'));

// Serve index.html from public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import  './src/strategies/google.js';
import  './src/strategies/github.js';


dotenv.config();
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
import authRoutes from "./src/routes/auth.js";
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

export default app;
