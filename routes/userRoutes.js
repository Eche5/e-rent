const express = require("express");
const verifyJWT = require("../middlewares/verifyJWT");
const limiter = require("../middlewares/LoginLimit");
const authController = require("../controller/authController");
const refreshTokenHandler = require("../controller/refreshTokenHandler");

const router = express.Router();

router.route("/auth").post(limiter, authController.Login);

router.route("/refresh").get(refreshTokenHandler);

router.route("/register").post(authController.createUser);
router.route("/logout").post(authController.LogOut);

// router.use(verifyJWT);
router.route("/googleauth").get(authController.getOneUser);

router.route("/:id").patch(authController.UpateMe);

module.exports = router;
