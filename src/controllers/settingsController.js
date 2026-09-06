const { prisma } = require('../lib/prisma');
const { validatePhone, validateEmail, validateUrl } = require('../lib/validation');

async function getSettings(req, res) {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          id: 'default',
          phonePrimary: '+91 98765 43210',
          phoneSecondary: '+91 98765 00000',
          emailSupport: 'info@jplitsolution.com',
          emailCareers: 'careers@jplitsolution.com',
          officeAddress: 'Plot No. 12, Tech Park Sector 62, Noida, Uttar Pradesh 201301, India',
          googleMapsEmbedUrl: '',
          linkedinUrl: 'https://linkedin.com/company/jplitsolution',
          twitterUrl: 'https://twitter.com/jplitsolution',
          facebookUrl: 'https://facebook.com/jplitsolution',
          instagramUrl: 'https://instagram.com/jplitsolution',
        },
      });
    }

    return res.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to fetch company settings:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      phonePrimary,
      phoneSecondary,
      emailSupport,
      emailCareers,
      officeAddress,
      googleMapsEmbedUrl,
      linkedinUrl,
      twitterUrl,
      facebookUrl,
      instagramUrl,
    } = req.body;

    if (phonePrimary) {
      const p1 = validatePhone(phonePrimary, false);
      if (!p1.isValid) return res.status(400).json({ success: false, error: `Primary phone: ${p1.error}` });
    }
    if (phoneSecondary) {
      const p2 = validatePhone(phoneSecondary, false);
      if (!p2.isValid) return res.status(400).json({ success: false, error: `Secondary phone: ${p2.error}` });
    }
    if (emailSupport) {
      const e1 = validateEmail(emailSupport, false);
      if (!e1.isValid) return res.status(400).json({ success: false, error: `Support email: ${e1.error}` });
    }
    if (emailCareers) {
      const e2 = validateEmail(emailCareers, false);
      if (!e2.isValid) return res.status(400).json({ success: false, error: `Careers email: ${e2.error}` });
    }
    if (linkedinUrl) {
      const u1 = validateUrl(linkedinUrl, false);
      if (!u1.isValid) return res.status(400).json({ success: false, error: `LinkedIn URL: ${u1.error}` });
    }
    if (twitterUrl) {
      const u2 = validateUrl(twitterUrl, false);
      if (!u2.isValid) return res.status(400).json({ success: false, error: `Twitter URL: ${u2.error}` });
    }
    if (facebookUrl) {
      const u3 = validateUrl(facebookUrl, false);
      if (!u3.isValid) return res.status(400).json({ success: false, error: `Facebook URL: ${u3.error}` });
    }
    if (instagramUrl) {
      const u4 = validateUrl(instagramUrl, false);
      if (!u4.isValid) return res.status(400).json({ success: false, error: `Instagram URL: ${u4.error}` });
    }

    const settings = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {
        phonePrimary: phonePrimary ?? '+91 98765 43210',
        phoneSecondary: phoneSecondary ?? '',
        emailSupport: emailSupport ?? 'info@jplitsolution.com',
        emailCareers: emailCareers ?? 'careers@jplitsolution.com',
        officeAddress: officeAddress ?? '',
        googleMapsEmbedUrl: googleMapsEmbedUrl ?? '',
        linkedinUrl: linkedinUrl ?? '',
        twitterUrl: twitterUrl ?? '',
        facebookUrl: facebookUrl ?? '',
        instagramUrl: instagramUrl ?? '',
      },
      create: {
        id: 'default',
        phonePrimary: phonePrimary ?? '+91 98765 43210',
        phoneSecondary: phoneSecondary ?? '',
        emailSupport: emailSupport ?? 'info@jplitsolution.com',
        emailCareers: emailCareers ?? 'careers@jplitsolution.com',
        officeAddress: officeAddress ?? '',
        googleMapsEmbedUrl: googleMapsEmbedUrl ?? '',
        linkedinUrl: linkedinUrl ?? '',
        twitterUrl: twitterUrl ?? '',
        facebookUrl: facebookUrl ?? '',
        instagramUrl: instagramUrl ?? '',
      },
    });

    return res.json({
      success: true,
      message: 'Company settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Failed to save company settings:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to save settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
};
