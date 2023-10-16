const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
exports.createUser = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);
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
      status: "success",
      message: "account created successfully",
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
  const user = await User.findOne({ email });
  const accessToken = jwt.sign({ id: user.email }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const refreshToken = jwt.sign({ id: user }, process.env.REFRESH_JWT_SECRET, {
    expiresIn: "30m",
  });
  console.log(refreshToken);
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  if (user) return res.status(200).json({ user, accessToken });
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
    console.log(user);
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
