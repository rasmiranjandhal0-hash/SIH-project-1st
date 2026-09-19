const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all products with filtering & search
router.get('/', async (req, res) => {
  try {
    const products = await db.getAllProducts(req.query);
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new product from Kaarigar AI Virtual Manager listing flow
router.post('/', async (req, res) => {
  try {
    const {
      title,
      titleHi,
      subtitle,
      subtitleHi,
      category,
      categoryHi,
      price,
      priceRange,
      marketPrice,
      artisanPayout,
      story,
      storyHi,
      material,
      materialHi,
      craftTechnique,
      craftTechniqueHi,
      daysToCraft,
      artisanName,
      artisanNameHi,
      artisanVillage,
      artisanVillageHi,
      artisanState,
      imageUrl,
      rawImageUrl,
      rawSpeech
    } = req.body;

    if (!title || !price) {
      return res.status(400).json({ success: false, error: 'Title and price are required' });
    }

    const defaultImages = {
      raw: rawImageUrl || imageUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      studio: imageUrl || "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80"
    };

    const newProduct = await db.addProduct({
      title,
      titleHi: titleHi || title,
      subtitle: subtitle || "Handcrafted Heritage Artistry",
      subtitleHi: subtitleHi || subtitle || "हस्तनिर्मित भारतीय शिल्प",
      category: category || "Heritage Crafts",
      categoryHi: categoryHi || "हस्तशिल्प",
      giTag: "GI Status: Direct Rural Maker Verified",
      price: Number(price),
      priceRange: priceRange || {
        min: Math.round(Number(price) * 0.9),
        max: Math.round(Number(price) * 1.2),
        recommended: Number(price),
        confidence: "92%",
        justification: "Calculated via Kaarigar AI Dynamic Pricing engine."
      },
      marketPrice: Number(marketPrice) || Math.round(Number(price) * 1.8),
      artisanPayout: Number(artisanPayout) || Math.round(Number(price) * 0.88),
      stockRemaining: 8,
      totalBatchSize: 15,
      dropEndsIn: "24h 00m",
      isFeaturedDrop: true,
      images: defaultImages,
      artisan: {
        name: artisanName || "Master Artisan",
        nameHi: artisanNameHi || "सिद्ध शिल्पकार",
        generation: "Generational Folk Artisan",
        experienceYears: 20,
        village: artisanVillage || "Rural Artisan Hub",
        villageHi: artisanVillageHi || "शिल्पग्राम",
        state: artisanState || "India",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
        audioBlessing: rawSpeech || "नमस्ते, यह उत्पाद हमने पूरी लगन और शुद्धता से तैयार किया है।",
        coordinates: "24.5854° N, 73.7125° E"
      },
      provenance: {
        material: material || "Natural organic earth & mineral glaze",
        materialHi: materialHi || "प्राकृतिक मिट्टी व वानस्पतिक रंग",
        firingMethod: craftTechnique || "Hand-spun wheel & traditional kiln",
        firingMethodHi: craftTechniqueHi || "पारंपरिक हस्तनिर्मित विधि",
        daysToCraft: Number(daysToCraft) || 2
      },
      story: story || "Crafted using ancestral traditions handed down across generations.",
      storyHi: storyHi || "पीढ़ियों से चली आ रही पारंपरिक हस्तकला द्वारा निर्मित।",
      tags: [category || "Craft", "Handmade", "KaarigarAI"]
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
