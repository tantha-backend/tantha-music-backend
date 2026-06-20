const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  createComment,
  getSongComments,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router();

router.post("/song/:songId", authMiddleware, createComment);

router.get("/song/:songId", getSongComments);

router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;