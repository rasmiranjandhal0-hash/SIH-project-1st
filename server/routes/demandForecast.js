const express = require('express');
const router = express.Router();
const { festivalForecasts, shgClusters } = require('../data/seedData');

// GET /api/forecast - Festival Demand Forecasting
router.get('/forecast', (req, res) => {
  res.json({
    success: true,
    count: festivalForecasts.length,
    data: festivalForecasts,
    systemNote: "Proactive AI forecasting: Advises artisans to prepare inventory 3-6 weeks before physical/digital festival demand peaks."
  });
});

// GET /api/clusters - Cluster & SHG (Self-Help Group) Management
router.get('/clusters', (req, res) => {
  res.json({
    success: true,
    count: shgClusters.length,
    data: shgClusters
  });
});

// POST /api/clusters/onboard - Collective SHG Onboarding Simulation
router.post('/clusters/onboard', (req, res) => {
  const { clusterName, village, leadArtisan, craftType, memberCount } = req.body;
  const newCluster = {
    id: `shg-${Date.now().toString().slice(-4)}`,
    name: clusterName || "New Mahila Hastshilp SHG",
    village: village || "Rural Craft Cluster",
    leadArtisan: leadArtisan || "Lead Coordinator",
    activeArtisansCount: parseInt(memberCount, 10) || 10,
    craftType: craftType || "Traditional Folk Handicrafts",
    totalProductsListed: 0,
    monthlyCollectiveRevenue: "₹0"
  };
  shgClusters.push(newCluster);
  res.status(201).json({
    success: true,
    message: "Artisan Cluster / SHG onboarded successfully for collective catalog management!",
    data: newCluster
  });
});

module.exports = router;
