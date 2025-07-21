const express = require('express');
const router = express.Router();
const {
  createQueue,
  joinQueue,
  getQueueUsers,            // ✅ add this
  updateQueueUserStatus,
  exportQueueCSV    // ✅ and this if not already
} = require('../controllers/queueController');


router.post('/create', createQueue);
router.post('/:id/join', joinQueue);

router.get('/:id', getQueueUsers); // GET queue by ID + users
router.patch('/:queueId/user/:userId', updateQueueUserStatus); // PATCH user status

router.get('/:id/export', exportQueueCSV);

module.exports = router;
