const express = require('express');
const router = express.Router();
const { processArtisanVoice, enhanceProductPhoto } = require('../services/aiService');

// POST /api/ai/process-voice
// Receives spoken speech from mobile microphone (Hindi, Hinglish, Bengali, Tamil, English, etc.)
router.post('/process-voice', async (req, res) => {
  try {
    const { spokenText } = req.body;
    if (!spokenText) {
      return res.status(400).json({ success: false, error: 'spokenText is required' });
    }

    const aiListing = await processArtisanVoice(spokenText);
    res.json({
      success: true,
      data: aiListing
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/enhance-photo
// Simulates studio background & lighting enhancements for raw village photos
router.post('/enhance-photo', (req, res) => {
  try {
    const { imageUrl, style } = req.body;
    const enhanced = enhanceProductPhoto(imageUrl, style);
    res.json({ success: true, data: enhanced });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
