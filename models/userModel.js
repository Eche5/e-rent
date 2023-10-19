const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, "Please provide a firstname"],
  },
  lastname: {
    type: String,
    required: [true, "Please provide a lastname"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    validate: [validator.isEmail, "Please provide a valid email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "please provide a password"],
    minlength: 8,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: "Passwords do not match",
    },
  },
  phonenumber: {
    type: String,
    required: [true, "Please provide your phone number"],
    unique: true,
  },
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  (this.confirmPassword = undefined), next();
});

userSchema.methods.comparePassword = async function(
  currentPassword,
  userPassword
) {
  return await bcrypt.compare(currentPassword, userPassword);
};

userSchema.methods.encryptpassword = async function(
  newpassword,
  confirmPassword
) {
  newpassword = await bcrypt.hash(newpassword, 12);
  confirmPassword = undefined;
  return newpassword;
};

userSchema.methods.createResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
