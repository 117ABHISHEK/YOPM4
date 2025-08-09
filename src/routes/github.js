const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// Step 1: Redirect to GitHub
router.get('/connect', (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user repo`;
  res.redirect(redirectUri);
});

// Step 2: Callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `token ${accessToken}` }
    });

    const { login, id } = userRes.data;

    const userId = uuidv4();
    db.run(`INSERT INTO users (id, name, github_username, github_token) VALUES (?, ?, ?, ?)`,
      [userId, login, login, accessToken]);

    res.send(`GitHub connected! Welcome ${login}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('GitHub connection failed.');
  }
});

module.exports = router;
