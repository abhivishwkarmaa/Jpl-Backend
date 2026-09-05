require('dotenv').config();
const http = require('http');
const app = require('../server');
const { prisma } = require('../src/lib/prisma');

// Test runner configuration
const TEST_PORT = 5055;
let server;
let adminToken = '';
let testInquiryId = null;
let testApplicationId = null;
let testBlogId = null;

let passed = 0;
let failed = 0;

function printHeader(title) {
  console.log(`\n==================================================`);
  console.log(`🔍 ${title}`);
  console.log(`==================================================`);
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// Helper to make HTTP request to the test server
function request(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:${TEST_PORT}${path}`);
    const headers = { ...(options.headers || {}) };

    let bodyData = null;
    if (options.body) {
      bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    if (adminToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(responseBody);
          } catch (e) {
            parsed = responseBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runAllTests() {
  printHeader('STARTING COMPREHENSIVE BACKEND API TEST SUITE');
  console.log(`Starting test server on port ${TEST_PORT}...`);

  await new Promise((res) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running at http://localhost:${TEST_PORT}`);
      res();
    });
  });

  try {
    // ----------------------------------------------------
    // 1. Health & Public Endpoints
    // ----------------------------------------------------
    printHeader('1. Testing Public & Utility Endpoints');

    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'ok', 'GET /api/health returns status 200 and ok');

    const settingsRes = await request('GET', '/api/settings/contact');
    assert(settingsRes.status === 200 && settingsRes.body.success === true, 'GET /api/settings/contact returns company settings');

    const blogsRes = await request('GET', '/api/blogs');
    assert(blogsRes.status === 200 && Array.isArray(blogsRes.body.blogs), `GET /api/blogs returns array (Found ${blogsRes.body.blogs?.length || 0} blogs)`);

    const jobsRes = await request('GET', '/api/careers/jobs');
    assert(jobsRes.status === 200 && Array.isArray(jobsRes.body.jobs), `GET /api/careers/jobs returns array (Found ${jobsRes.body.jobs?.length || 0} active jobs)`);

    // ----------------------------------------------------
    // 2. Public Form Submissions
    // ----------------------------------------------------
    printHeader('2. Testing Public Submission Endpoints');

    const contactPayload = {
      name: 'API Automation Tester',
      email: 'test.automation@jplitsolution.com',
      phone: '+91 99999 88888',
      serviceOfInterest: 'Automated Testing',
      message: 'This is an automated testing inquiry to verify backend endpoints.',
    };
    const contactRes = await request('POST', '/api/contact', { body: contactPayload });
    assert(contactRes.status === 201 && contactRes.body.success === true, 'POST /api/contact successfully created contact inquiry');
    if (contactRes.body?.inquiry?.id) {
      testInquiryId = contactRes.body.inquiry.id;
    }

    const applyPayload = {
      candidateName: 'Test Candidate',
      email: 'candidate.test@jplitsolution.com',
      phone: '+91 91111 22222',
      position: 'Quality Assurance Tester',
      resumeUrl: 'https://example.com/test-resume.pdf',
      coverLetter: 'Automated job application test',
    };
    const applyRes = await request('POST', '/api/careers/apply', { body: applyPayload });
    assert(applyRes.status === 201 && applyRes.body.success === true, 'POST /api/careers/apply successfully submitted job application');
    if (applyRes.body?.application?.id) {
      testApplicationId = applyRes.body.application.id;
    }

    // ----------------------------------------------------
    // 3. Admin Authentication
    // ----------------------------------------------------
    printHeader('3. Testing Admin Authentication');

    // Negative test: invalid credentials
    const badLoginRes = await request('POST', '/api/admin/auth/login', {
      body: { email: 'wrong@jplitsolution.com', password: 'badpassword' },
    });
    assert(badLoginRes.status === 401, 'POST /api/admin/auth/login correctly rejects invalid credentials (401)');

    // Positive test: valid credentials
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@jplitsolution.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin_password_123';
    const loginRes = await request('POST', '/api/admin/auth/login', {
      body: { email: adminEmail, password: adminPassword },
    });
    assert(loginRes.status === 200 && loginRes.body.success === true, 'POST /api/admin/auth/login successfully logs in master admin');

    if (loginRes.body.token) {
      adminToken = loginRes.body.token;
      assert(!!adminToken, 'Admin JWT token acquired');
    }

    // Verify Session
    const meRes = await request('GET', '/api/admin/auth/me');
    assert(meRes.status === 200 && meRes.body.user?.email === adminEmail, 'GET /api/admin/auth/me verifies valid admin session');

    // ----------------------------------------------------
    // 4. Admin Dashboard, Stats & Notifications
    // ----------------------------------------------------
    printHeader('4. Testing Admin Stats & Notifications');

    const statsRes = await request('GET', '/api/admin/stats');
    assert(
      statsRes.status === 200 && statsRes.body.stats && statsRes.body.stats.blogsCount !== undefined,
      `GET /api/admin/stats returns counts (Blogs: ${statsRes.body.stats?.blogsCount}, Inquiries: ${statsRes.body.stats?.inquiriesCount})`
    );

    const notifRes = await request('GET', '/api/admin/notifications');
    assert(
      notifRes.status === 200 && Array.isArray(notifRes.body.notifications),
      `GET /api/admin/notifications returns list (Unread count: ${notifRes.body.totalUnread})`
    );

    // ----------------------------------------------------
    // 5. Admin CRUD (Blogs, Inquiries, Jobs, Applications)
    // ----------------------------------------------------
    printHeader('5. Testing Admin Content Management (CRUD)');

    // List all blogs (including drafts)
    const adminBlogsRes = await request('GET', '/api/admin/blogs');
    assert(adminBlogsRes.status === 200 && Array.isArray(adminBlogsRes.body.blogs), 'GET /api/admin/blogs retrieves all blog posts');

    // Create a new test blog post
    const newBlogPayload = {
      title: 'Automated Test Article',
      slug: `automated-test-article-${Date.now()}`,
      excerpt: 'Short excerpt for automated test article',
      content: '<p>This is a test blog post generated during backend testing.</p>',
      category: 'Testing',
      author: 'Automated Suite',
      status: 'draft',
      allowComments: true,
    };
    const createBlogRes = await request('POST', '/api/admin/blogs', { body: newBlogPayload });
    assert(createBlogRes.status === 201 && createBlogRes.body.success === true, 'POST /api/admin/blogs creates a blog post');
    if (createBlogRes.body?.blog?.id) {
      testBlogId = createBlogRes.body.blog.id;
    }

    // Update the test blog post
    if (testBlogId) {
      const updateBlogRes = await request('PATCH', '/api/admin/blogs', {
        body: { id: testBlogId, title: 'Updated Automated Test Article', status: 'published' },
      });
      assert(updateBlogRes.status === 200 && updateBlogRes.body.blog?.status === 'published', 'PATCH /api/admin/blogs updates blog post');

      // Delete test blog post
      const deleteBlogRes = await request('DELETE', `/api/admin/blogs?id=${testBlogId}`);
      assert(deleteBlogRes.status === 200 && deleteBlogRes.body.success === true, 'DELETE /api/admin/blogs deletes test blog post');
      testBlogId = null;
    }

    // Admin Inquiries List & Status Update
    const adminInquiriesRes = await request('GET', '/api/admin/inquiries');
    assert(adminInquiriesRes.status === 200 && Array.isArray(adminInquiriesRes.body.inquiries), 'GET /api/admin/inquiries lists all client inquiries');

    if (testInquiryId) {
      const updateInquiryRes = await request('PATCH', '/api/admin/inquiries', {
        body: { id: testInquiryId, status: 'in_progress' },
      });
      assert(updateInquiryRes.status === 200 && updateInquiryRes.body.inquiry?.status === 'in_progress', 'PATCH /api/admin/inquiries updates inquiry status');
    }

    // Admin Jobs List
    const adminJobsRes = await request('GET', '/api/admin/jobs');
    assert(adminJobsRes.status === 200 && Array.isArray(adminJobsRes.body.jobs), 'GET /api/admin/jobs lists job openings with application counts');

    // Admin Job Applications List & Status Update
    const adminAppsRes = await request('GET', '/api/admin/jobs/applications');
    assert(adminAppsRes.status === 200 && Array.isArray(adminAppsRes.body.applications), 'GET /api/admin/jobs/applications lists candidates');

    if (testApplicationId) {
      const updateAppRes = await request('PATCH', '/api/admin/jobs/applications', {
        body: { id: testApplicationId, status: 'reviewed' },
      });
      assert(updateAppRes.status === 200 && updateAppRes.body.application?.status === 'reviewed', 'PATCH /api/admin/jobs/applications updates candidate status');
    }

    // Admin Settings Update
    const updateSettingsRes = await request('POST', '/api/admin/settings/contact', {
      body: { phonePrimary: '+91 98765 43210', emailSupport: 'info@jplitsolution.com' },
    });
    assert(updateSettingsRes.status === 200 && updateSettingsRes.body.success === true, 'POST /api/admin/settings/contact updates contact info');

    // Admin Logout
    const logoutRes = await request('POST', '/api/admin/auth/logout');
    assert(logoutRes.status === 200 && logoutRes.body.success === true, 'POST /api/admin/auth/logout clears session');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // ----------------------------------------------------
    // Cleanup temporary test records from DB
    // ----------------------------------------------------
    printHeader('CLEANUP & TEARDOWN');
    try {
      if (testInquiryId) {
        await prisma.contactInquiry.deleteMany({ where: { id: testInquiryId } });
        console.log('🧹 Cleaned up test contact inquiry from database');
      }
      if (testApplicationId) {
        await prisma.jobApplication.deleteMany({ where: { id: testApplicationId } });
        console.log('🧹 Cleaned up test job application from database');
      }
      if (testBlogId) {
        await prisma.blog.deleteMany({ where: { id: testBlogId } });
        console.log('🧹 Cleaned up test blog from database');
      }
      await prisma.$disconnect();
    } catch (cleanErr) {
      console.warn('Cleanup error (non-fatal):', cleanErr.message);
    }

    if (server) {
      server.close();
      console.log('Test server closed.');
    }

    printHeader('TEST SUITE SUMMARY');
    console.log(`Total Passed: ${passed}`);
    console.log(`Total Failed: ${failed}`);

    if (failed === 0) {
      console.log(`\n🎉 ALL API ENDPOINTS PASSED SUCCESSFULLY!`);
      process.exit(0);
    } else {
      console.error(`\n⚠️ SOME API TESTS FAILED. Check log above.`);
      process.exit(1);
    }
  }
}

runAllTests();
