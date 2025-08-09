import express from "express";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import "./strategies/google.js";
import "./strategies/github.js";

dotenv.config();
const app = express();

app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
import authRoutes from "./routes/auth.js";
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

export default app;
