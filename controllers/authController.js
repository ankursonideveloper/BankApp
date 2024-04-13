const User = require("../models/User");
const nodemailer = require("nodemailer"); // for sending emails
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ msg: "Please provide all required fields" });
  }

  try {
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ msg: "User already registered" });
    }

    if (user && !user.isVerified) {
      const verificationToken = crypto.randomBytes(20).toString("hex");

      user.verificationToken = verificationToken;
      user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      await user.save();

      const transporter =
        nodemailer.createTransport(/* your SMTP settings here */);
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Email Verification",
        text: `Please click the link to verify your email: http://your-app.com/verify-email?token=${verificationToken}`,
      };
      await transporter.sendMail(mailOptions);

      return res.json({ msg: "Verification email sent" });
    }

    user = new User({
      firstName,
      lastName,
      email,
      password,
      balance,
      isVerified: false,
    });

    await user.save();

    const verificationToken = crypto.randomBytes(20).toString("hex");

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    await user.save();

    const transporter =
      nodemailer.createTransport(/* your SMTP settings here */);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Email Verification",
      text: `Please click the link to verify your email: http://your-app.com/verify-email?token=${verificationToken}`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ msg: "User registered successfully. Verification email sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    // Find the user with the provided token
    let user = await User.findOne({ verificationToken: token });

    // If no user is found, or the token is expired, return an error
    if (!user || Date.now() > user.verificationTokenExpires) {
      return res
        .status(400)
        .json({ msg: "Invalid or expired verification token" });
    }

    // If a user is found and the token is not expired, verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ msg: "Please verify your email first" });
    }

    // User is valid, generate a JWT
    const payload = {
      user: {
        id: user._id,
      },
    };

    jwt.sign(
      payload,
      "your-jwt-secret", // replace 'your-jwt-secret' with your actual secret
      { expiresIn: "1h" }, // token will expire in 1 hour
      (err, token) => {
        if (err) throw err;

        // Send the user info (without password) and the token
        const userResponse = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
          token,
        };

        res.json(userResponse);
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    // Generate a password reset token and set its expiration time
    const passwordResetToken = crypto.randomBytes(20).toString("hex");
    const passwordResetTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    // Save the password reset token and its expiration time to the user
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;
    await user.save();

    // Send password reset email
    const transporter =
      nodemailer.createTransport(/* your SMTP settings here */);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset",
      text: `Please click the link to reset your password: http://your-app.com/reset-password?token=${passwordResetToken}`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ msg: "Password reset email sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
