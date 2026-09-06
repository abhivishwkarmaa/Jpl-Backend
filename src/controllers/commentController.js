const { prisma } = require('../lib/prisma');
const { validatePhone, validateName, validateEmail, validateText } = require('../lib/validation');

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
        return res.status(404).json({ success: false, error: 'Blog not found' });
      }
      targetBlogId = blog.id;
    }

    const comments = await prisma.comment.findMany({
      where: {
        blogId: String(targetBlogId),
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
    });

    const rootComments = [];
    const replyMap = {};

    comments.forEach((c) => {
      if (!c.parentId) {
        rootComments.push({ ...c, replies: [] });
      } else {
        if (!replyMap[c.parentId]) {
          replyMap[c.parentId] = [];
        }
        replyMap[c.parentId].push(c);
      }
    });

    rootComments.forEach((rc) => {
      rc.replies = replyMap[rc.id] || [];
    });

    return res.json({ success: true, comments: rootComments });
  } catch (error) {
    console.error('Failed to get comments:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
}

// Public: Submit comment
async function createComment(req, res) {
  try {
    const { blogId, slug, authorName, authorContact, content, parentId } = req.body;

    const nameCheck = validateName(authorName, 'Name', true);
    if (!nameCheck.isValid) {
      return res.status(400).json({ success: false, error: nameCheck.error });
    }

    if (authorContact && authorContact.trim() && authorContact.trim().toLowerCase() !== 'guest') {
      const emailCheck = validateEmail(authorContact.trim(), false);
      const phoneCheck = validatePhone(authorContact.trim(), false);
      if (!emailCheck.isValid && !phoneCheck.isValid) {
        return res.status(400).json({ success: false, error: 'Contact must be a valid email or phone number' });
      }
    }

    const contentCheck = validateText(content, 2, 2500, 'Comment message', true);
    if (!contentCheck.isValid) {
      return res.status(400).json({ success: false, error: contentCheck.error });
    }

    const cleanContact = authorContact && authorContact.trim() ? authorContact.trim() : 'Guest';

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
        authorContact: cleanContact,
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
