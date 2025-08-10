import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // After any successful login, redirect to a central dashboard.
    res.redirect("/dashboard");
  }
);

router.get("/github", passport.authenticate("github", { scope: ["read:user", "repo"] }));

router.get("/github/callback", 
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => res.redirect("/dashboard")
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect("/");
  });
});

router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

router.get("/repos", async (req, res) => {
  if (!req.user || !req.user.accessToken) return res.redirect("/");
  
  const response = await fetch("https://api.github.com/user/repos", {
    headers: { Authorization: `token ${req.user.accessToken}` }
  });
  const repos = await response.json();
  res.json(repos);
});

export default router;
