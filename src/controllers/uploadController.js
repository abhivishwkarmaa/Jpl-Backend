const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials exist in .env
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
}

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'blogs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanBaseName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'image';
    const filename = `blog-${Date.now()}-${cleanBaseName}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload a PNG, JPG, WEBP, or GIF image.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
}).single('file');

function handleUpload(req, res) {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image size exceeds the 10MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. If Cloudinary is configured, upload to Cloudinary CDN for blazing fast speed
    if (hasCloudinary) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'jpl_blogs',
          resource_type: 'auto',
          fetch_format: 'auto',
          quality: 'auto',
        });

        // Delete local temporary file after successful Cloudinary upload
        try {
          fs.unlinkSync(req.file.path);
        } catch {}

        return res.json({
          success: true,
          url: result.secure_url,
          filename: result.public_id,
          cdn: 'cloudinary',
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local file:', cloudErr.message);
      }
    }

    // 2. Fallback to local server uploads
    const publicUrl = `/uploads/blogs/${req.file.filename}`;

    return res.json({
      success: true,
      url: publicUrl,
      filename: req.file.filename,
      cdn: 'local',
    });
  });
}

module.exports = {
  handleUpload,
};
