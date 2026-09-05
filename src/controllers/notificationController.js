const { prisma } = require('../lib/prisma');

async function getNotifications(req, res) {
  try {
    const [newInquiriesCount, newApplicationsCount] = await Promise.all([
      prisma.contactInquiry.count({ where: { status: 'new' } }),
      prisma.jobApplication.count({ where: { status: 'new' } }),
    ]);

    const [recentInquiries, recentApplications] = await Promise.all([
      prisma.contactInquiry.findMany({
        where: { status: 'new' },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobApplication.findMany({
        where: { status: 'new' },
        take: 6,
        include: { job: { select: { title: true } } },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    const notifications = [
      ...recentInquiries.map((inq) => ({
        id: `inq-${inq.id}`,
        rawId: inq.id,
        type: 'inquiry',
        title: inq.name || 'New Client Lead',
        subtitle: inq.serviceOfInterest || 'General Inquiry',
        time: inq.createdAt,
        link: '/admin/inquiries',
        email: inq.email,
      })),
      ...recentApplications.map((app) => ({
        id: `app-${app.id}`,
        rawId: app.id,
        type: 'application',
        title: app.candidateName || 'New Job Applicant',
        subtitle: app.position || app.job?.title || 'Job Application',
        time: app.submittedAt,
        link: '/admin/jobs/applications',
        email: app.email,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const totalUnread = newInquiriesCount + newApplicationsCount;

    return res.json({
      success: true,
      totalUnread,
      newInquiriesCount,
      newApplicationsCount,
      notifications,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({
      success: false,
      totalUnread: 0,
      newInquiriesCount: 0,
      newApplicationsCount: 0,
      notifications: [],
      error: error.message,
    });
  }
}

async function markAllRead(req, res) {
  try {
    const { action } = req.body;

    if (action === 'mark_all_read') {
      await Promise.all([
        prisma.contactInquiry.updateMany({
          where: { status: 'new' },
          data: { status: 'in_progress' },
        }),
        prisma.jobApplication.updateMany({
          where: { status: 'new' },
          data: { status: 'reviewed' },
        }),
      ]);

      return res.json({ success: true, message: 'All marked as reviewed' });
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getNotifications,
  markAllRead,
};
