const { prisma } = require('../lib/prisma');

async function getStats(req, res) {
  try {
    const [blogsCount, jobsCount, applicantsCount, inquiriesCount] = await Promise.all([
      prisma.blog.count(),
      prisma.jobOpening.count(),
      prisma.jobApplication.count(),
      prisma.contactInquiry.count(),
    ]);

    const [recentInquiries, recentApplications] = await Promise.all([
      prisma.contactInquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobApplication.findMany({
        take: 5,
        include: { job: { select: { title: true } } },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      stats: {
        blogsCount,
        jobsCount,
        applicantsCount,
        inquiriesCount,
      },
      recentInquiries,
      recentApplications,
    });
  } catch (error) {
    console.error('Failed to load admin stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch admin stats',
      stats: {
        blogsCount: 0,
        jobsCount: 0,
        applicantsCount: 0,
        inquiriesCount: 0,
      },
      recentInquiries: [],
      recentApplications: [],
    });
  }
}

module.exports = {
  getStats,
};
