const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/userRoutes");
const corsOptions = require("./config/corsOptions");
const credentials = require("./middlewares/credentials");
const app = express();
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);

module.exports = app;
