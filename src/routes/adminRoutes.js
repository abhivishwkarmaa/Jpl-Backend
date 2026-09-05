const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');

const {
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');

const {
  getAdminJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  getAdminApplications,
  updateAdminApplication,
  deleteAdminApplication,
} = require('../controllers/careerController');

const {
  getAdminInquiries,
  updateAdminInquiry,
  deleteAdminInquiry,
} = require('../controllers/contactController');

const {
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');

const { getStats } = require('../controllers/statsController');
const { getNotifications, markAllRead } = require('../controllers/notificationController');
const { handleUpload } = require('../controllers/uploadController');

// Protect all admin endpoints below
router.use(requireAdminAuth);

// Admin Blogs
router.get('/blogs', getAdminBlogs);
router.post('/blogs', createBlog);
router.patch('/blogs', updateBlog);
router.put('/blogs', updateBlog);
router.delete('/blogs', deleteBlog);

// Admin Jobs
router.get('/jobs', getAdminJobs);
router.post('/jobs', createAdminJob);
router.patch('/jobs', updateAdminJob);
router.put('/jobs', updateAdminJob);
router.delete('/jobs', deleteAdminJob);

// Admin Job Applications
router.get('/jobs/applications', getAdminApplications);
router.patch('/jobs/applications', updateAdminApplication);
router.put('/jobs/applications', updateAdminApplication);
router.delete('/jobs/applications', deleteAdminApplication);

// Admin Inquiries
router.get('/inquiries', getAdminInquiries);
router.patch('/inquiries', updateAdminInquiry);
router.put('/inquiries', updateAdminInquiry);
router.delete('/inquiries', deleteAdminInquiry);

// Admin Settings
router.get('/settings/contact', getSettings);
router.post('/settings/contact', updateSettings);
router.put('/settings/contact', updateSettings);

// Admin Stats & Notifications
router.get('/stats', getStats);
router.get('/notifications', getNotifications);
router.post('/notifications', markAllRead);

// Admin File Upload
router.post('/upload', handleUpload);

module.exports = router;
