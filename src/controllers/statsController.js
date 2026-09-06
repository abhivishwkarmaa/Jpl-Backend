const { prisma } = require('../lib/prisma');

async function getStats(req, res) {
  try {
    let blogsCount = 0, jobsCount = 0, applicantsCount = 0, inquiriesCount = 0;

    // Run counts in a single fast SQL query to avoid 4 remote roundtrips
    try {
      const counts = await prisma.$queryRawUnsafe(
        'SELECT (SELECT COUNT(*) FROM `Blog`) as blogsCount, (SELECT COUNT(*) FROM `JobOpening`) as jobsCount, (SELECT COUNT(*) FROM `JobApplication`) as applicantsCount, (SELECT COUNT(*) FROM `ContactInquiry`) as inquiriesCount'
      );
      if (counts && counts[0]) {
        blogsCount = Number(counts[0].blogsCount || 0);
        jobsCount = Number(counts[0].jobsCount || 0);
        applicantsCount = Number(counts[0].applicantsCount || 0);
        inquiriesCount = Number(counts[0].inquiriesCount || 0);
      }
    } catch (countErr) {
      // Fallback
      [blogsCount, jobsCount, applicantsCount, inquiriesCount] = await Promise.all([
        prisma.blog.count(),
        prisma.jobOpening.count(),
        prisma.jobApplication.count(),
        prisma.contactInquiry.count(),
      ]);
    }

    const [recentInquiries, recentApplications] = await Promise.all([
      prisma.contactInquiry.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          serviceOfInterest: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobApplication.findMany({
        take: 5,
        select: {
          id: true,
          candidateName: true,
          email: true,
          phone: true,
          position: true,
          status: true,
          submittedAt: true,
          job: { select: { title: true } },
        },
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
