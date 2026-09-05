const { signToken, comparePassword } = require('../lib/auth');
const { prisma } = require('../lib/prisma');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const targetEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@jplitsolution.com').trim().toLowerCase();
    const targetPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin_password_123';

    const inputEmail = email.trim().toLowerCase();

    if (inputEmail !== targetEmail) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let isValid = false;
    let adminId = 'admin-master';

    // 1. Direct match with configured master password
    if (password === targetPassword) {
      isValid = true;
    } else {
      // 2. Check if password hash matches in database for master email
      try {
        const adminUser = await prisma.admin.findUnique({
          where: { email: targetEmail },
        });
        if (adminUser) {
          isValid = await comparePassword(password, adminUser.passwordHash);
          adminId = adminUser.id;
        }
      } catch (e) {
        // Fallback if database query fails
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: adminId, email });

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      message: 'Login successful',
      user: { email, id: adminId },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function logout(req, res) {
  try {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
}

async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  login,
  logout,
  getMe,
};
