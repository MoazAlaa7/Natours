const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const createSignToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const token = createSignToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  // 2) Check if user exists & password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.isCorrectPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 3) Everything is fine, send token to the client
  const token = createSignToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  // 1) Check if token is received
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to gain access', 401),
    );
  }

  // 2) Verify user id & token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  // 3) Check if user still exists
  const user = await User.findById(decodedPayload.id);
  if (!user) {
    return next(new AppError('User no longer exists!', 401));
  }

  // 4) Check if user changed his password after the token was issued
  if (user.changedPasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError('User changed password! Please log in again.', 401),
    );
  }

  // 5) Everything is fine, grant access to protected route
  req.user = user;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with this email.', 404));
  }

  // 2) Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `To Reset Your Password: Submit a PATCH with new password and passwordConfirm to ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token (VALID FOR 10 MINS)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset token was sent to your email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If there is user, set the new password
  if (!user) {
    return next(
      new AppError('Password reset token is invalid or has expired.', 400),
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update passwordChangedAt property

  // 4) Log the user in (send JWT)
  const token = createSignToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});
