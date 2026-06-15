require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

/**
 * Inserts a couple of demo accounts and sample events.
 * Run AFTER creating the schema:   npm run seed
 */
async function seed() {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    const admin = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Admin User', 'admin@campus.edu', adminHash]
    );

    const student = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Sara Student', 'sara@campus.edu', studentHash]
    );

    const adminId = admin.rows[0].id;
    const studentId = student.rows[0].id;

    const events = [
      ['Freshman Orientation', 'Welcome session for all new students, including a campus tour and Q&A.', 'Main Auditorium', '2026-09-01 09:00', 200, adminId],
      ['Hackathon 2026', '24-hour coding competition. Teams of up to 4. Prizes for the top three projects.', 'Engineering Lab B', '2026-09-15 18:00', 60, studentId],
      ['Career Fair', 'Meet recruiters from 30+ companies. Bring printed copies of your CV.', 'Sports Hall', '2026-10-05 10:00', null, adminId],
    ];

    for (const e of events) {
      await pool.query(
        `INSERT INTO events (title, description, location, event_date, capacity, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        e
      );
    }

    console.log('\n✅ Seed complete.');
    console.log('   Admin   →  admin@campus.edu / admin123');
    console.log('   Student →  sara@campus.edu / student123\n');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
