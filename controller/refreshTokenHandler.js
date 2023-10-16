const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const refreshToken = async (req, res) => {
  const cookies = req.cookies;
  console.log(cookies.jwt);
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;

  jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, async function(
    err,
    decoded
  ) {
    if (err) return res.status(403).json({ message: "Forbidden" });
    const user = await User.findOne({ email: decoded.id });

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const accessToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken, user });
  });
};
module.exports = refreshToken;
