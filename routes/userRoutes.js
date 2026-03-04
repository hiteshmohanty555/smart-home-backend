// routes/userRoutes.js
const router = require("express").Router();
const { authRequired } = require("../middleware/authMiddleware");
const { me, updateProfile, createProfile, getProfiles, deleteProfile, getAllUsers, uploadProfilePhoto, setActiveProfile } = require("../controllers/userController");

router.get("/me", authRequired, me);
router.put("/me", authRequired, updateProfile);

// Profiles management routes
router.post("/profiles", authRequired, createProfile);
router.get("/profiles", authRequired, getProfiles);
router.delete("/profiles/:id", authRequired, deleteProfile);
router.post("/profiles/active", authRequired, setActiveProfile);

// Photo upload route
router.post("/upload-photo", authRequired, uploadProfilePhoto);

// User listing for debugging
router.get("/users", authRequired, getAllUsers);

module.exports = router;
