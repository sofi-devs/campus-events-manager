const express = require('express');
const pool = require('../db/pool');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

/* Helper: load an event or send 404. Returns the row or null. */
async function findEvent(id, res) {
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  if (!result.rows.length) {
    res.status(404).render('error', { title: 'Not Found', message: 'Event not found.' });
    return null;
  }
  return result.rows[0];
}

/* Helper: is this user allowed to edit/delete the event? */
function canManage(user, event) {
  return user && (user.id === event.created_by || user.role === 'admin');
}

/* ----------  Create ---------- */
// NOTE: '/new' must be declared before '/:id' so it isn't read as an id.
router.get('/new', requireLogin, (req, res) => {
  res.render('events/new', { title: 'Create Event', formData: {}, errors: [] });
});

router.post('/', requireLogin, async (req, res, next) => {
  const { title, description, location, event_date, capacity } = req.body;
  const errors = [];
  if (!title || !event_date) errors.push('Title and date are required.');

  if (errors.length) {
    return res
      .status(400)
      .render('events/new', { title: 'Create Event', formData: req.body, errors });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, location, event_date, capacity, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [title, description || null, location || null, event_date, capacity || null, req.session.user.id]
    );
    req.session.flash = { type: 'success', message: 'Event created.' };
    res.redirect(`/events/${result.rows[0].id}`);
  } catch (err) {
    next(err);
  }
});

/* ----------  Read (single event) ---------- */
router.get('/:id', async (req, res, next) => {
  try {
    const eventRes = await pool.query(
      `SELECT e.*, u.name AS organizer
       FROM events e JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    const event = eventRes.rows[0];
    if (!event) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Event not found.' });
    }

    const attendeesRes = await pool.query(
      `SELECT u.id, u.name
       FROM rsvps r JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.created_at`,
      [req.params.id]
    );
    const attendees = attendeesRes.rows;

    const userHasRsvp =
      req.session.user && attendees.some((a) => a.id === req.session.user.id);

    res.render('events/show', {
      title: event.title,
      event,
      attendees,
      attendeeCount: attendees.length,
      userHasRsvp: !!userHasRsvp,
    });
  } catch (err) {
    next(err);
  }
});

/* ----------  Update ---------- */
router.get('/:id/edit', requireLogin, async (req, res, next) => {
  try {
    const event = await findEvent(req.params.id, res);
    if (!event) return;
    if (!canManage(req.session.user, event)) {
      req.session.flash = { type: 'error', message: 'You can only edit your own events.' };
      return res.redirect(`/events/${event.id}`);
    }
    res.render('events/edit', { title: 'Edit Event', event, errors: [] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireLogin, async (req, res, next) => {
  try {
    const event = await findEvent(req.params.id, res);
    if (!event) return;
    if (!canManage(req.session.user, event)) {
      req.session.flash = { type: 'error', message: 'You can only edit your own events.' };
      return res.redirect(`/events/${event.id}`);
    }

    const { title, description, location, event_date, capacity } = req.body;
    await pool.query(
      `UPDATE events
       SET title = $1, description = $2, location = $3, event_date = $4, capacity = $5
       WHERE id = $6`,
      [title, description || null, location || null, event_date, capacity || null, req.params.id]
    );
    req.session.flash = { type: 'success', message: 'Event updated.' };
    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

/* ----------  Delete ---------- */
router.delete('/:id', requireLogin, async (req, res, next) => {
  try {
    const event = await findEvent(req.params.id, res);
    if (!event) return;
    if (!canManage(req.session.user, event)) {
      req.session.flash = { type: 'error', message: 'You can only delete your own events.' };
      return res.redirect(`/events/${event.id}`);
    }
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Event deleted.' };
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

/* ----------  RSVP ---------- */
router.post('/:id/rsvp', requireLogin, async (req, res, next) => {
  try {
    const event = await findEvent(req.params.id, res);
    if (!event) return;

    // Enforce capacity if one is set.
    if (event.capacity) {
      const countRes = await pool.query(
        'SELECT COUNT(*)::int AS c FROM rsvps WHERE event_id = $1',
        [req.params.id]
      );
      const already = await pool.query(
        'SELECT id FROM rsvps WHERE event_id = $1 AND user_id = $2',
        [req.params.id, req.session.user.id]
      );
      if (!already.rows.length && countRes.rows[0].c >= event.capacity) {
        req.session.flash = { type: 'error', message: 'Sorry, this event is full.' };
        return res.redirect(`/events/${req.params.id}`);
      }
    }

    await pool.query(
      `INSERT INTO rsvps (event_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [req.params.id, req.session.user.id]
    );
    req.session.flash = { type: 'success', message: "You're going! 🎉" };
    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/rsvp/cancel', requireLogin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM rsvps WHERE event_id = $1 AND user_id = $2', [
      req.params.id,
      req.session.user.id,
    ]);
    req.session.flash = { type: 'success', message: 'Your RSVP was cancelled.' };
    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
