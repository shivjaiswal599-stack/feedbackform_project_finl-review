require('dotenv').config();
const { Pool } = require('pg');

// NeonDB Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Admin password for dashboard API protection
const ADMIN_API_KEY = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware to protect dashboard APIs
function requireAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_API_KEY}`) {
    return false;
  }
  return true;
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

// Run init on cold start
initDB();

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '/api');
  const segments = path.split('/').filter(Boolean);

  try {
    // POST /api/feedback
    if (event.httpMethod === 'POST' && segments[1] === 'feedback' && !segments[2]) {
      const body = JSON.parse(event.body || '{}');
      const { name, email, rating, message, category } = body;

      if (!name || !email || !rating || !message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'All fields are required' })
        };
      }

      if (rating < 1 || rating > 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Rating must be between 1 and 5' })
        };
      }

      const result = await pool.query(
        'INSERT INTO feedbacks (name, email, rating, message, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email, parseInt(rating), message, category || 'General']
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Feedback submitted successfully',
          data: result.rows[0]
        })
      };
    }

    // GET /api/feedback
    if (event.httpMethod === 'GET' && segments[1] === 'feedback' && !segments[2]) {
      const result = await pool.query(
        'SELECT * FROM feedbacks ORDER BY created_at DESC'
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          count: result.rows.length,
          data: result.rows
        })
      };
    }

    // GET /api/stats
    if (event.httpMethod === 'GET' && segments[1] === 'stats') {
      const [totalResult, todayResult, categoryResult, ratingResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as total, AVG(rating) as avg FROM feedbacks'),
        pool.query("SELECT COUNT(*) as count FROM feedbacks WHERE DATE(created_at) = CURRENT_DATE"),
        pool.query('SELECT category, COUNT(*) as count FROM feedbacks GROUP BY category'),
        pool.query('SELECT rating, COUNT(*) as count FROM feedbacks GROUP BY rating ORDER BY rating')
      ]);

      const total = parseInt(totalResult.rows[0].total) || 0;
      const avg = totalResult.rows[0].avg ? parseFloat(totalResult.rows[0].avg).toFixed(1) : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            total,
            avg,
            todayCount: parseInt(todayResult.rows[0].count) || 0,
            catResult: categoryResult.rows,
            ratingResult: ratingResult.rows
          }
        })
      };
    }

    // DELETE /api/feedback/:id
    if (event.httpMethod === 'DELETE' && segments[1] === 'feedback' && segments[2]) {
      if (!requireAuth(event)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized - Admin access required' })
        };
      }

      const id = segments[2];
      const result = await pool.query(
        'DELETE FROM feedbacks WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Feedback not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Feedback deleted successfully'
        })
      };
    }

    // GET /api/health
    if (event.httpMethod === 'GET' && segments[1] === 'health') {
      await pool.query('SELECT 1');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'API endpoint not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
