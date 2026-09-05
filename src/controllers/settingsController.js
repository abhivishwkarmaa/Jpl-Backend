const { prisma } = require('../lib/prisma');

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
