const express = require("express");
const router = express.Router();
const {
  getRandomShlok,
  getDailyShlok,
  getShlokByChapterVerse,
} = require("../controllers/shlokController");

/**
 * @route   GET /api/shloks/daily
 * @desc    Get today's daily shlok (same for all users on this day)
 * @access  Public
 */
router.get("/daily", async (req, res) => {
  try {
    const shlok = await getDailyShlok();
    if (!shlok) {
      return res
        .status(404)
        .json({ success: false, message: "No shloks found" });
    }
    res.json({ success: true, shlok });
  } catch (error) {
    console.error("Error getting daily shlok:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/shloks/random
 * @desc    Get a random shlok
 * @access  Public
 */
router.get("/random", async (req, res) => {
  try {
    const shlok = await getRandomShlok();
    if (!shlok) {
      return res
        .status(404)
        .json({ success: false, message: "No shloks found" });
    }
    res.json({ success: true, shlok });
  } catch (error) {
    console.error("Error getting random shlok:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/shloks/:chapter/:verse
 * @desc    Get a specific shlok by chapter and verse
 * @access  Public
 */
router.get("/:chapter/:verse", async (req, res) => {
  try {
    const { chapter, verse } = req.params;
    const shlok = await getShlokByChapterVerse(chapter, verse);

    if (!shlok) {
      return res.status(404).json({
        success: false,
        message: `Shlok not found for chapter ${chapter}, verse ${verse}`,
      });
    }

    res.json({ success: true, shlok });
  } catch (error) {
    console.error("Error getting shlok by chapter and verse:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
