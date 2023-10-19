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
router.route("/forgotpassword").post(authController.forgotPassword);
router.route("/resetpassword/:id/:token").patch(authController.resetPassword);

router.route("/googleauth").get(authController.getOneUser);

router.use(verifyJWT);

router.route("/:id").patch(authController.UpateMe);

module.exports = router;
