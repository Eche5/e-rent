const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const DB = process.env.DATABASE;
mongoose.connect(DB).then(() => {
  console.log("DATABASE IS RUNNING");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`);
});
