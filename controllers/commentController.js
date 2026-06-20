const Comment = require("../models/Comment");
const Song = require("../models/Song");

const createComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const { songId } = req.params;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const newComment = await Comment.create({
      userId: req.user.id,
      songId,
      comment,
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { commentCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

const getSongComments = async (req, res) => {
  try {
    const { songId } = req.params;

    const comments = await Comment.find({ songId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await Song.findByIdAndUpdate(comment.songId, {
      $inc: { commentCount: -1 },
    });

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

module.exports = {
  createComment,
  getSongComments,
  deleteComment,
};