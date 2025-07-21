const pool = require('../db');
const { Parser } = require('json2csv');
const { v4: isUUID } = require('uuid');

// ✅ Create Queue
const createQueue = async (req, res) => {
  const { title, business_id } = req.body;

  if (!title || !business_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const business = await pool.query(
      'SELECT id FROM businesses WHERE id = $1',
      [business_id]
    );

    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const result = await pool.query(
      'INSERT INTO queues (title, business_id) VALUES ($1, $2) RETURNING *',
      [title.trim(), business_id]
    );

    res.status(201).json({
      message: '✅ Queue created',
      queue: result.rows[0],
    });
  } catch (err) {
    console.error('❌ createQueue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Join Queue
const joinQueue = async (req, res) => {
  const queue_id = req.params.id;
  const { name, notify_email } = req.body;

  console.log('🛬 joinQueue:', { queue_id, name });

  if (!queue_id || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const queue = await pool.query(
      'SELECT * FROM queues WHERE id = $1 AND status = $2',
      [queue_id, 'active']
    );

    if (queue.rows.length === 0) {
      console.warn('⚠️ Queue not found or inactive:', queue_id);
      return res.status(404).json({ error: 'Queue not found or inactive' });
    }

    const existingUser = await pool.query(
      'SELECT * FROM queue_users WHERE name = $1 AND queue_id = $2',
      [name.trim(), queue_id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already in queue' });
    }

    const insertResult = await pool.query(
      'INSERT INTO queue_users (name, queue_id, notify_email) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), queue_id, notify_email || null]
    );

    const newUser = insertResult.rows[0];

    const io = req.app.get('io');
    if (io) {
      io.to(queue_id).emit('queueUpdated', {
        event: 'user_joined',
        queue_id,
        user: {
          id: newUser.id,
          name: newUser.name,
          status: newUser.status,
          joined_at: newUser.joined_at,
        },
      });
    }

    res.status(201).json({
      message: '✅ You have joined the queue',
      user: {
        id: newUser.id,
        name: newUser.name,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error('❌ joinQueue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Get All Users in Queue
const getQueueUsers = async (req, res) => {
  const queue_id = req.params.id;

  try {
    const queue = await pool.query('SELECT * FROM queues WHERE id = $1', [queue_id]);

    if (queue.rows.length === 0) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const users = await pool.query(
      'SELECT id, name, status, joined_at FROM queue_users WHERE queue_id = $1 ORDER BY joined_at ASC',
      [queue_id]
    );

    res.json({
      queue: {
        id: queue.rows[0].id,
        title: queue.rows[0].title,
        status: queue.rows[0].status,
      },
      users: users.rows,
    });
  } catch (err) {
    console.error('❌ getQueueUsers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Update User Status
const updateQueueUserStatus = async (req, res) => {
  const { queueId, userId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['waiting', 'served', 'skipped'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const update = await pool.query(
      'UPDATE queue_users SET status = $1 WHERE id = $2 AND queue_id = $3 RETURNING *',
      [status, userId, queueId]
    );

    if (update.rows.length === 0) {
      return res.status(404).json({ error: 'User not found in this queue' });
    }

    res.json({ message: `✅ User status updated to ${status}`, user: update.rows[0] });
  } catch (err) {
    console.error('❌ updateQueueUserStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Export CSV
const exportQueueCSV = async (req, res) => {
  const queue_id = req.params.id;

  try {
    const queueCheck = await pool.query('SELECT * FROM queues WHERE id = $1', [queue_id]);

    if (queueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const users = await pool.query(
      'SELECT name, status, joined_at FROM queue_users WHERE queue_id = $1 ORDER BY joined_at ASC',
      [queue_id]
    );

    const fields = ['name', 'status', 'joined_at'];
    const parser = new Parser({ fields });
    const csv = parser.parse(users.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`queuely-queue-report-${queue_id}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('❌ exportQueueCSV error:', err);
    res.status(500).json({ error: 'Could not export CSV' });
  }
};

module.exports = {
  createQueue,
  joinQueue,
  getQueueUsers,
  updateQueueUserStatus,
  exportQueueCSV,
};
