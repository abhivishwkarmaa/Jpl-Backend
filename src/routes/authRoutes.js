const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/authController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAdminAuth, getMe);

module.exports = router;
