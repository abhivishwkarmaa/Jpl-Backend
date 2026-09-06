const { prisma } = require('../lib/prisma');
const { validatePhone, validateName, validateEmail, validateText } = require('../lib/validation');

// Public: Submit contact inquiry
async function createInquiry(req, res) {
  try {
    const { name, email, phone, serviceOfInterest, message } = req.body;

    const nameCheck = validateName(name, 'Name', true);
    if (!nameCheck.isValid) {
      return res.status(400).json({ error: nameCheck.error });
    }

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    if (phone) {
      const phoneCheck = validatePhone(phone, false);
      if (!phoneCheck.isValid) {
        return res.status(400).json({ error: phoneCheck.error });
      }
    }

    const msgCheck = validateText(message, 3, 3000, 'Message', true);
    if (!msgCheck.isValid) {
      return res.status(400).json({ error: msgCheck.error });
    }

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        serviceOfInterest: (serviceOfInterest || 'General Inquiry').slice(0, 100),
        message: message.trim(),
      },
    });

    return res.status(201).json({ success: true, inquiry });
  } catch (error) {
    console.error('Failed to create contact inquiry:', error);
    return res.status(500).json({ error: error.message || 'Failed to process inquiry' });
  }
}

// Admin: Get all inquiries
async function getAdminInquiries(req, res) {
  try {
    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, inquiries });
  } catch (error) {
    console.error('Failed to fetch contact inquiries:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch inquiries' });
  }
}

// Admin: Update inquiry status
async function updateAdminInquiry(req, res) {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Inquiry ID and status are required' });
    }

    const updated = await prisma.contactInquiry.update({
      where: { id: String(id) },
      data: { status },
    });

    return res.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error('Failed to update inquiry status:', error);
    return res.status(500).json({ error: error.message || 'Failed to update inquiry' });
  }
}

// Admin: Delete inquiry
async function deleteAdminInquiry(req, res) {
  try {
    const id = req.query.id || req.body.id;

    if (!id) {
      return res.status(400).json({ error: 'Inquiry ID is required' });
    }

    await prisma.contactInquiry.delete({
      where: { id: String(id) },
    });

    return res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Failed to delete inquiry:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete inquiry' });
  }
}

module.exports = {
  createInquiry,
  getAdminInquiries,
  updateAdminInquiry,
  deleteAdminInquiry,
};
