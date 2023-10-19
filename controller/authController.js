const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { EMAIL, PASSWORD } = require("../env");
const crypto = require("crypto");
const Mailgen = require("mailgen");
const nodemailer = require("nodemailer");
const { Console } = require("console");

exports.createUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) return res.status(403).json({ message: "email already exist" });

    const newUser = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
      phonenumber: req.body.phonenumber,
      confirmPassword: req.body.confirmPassword,
    });

    const accessToken = jwt.sign(
      { id: req.body.phonenumber },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );
    const refreshToken = jwt.sign(
      { id: req.body.phonenumber },
      process.env.REFRESH_JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      newUser,
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.Login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user)
    return res
      .status(403)
      .json({ message: "email does not belong to an existing user" });

  const match = await user.comparePassword(password, user.password);
  if (!match) {
    return res
      .status(400)
      .json({ status: "failed", message: "email or password does not match" });
  } else {
    const accessToken = jwt.sign({ id: user.email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    const refreshToken = jwt.sign(
      { id: user.email },
      process.env.REFRESH_JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ user, accessToken });
  }
};

exports.getOneUser = async (req, res) => {
  const email = req.query.email;
  const accessToken = req.query.token;
  const user = await User.findOne({ email });
  if (user) {
    const refreshToken = jwt.sign(
      { id: user.email },
      process.env.REFRESH_JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ user, accessToken });
  } else {
    return res
      .status(403)
      .json({ message: "email does not belong to an existing user" });
  }
};

exports.UpateMe = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(req.params.id, {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      confirmPassword: req.body.confirmPassword,
    });
    const match = await user.comparePassword(
      req.body.confirmPassword,
      user.password
    );
    if (!match) {
      return res.status(401).json({ message: "your password is incorrect" });
    }
    res.status(200).json({ message: "profile successfully updated" });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};
exports.LogOut = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);
  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
  return res.json({ message: "cookie cleared" });
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ status: "error", message: "user does not exist" });
  } else {
    const reset = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    let config = {
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Mailgen",
        link: "https://mailgen.js/",
        copyright: "Copyright © 2023 e-gency. All rights reserved.",
      },
    });
    let response = {
      body: {
        name: email,
        intro:
          "Someone recently requested that the password be reset, Please click the kink below",
        action: {
          instructions: "To reset your password please click this button:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
            link: `https://e-rent-green.vercel.app/resetpassword/${user._id}/${reset}`,
          },
        },
        signature: "Sincerely",
        outro:
          "If this is a mistake just ignore this email - your password will not be changed.",
      },
    };
    let mail = MailGenerator.generate(response);
    let message = {
      from: EMAIL,
      to: email,
      subject: "Reset Password",
      html: mail,
    };
    transporter
      .sendMail(message)
      .then(() => {
        return res.status(200).json({
          message: "success",
        });
      })
      .catch(() => {
        return res.status(404).json({ message: "failed" });
      });
  }
};

exports.resetPassword = async (req, res, next) => {
  const id = req.params.id;
  const providedToken = req.params.token;
  const hashOfProvidedToken = crypto
    .createHash("sha256")
    .update(providedToken)
    .digest("hex");
  const user = await User.findById(id);
  let newpassword;
  const match = await user.comparePassword(req.body.password, user.password);
  const tokenisValid = hashOfProvidedToken === user.passwordResetToken;
  const tokenIsExpired = user.passwordResetTokenExpires < Date.now();
  if (!user) {
    return res
      .status(401)
      .json({ status: "error", message: "user does not exist" });
  } else if (match) {
    return res.status(404).json({
      status: "error",
      message: "password cannot be the same as your previous password",
    });
  } else if (user && tokenisValid && !tokenIsExpired && !match) {
    newpassword = await user.encryptpassword(
      req.body.password,
      req.body.confirmPassword
    );
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        password: newpassword,
        confirmPassword: undefined,
      },
      { validateBeforeSave: false }
    );
    return res.status(200).json({ status: "success" });
  } else {
    return res
      .status(400)
      .json({ status: "error", message: "please reset password" });
  }
};
