const { prisma } = require('../lib/prisma');

// Public: Get comments for a blog post
async function getComments(req, res) {
  try {
    const { slug, blogId } = req.query;

    if (!slug && !blogId) {
      return res.status(400).json({ success: false, error: 'slug or blogId parameter is required' });
    }

    let targetBlogId = blogId;

    if (slug) {
      const blog = await prisma.blog.findUnique({
        where: { slug: String(slug) },
        select: { id: true, allowComments: true },
      });

      if (!blog) {
        return res.json({ success: true, comments: [], allowComments: false });
      }

      targetBlogId = blog.id;
    }

    if (!targetBlogId) {
      return res.json({ success: true, comments: [] });
    }

    const comments = await prisma.comment.findMany({
      where: {
        blogId: targetBlogId,
        status: 'approved',
        parentId: null,
      },
      include: {
        replies: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ success: false, comments: [], error: error.message });
  }
}

// Public: Submit comment
async function createComment(req, res) {
  try {
    const { blogId, slug, authorName, authorContact, content, parentId } = req.body;

    if (!authorName || !authorName.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your name' });
    }

    if (!authorContact || !authorContact.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your email or contact info' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a comment message' });
    }

    let targetBlog = null;
    if (blogId) {
      targetBlog = await prisma.blog.findUnique({
        where: { id: String(blogId) },
        select: { id: true, allowComments: true },
      });
    } else if (slug) {
      targetBlog = await prisma.blog.findUnique({
        where: { slug: String(slug) },
        select: { id: true, allowComments: true },
      });
    }

    if (!targetBlog) {
      return res.status(404).json({ success: false, error: 'Associated blog post could not be found' });
    }

    if (!targetBlog.allowComments) {
      return res.status(403).json({ success: false, error: 'Comments are closed for this article' });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: String(parentId) },
      });
      if (!parent) {
        return res.status(400).json({ success: false, error: 'Parent comment does not exist' });
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        blogId: targetBlog.id,
        authorName: authorName.trim(),
        authorContact: authorContact.trim(),
        content: content.trim(),
        parentId: parentId || null,
        status: 'approved',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      comment: newComment,
    });
  } catch (error) {
    console.error('Error submitting comment:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to submit comment' });
  }
}

module.exports = {
  getComments,
  createComment,
};
