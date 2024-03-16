const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
