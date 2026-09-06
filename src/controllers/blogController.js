const { prisma } = require('../lib/prisma');

// Public: Get published blogs or single blog by slug
async function getPublicBlogs(req, res) {
  try {
    const { slug } = req.query;

    if (slug) {
      const blog = await prisma.blog.findUnique({
        where: { slug: String(slug) },
      });

      if (!blog) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }

      return res.json({ success: true, blog });
    }

    const blogs = await prisma.blog.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        author: true,
        createdAt: true,
      },
      orderBy: [
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return res.json({ success: true, blogs });
  } catch (error) {
    console.error('Error fetching public blogs:', error);
    return res.status(500).json({ success: false, blogs: [], error: error.message });
  }
}

// Admin: Get all blogs or single blog by id
async function getAdminBlogs(req, res) {
  try {
    const { id } = req.query;

    if (id) {
      const blog = await prisma.blog.findUnique({
        where: { id: String(id) },
      });
      if (!blog) {
        return res.status(404).json({ success: false, error: 'Blog not found' });
      }
      return res.json({ success: true, blog });
    }

    const blogs = await prisma.blog.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        author: true,
        status: true,
        allowComments: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
    return res.json({ success: true, blogs });
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    return res.status(500).json({ success: false, blogs: [], error: error.message });
  }
}

// Admin: Create blog
async function createBlog(req, res) {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      author,
      status,
      allowComments,
      seoTitle,
      metaDescription,
      focusKeyword,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      noIndex,
      noFollow,
      createdAt,
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and Slug are required fields' });
    }

    const existing = await prisma.blog.findUnique({
      where: { slug },
    });
    if (existing) {
      return res.status(400).json({
        error: 'A blog post with this URL slug already exists. Please choose a different slug.',
      });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        excerpt: excerpt || '',
        content: content || '',
        featuredImage: featuredImage || null,
        category: category || 'Technology',
        author: author || 'JPL Team',
        status: status || 'published',
        allowComments: allowComments !== undefined ? !!allowComments : true,
        ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        focusKeyword: focusKeyword || null,
        canonicalUrl: canonicalUrl || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || null,
        noIndex: !!noIndex,
        noFollow: !!noFollow,
      },
    });

    return res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ error: error.message || 'Failed to create blog post' });
  }
}

// Admin: Update blog
async function updateBlog(req, res) {
  try {
    const { id, status, ...fields } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Blog ID is required' });
    }

    // Quick status toggle
    if (status && Object.keys(fields).length === 0) {
      const blog = await prisma.blog.update({
        where: { id },
        data: { status },
      });
      return res.json({ success: true, blog });
    }

    // Check slug collision
    if (fields.slug) {
      const existing = await prisma.blog.findFirst({
        where: {
          slug: fields.slug,
          NOT: { id },
        },
      });
      if (existing) {
        return res.status(400).json({
          error: 'Another blog post is already using this URL slug.',
        });
      }
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...(fields.title !== undefined && { title: fields.title }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.excerpt !== undefined && { excerpt: fields.excerpt }),
        ...(fields.content !== undefined && { content: fields.content }),
        ...(fields.featuredImage !== undefined && { featuredImage: fields.featuredImage || null }),
        ...(fields.category !== undefined && { category: fields.category }),
        ...(fields.author !== undefined && { author: fields.author }),
        ...(fields.allowComments !== undefined && { allowComments: !!fields.allowComments }),
        ...(fields.createdAt !== undefined && { createdAt: new Date(fields.createdAt) }),
        ...(status !== undefined && { status }),
        ...(fields.seoTitle !== undefined && { seoTitle: fields.seoTitle || null }),
        ...(fields.metaDescription !== undefined && { metaDescription: fields.metaDescription || null }),
        ...(fields.focusKeyword !== undefined && { focusKeyword: fields.focusKeyword || null }),
        ...(fields.canonicalUrl !== undefined && { canonicalUrl: fields.canonicalUrl || null }),
        ...(fields.ogTitle !== undefined && { ogTitle: fields.ogTitle || null }),
        ...(fields.ogDescription !== undefined && { ogDescription: fields.ogDescription || null }),
        ...(fields.ogImage !== undefined && { ogImage: fields.ogImage || null }),
        ...(fields.noIndex !== undefined && { noIndex: !!fields.noIndex }),
        ...(fields.noFollow !== undefined && { noFollow: !!fields.noFollow }),
      },
    });

    return res.json({ success: true, blog });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({ error: error.message || 'Failed to update blog' });
  }
}

// Admin: Delete blog
async function deleteBlog(req, res) {
  try {
    const id = req.query.id || req.body.id;

    if (!id) {
      return res.status(400).json({ error: 'Blog ID is required' });
    }

    await prisma.blog.delete({
      where: { id: String(id) },
    });

    return res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete blog' });
  }
}

module.exports = {
  getPublicBlogs,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
};
