const express = require('express');
const router = express.Router();
const { getPublicBlogs } = require('../controllers/blogController');

router.get('/', getPublicBlogs);

module.exports = router;
