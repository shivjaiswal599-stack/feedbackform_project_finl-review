require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// NeonDB Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware - CORS must be first and most permissive
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Admin password for dashboard API protection
const ADMIN_API_KEY = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware to protect dashboard APIs
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }
  next();
}

// Initialize Database
async function initDB() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        message TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'General',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    client.release();
    console.log('✅ NeonDB connected and table ready');
  } catch (error) {
    console.error('❌ NeonDB error:', error.message);
  }
}

// API Routes
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, rating, message, category } = req.body;
    
    console.log('Received feedback:', { name, email, rating, message, category });

    if (!name || !email || !rating || !message) {
      console.log('Missing fields:', { name: !!name, email: !!email, rating: !!rating, message: !!message });
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      console.log('Invalid rating:', rating);
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      'INSERT INTO feedbacks (name, email, rating, message, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, parseInt(rating), message, category || 'General']
    );
    
    console.log('Feedback saved:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error posting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM feedbacks ORDER BY created_at DESC'
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [totalResult, todayResult, categoryResult, ratingResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, AVG(rating) as avg FROM feedbacks'),
      pool.query("SELECT COUNT(*) as count FROM feedbacks WHERE DATE(created_at) = CURRENT_DATE"),
      pool.query('SELECT category, COUNT(*) as count FROM feedbacks GROUP BY category'),
      pool.query('SELECT rating, COUNT(*) as count FROM feedbacks GROUP BY rating ORDER BY rating')
    ]);

    const total = parseInt(totalResult.rows[0].total) || 0;
    const avg = totalResult.rows[0].avg ? parseFloat(totalResult.rows[0].avg).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        avg,
        todayCount: parseInt(todayResult.rows[0].count) || 0,
        catResult: categoryResult.rows,
        ratingResult: ratingResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/feedback/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM feedbacks WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Feedback deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Fallback route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('───────────────────────────────────────');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log('───────────────────────────────────────');
  initDB();
});

module.exports = app;
