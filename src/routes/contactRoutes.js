const express = require('express');
const router = express.Router();
const { createInquiry } = require('../controllers/contactController');

router.post('/', createInquiry);

module.exports = router;
