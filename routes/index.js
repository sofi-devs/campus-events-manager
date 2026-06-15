const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /  — list all events, newest date first, with live attendee counts
router.get('/', async (req, res, next) => {
  try {
    const search = req.query.search || '';

    const result = await pool.query(
      `SELECT e.*,
              u.name AS organizer,
              COUNT(r.id)::int AS attendee_count
       FROM events e
       JOIN users u ON e.created_by = u.id
       LEFT JOIN rsvps r ON r.event_id = e.id
       WHERE ($1 = ''
              OR e.title ILIKE '%' || $1 || '%'
              OR e.location ILIKE '%' || $1 || '%')
       GROUP BY e.id, u.name
       ORDER BY e.event_date ASC`,
      [search]
    );

    res.render('index', {
      title: 'Upcoming Events',
      events: result.rows,
      search,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
