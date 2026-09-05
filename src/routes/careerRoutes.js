const express = require('express');
const router = express.Router();
const { getPublicJobs, applyJob } = require('../controllers/careerController');

router.get('/jobs', getPublicJobs);
router.post('/apply', applyJob);

module.exports = router;
