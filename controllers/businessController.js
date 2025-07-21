const pool = require('../db');

// ✅ Full Registration (Name + Email)
const registerBusiness = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  try {
    const check = await pool.query(
      'SELECT * FROM businesses WHERE email = $1',
      [email.toLowerCase()]
    );

    if (check.rows.length > 0) {
      return res.json({
        message: 'Already registered',
        business: check.rows[0],
      });
    }

    const result = await pool.query(
      'INSERT INTO businesses (name, email) VALUES ($1, $2) RETURNING *',
      [name.trim(), email.toLowerCase()]
    );

    res.status(201).json({
      message: '✅ Business registered',
      business: result.rows[0],
    });
  } catch (err) {
    console.error('❌ registerBusiness error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Email-only verify-or-create (for quick queue creation)
const verifyOrCreateBusiness = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

  try {
    const check = await pool.query(
      'SELECT * FROM businesses WHERE email = $1',
      [email.trim()]
    );

    if (check.rows.length > 0) {
      return res.json({
        message: '✅ Business already exists',
        business: check.rows[0],
      });
    }

    const insert = await pool.query(
      'INSERT INTO businesses (name, email) VALUES ($1, $2) RETURNING *',
      [name.trim(), email.trim()]
    );

    res.status(201).json({
      message: '✅ Business registered',
      business: insert.rows[0],
    });
  } catch (err) {
    console.error('❌ verifyOrCreateBusiness error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerBusiness,
  verifyOrCreateBusiness,
};
