// ═══════════════════════════════════════════════════════
//  server-mysql.js  —  HearMe Backend Server (MySQL)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = process.env.MYSQL_PORT || 3306;
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'feedback_db';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
    console.log('✅ MySQL database created');
  } finally {
    conn.release();
  }
  
  // Recreate pool with database
  pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
  });
  
  const conn2 = await pool.getConnection();
  try {
    await conn2.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        message TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        createdAt DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'new'
      ) ENGINE=InnoDB CHARSET=utf8mb4;
    `);
    console.log('✅ MySQL feedbacks table ready');
  } finally {
    conn2.release();
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, rating, message, category } = req.body;

    if (!name || !email || !rating || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const createdAt = new Date();
    const status = 'new';

    const [result] = await pool.execute(
      'INSERT INTO feedbacks (name, email, rating, message, category, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, parseInt(rating, 10), message, category || 'General', createdAt, status]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: result.insertId
    });
  } catch (error) {
    console.error('Error posting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, rating, message, category, createdAt, status FROM feedbacks ORDER BY createdAt DESC'
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [[totalRow]] = await pool.execute('SELECT COUNT(*) AS total, AVG(rating) AS avg FROM feedbacks');
    const [[todayRow]] = await pool.execute(
      'SELECT COUNT(*) AS todayCount FROM feedbacks WHERE DATE(createdAt) = CURDATE()'
    );
    const [catRows] = await pool.execute(
      'SELECT category AS _id, COUNT(*) AS count FROM feedbacks GROUP BY category'
    );
    const [ratingRows] = await pool.execute(
      'SELECT rating, COUNT(*) AS count FROM feedbacks GROUP BY rating ORDER BY rating'
    );

    res.status(200).json({
      success: true,
      data: {
        total: Number(totalRow.total || 0),
        avg: totalRow.avg ? Number(parseFloat(totalRow.avg).toFixed(1)) : 0,
        todayCount: Number(todayRow.todayCount || 0),
        catResult: catRows,
        ratingResult: ratingRows
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (Number.isNaN(feedbackId)) {
      return res.status(400).json({ error: 'Invalid feedback ID' });
    }

    const [result] = await pool.execute('DELETE FROM feedbacks WHERE id = ?', [feedbackId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  await initializeDatabase();

  const server = app.listen(PORT, () => {
    console.log('───────────────────────────────────────');
    console.log(`✓ SIGNAL Server running on port ${PORT}`);
    console.log(`  Local: http://localhost:${PORT}`);
    console.log('───────────────────────────────────────');
  });

  process.on('SIGINT', async () => {
    console.log('\n✔ Shutting down...');
    try {
      await pool.end();
      console.log('✔ MySQL connection pool closed');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
    server.close(() => process.exit(0));
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});