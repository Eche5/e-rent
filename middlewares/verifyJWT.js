const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const authHeaders = req.headers.authorization || req.headers.Authorization;
  if (!authHeaders?.startsWith("Bearer")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const accessToken = authHeaders.split(" ")[1];

  jwt.verify(accessToken, process.env.JWT_SECRET, async function(err, decoded) {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.email = decoded.email;
  });
  next();
};
module.exports = verifyToken;
