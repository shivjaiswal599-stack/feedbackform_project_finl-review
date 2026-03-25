// ═══════════════════════════════════════════════════════
//  server.js  —  SIGNAL Backend Server (JSON Storage)
//  Express + JSON File Storage (temporary)
// ═══════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'feedbacks.json');

// ── MIDDLEWARE ──────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── JSON STORAGE FUNCTIONS ───────────────────────────
async function readFeedbacks() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

async function writeFeedbacks(feedbacks) {
  await fs.writeFile(DATA_FILE, JSON.stringify(feedbacks, null, 2));
}

// ── ROUTES ──────────────────────────────────────────────────────

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── POST FEEDBACK ──
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, rating, message, category } = req.body;

    // Validation
    if (!name || !email || !rating || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const feedbacks = await readFeedbacks();
    const feedback = {
      _id: Date.now().toString(), // Simple ID generation
      name,
      email,
      rating,
      message,
      category: category || 'General',
      createdAt: new Date(),
      status: 'new'
    };

    feedbacks.push(feedback);
    await writeFeedbacks(feedbacks);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });
  } catch (error) {
    console.error('Error posting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── GET ALL FEEDBACKS ──
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await readFeedbacks();
    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── GET DASHBOARD STATS ──
app.get('/api/stats', async (req, res) => {
  try {
    const feedbacks = await readFeedbacks();
    const total = feedbacks.length;
    const avg = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

    // Count feedbacks from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = feedbacks.filter(f => new Date(f.createdAt) >= today).length;

    // Category breakdown
    const catMap = {};
    feedbacks.forEach(f => {
      const cat = f.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const catResult = Object.keys(catMap).map(cat => ({ _id: cat, count: catMap[cat] }));

    // Rating distribution
    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => {
      ratingMap[f.rating]++;
    });
    const ratingResult = Object.keys(ratingMap).map(r => ({ rating: parseInt(r), count: ratingMap[r] }));

    res.status(200).json({
      success: true,
      data: {
        total,
        avg,
        todayCount,
        catResult,
        ratingResult
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── DELETE FEEDBACK ──
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const feedbacks = await readFeedbacks();
    const filteredFeedbacks = feedbacks.filter(f => f._id !== req.params.id);

    if (filteredFeedbacks.length === feedbacks.length) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await writeFeedbacks(filteredFeedbacks);

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── START SERVER ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`───────────────────────────────────────`);
  console.log(`✓ SIGNAL Server running on port ${PORT}`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Storage: JSON file (${DATA_FILE})`);
  console.log(`───────────────────────────────────────`);
});

console.log('🚀 Server starting with JSON storage (temporary solution)');
console.log('💡 To switch back to MongoDB Atlas, fix the connection and update server.js');
