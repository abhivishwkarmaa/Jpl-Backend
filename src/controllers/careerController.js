const { prisma } = require('../lib/prisma');

// Public: Get active jobs
async function getPublicJobs(req, res) {
  try {
    const jobs = await prisma.jobOpening.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, jobs });
  } catch (error) {
    console.error('Failed to fetch public jobs:', error);
    return res.status(500).json({ success: false, error: error.message, jobs: [] });
  }
}

// Public: Apply for a job / internship
async function applyJob(req, res) {
  try {
    const {
      name,
      candidateName,
      email,
      phone,
      position,
      appType,
      resume,
      resumeUrl,
      portfolio,
      portfolioUrl,
      message,
      coverLetter,
      jobId,
    } = req.body;

    const applicantName = (candidateName || name || '').trim();
    const applicantEmail = (email || '').trim().toLowerCase();
    const applicantPhone = (phone || '').trim();

    if (!applicantName || !applicantEmail) {
      return res.status(400).json({ error: 'Candidate name and email are required.' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        candidateName: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        position: position || 'General Candidate',
        appType: appType || 'Job Application',
        resumeUrl: resumeUrl || resume || '',
        portfolioUrl: portfolioUrl || portfolio || '',
        coverLetter: coverLetter || message || '',
        status: 'new',
        ...(jobId ? { job: { connect: { id: jobId } } } : {}),
      },
    });

    return res.status(201).json({ success: true, application });
  } catch (error) {
    console.error('Failed to submit job application:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit job application' });
  }
}

// Admin: Get all jobs
async function getAdminJobs(req, res) {
  try {
    const jobs = await prisma.jobOpening.findMany({
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedJobs = jobs.map((job) => ({
      ...job,
      applicationsCount: job._count?.applications ?? 0,
    }));

    return res.json({ success: true, jobs: formattedJobs });
  } catch (error) {
    console.error('Failed to fetch admin jobs:', error);
    return res.status(500).json({ success: false, error: error.message, jobs: [] });
  }
}

// Admin: Create job opening
async function createAdminJob(req, res) {
  try {
    const {
      title,
      department,
      location,
      type,
      experienceRequired,
      description,
      requirements,
      isActive,
    } = req.body;

    if (!title || !department || !location) {
      return res.status(400).json({ error: 'Title, department, and location are required' });
    }

    const job = await prisma.jobOpening.create({
      data: {
        title: title.trim(),
        department: department.trim(),
        location: location.trim(),
        type: type || 'Full-Time',
        experienceRequired: experienceRequired || '1-3 Years',
        description: description || '',
        requirements: requirements || '',
        isActive: isActive ?? true,
      },
    });

    return res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('Failed to create job opening:', error);
    return res.status(500).json({ error: error.message || 'Failed to create job opening' });
  }
}

// Admin: Update job opening
async function updateAdminJob(req, res) {
  try {
    const { id, ...data } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const updated = await prisma.jobOpening.update({
      where: { id: String(id) },
      data,
    });

    return res.json({ success: true, job: updated });
  } catch (error) {
    console.error('Failed to update job opening:', error);
    return res.status(500).json({ error: error.message || 'Failed to update job opening' });
  }
}

// Admin: Delete job opening
async function deleteAdminJob(req, res) {
  try {
    const id = req.query.id || req.body.id;

    if (!id) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    await prisma.jobOpening.delete({
      where: { id: String(id) },
    });

    return res.json({ success: true, message: 'Job opening deleted successfully' });
  } catch (error) {
    console.error('Failed to delete job opening:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete job opening' });
  }
}

// Admin: Get all applications
async function getAdminApplications(req, res) {
  try {
    const applications = await prisma.jobApplication.findMany({
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return res.json({ success: true, applications });
  } catch (error) {
    console.error('Failed to fetch job applications:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch applications' });
  }
}

// Admin: Update application status
async function updateAdminApplication(req, res) {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Application ID and status are required' });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: String(id) },
      data: { status },
    });

    return res.json({ success: true, application: updated });
  } catch (error) {
    console.error('Failed to update application status:', error);
    return res.status(500).json({ error: error.message || 'Failed to update application' });
  }
}

// Admin: Delete application
async function deleteAdminApplication(req, res) {
  try {
    const id = req.query.id || req.body.id;

    if (!id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    await prisma.jobApplication.delete({
      where: { id: String(id) },
    });

    return res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Failed to delete application:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete application' });
  }
}

module.exports = {
  getPublicJobs,
  applyJob,
  getAdminJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  getAdminApplications,
  updateAdminApplication,
  deleteAdminApplication,
};
