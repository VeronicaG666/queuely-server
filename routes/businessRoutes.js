const express = require('express');
const router = express.Router();
const {
  registerBusiness,
  verifyOrCreateBusiness,
} = require('../controllers/businessController');

router.post('/register', registerBusiness);
router.post('/verify', verifyOrCreateBusiness);

module.exports = router;
