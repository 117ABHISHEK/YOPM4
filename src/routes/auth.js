import express from "express";
import passport from "passport";
import fetch from "node-fetch";

const router = express.Router();

// Google Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => res.redirect("/connect-github"));

// GitHub Login
router.get("/github", passport.authenticate("github", { scope: ["read:user", "repo"] }));
router.get("/github/callback", 
    passport.authenticate("github", { failureRedirect: "/" }),
    (req, res) => res.redirect("/repos"));

// Fetch GitHub Repos
router.get("/repos", async (req, res) => {
    if (!req.user || !req.user.accessToken) return res.redirect("/");
    
    const response = await fetch("https://api.github.com/user/repos", {
        headers: { Authorization: `token ${req.user.accessToken}` }
    });
    const repos = await response.json();
    res.json(repos);
});

// src/routes/auth.js
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("/connect-github")
);

router.get("/github", passport.authenticate("github", { scope: ["read:user", "repo"] }));

router.get("/github/callback", 
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => res.redirect("/dashboard")
);

router.get("/repos", async (req, res) => {
  if (!req.user || !req.user.accessToken) return res.redirect("/");
  
  const response = await fetch("https://api.github.com/user/repos", {
    headers: { Authorization: `token ${req.user.accessToken}` }
  });
  const repos = await response.json();
  res.json(repos);
});


export default router;
