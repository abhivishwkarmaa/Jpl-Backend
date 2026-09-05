require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MySQL database for JPL Portfolio...');

  // 1. Ensure default Company Settings
  const settings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      phonePrimary: '+91 98765 43210',
      phoneSecondary: '+91 98123 45678',
      emailSupport: 'info@jplitsolution.com',
      emailCareers: 'careers@jplitsolution.com',
      officeAddress: 'Madangir, New Delhi, India',
      googleMapsEmbedUrl: '',
      linkedinUrl: 'https://www.linkedin.com/company/jplitsolution',
      twitterUrl: 'https://twitter.com/jplitsolution',
      facebookUrl: 'https://facebook.com/jplitsolution',
      instagramUrl: 'https://instagram.com/jplitsolution',
    },
  });
  console.log('✔ Company settings verified');

  // 2. Ensure default Admin user
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@jplitsolution.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin_password_123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'JPL Super Administrator',
      passwordHash,
    },
  });
  console.log(`✔ Admin user verified: ${admin.email}`);

  // 3. Ensure default Job Openings
  const jobCount = await prisma.jobOpening.count();
  if (jobCount === 0) {
    const jobs = [
      {
        title: 'Senior Full-Stack Engineer',
        department: 'Engineering',
        location: 'Hybrid - Noida / New Delhi',
        type: 'Full-Time',
        experienceRequired: '3-5 Years',
        description:
          'Seeking a senior engineer experienced in building high-performance React and Node.js enterprise systems, scalable APIs, and modern database architectures.',
        requirements: 'React, Next.js, Node.js, TypeScript, MySQL, Prisma, Docker',
        isActive: true,
      },
      {
        title: 'Mobile Application Developer',
        department: 'Engineering',
        location: 'On-Site - Noida',
        type: 'Full-Time',
        experienceRequired: '2-4 Years',
        description:
          'Craft smooth mobile experiences for iOS and Android platforms using Flutter or React Native with native bridge integrations.',
        requirements: 'Flutter, React Native, Mobile UI/UX, REST APIs, State Management',
        isActive: true,
      },
      {
        title: 'AI / Machine Learning Engineer',
        department: 'Research & AI',
        location: 'Remote / Hybrid',
        type: 'Full-Time',
        experienceRequired: '2-5 Years',
        description:
          'Implement advanced recommendation algorithms, NLP workflows, computer vision scripts, and generative AI integrations.',
        requirements: 'Python, PyTorch, HuggingFace, FastAPI, LangChain, Vector Databases',
        isActive: true,
      },
      {
        title: 'Cloud Solutions Architect & DevOps',
        department: 'Infrastructure',
        location: 'Hybrid - Noida',
        type: 'Full-Time',
        experienceRequired: '4-7 Years',
        description:
          'Design resilient cloud architectures, automate CI/CD pipelines, manage Kubernetes clusters, and optimize serverless workflows on AWS/GCP.',
        requirements: 'AWS, Kubernetes, Terraform, Docker, CI/CD, Linux, Cloud Security',
        isActive: true,
      },
    ];

    for (const job of jobs) {
      await prisma.jobOpening.create({ data: job });
    }
    console.log(`✔ Seeded ${jobs.length} initial job openings`);
  } else {
    console.log(`✔ Job openings already present (${jobCount} found)`);
  }

  // 4. Ensure initial Contact Inquiries if empty
  const inqCount = await prisma.contactInquiry.count();
  if (inqCount === 0) {
    const inquiries = [
      {
        name: 'Vikram Mehta',
        email: 'vikram@enterprisecorp.com',
        phone: '+91 98234 56789',
        serviceOfInterest: 'Cloud Architecture & DevOps',
        message:
          'We are looking for a complete cloud migration and Kubernetes infrastructure setup for our fintech application. Please arrange a call.',
        status: 'new',
      },
      {
        name: 'Ananya Gupta',
        email: 'ananya@techstartup.io',
        phone: '+91 97111 22334',
        serviceOfInterest: 'Custom Software Development',
        message:
          'Need a dedicated React Native mobile app & Web admin portal developer team for 6 months.',
        status: 'in_progress',
      },
      {
        name: 'Suresh Kumar',
        email: 'suresh@logisticsindia.com',
        phone: '+91 99887 76655',
        serviceOfInterest: 'AI & Data Analytics',
        message:
          'Interested in AI-driven route optimization for our supply chain logistics fleet.',
        status: 'contacted',
      },
    ];

    for (const inq of inquiries) {
      await prisma.contactInquiry.create({ data: inq });
    }
    console.log(`✔ Seeded ${inquiries.length} initial contact inquiries`);
  } else {
    console.log(`✔ Contact inquiries already present (${inqCount} found)`);
  }

  // 5. Ensure initial Job Applications if empty
  const appCount = await prisma.jobApplication.count();
  if (appCount === 0) {
    const firstJob = await prisma.jobOpening.findFirst();
    await prisma.jobApplication.create({
      data: {
        candidateName: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98123 45678',
        position: 'Senior Cloud Solutions Architect',
        appType: 'Job Application',
        resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        coverLetter: 'Experienced cloud architect eager to lead high-scale cloud modernization projects.',
        status: 'new',
        jobId: firstJob ? firstJob.id : undefined,
      },
    });
    console.log('✔ Seeded initial sample candidate application');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
