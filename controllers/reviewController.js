const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const factory = require('./controllerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = req.params.tourId
    ? await Review.find({ tour: req.params.tourId })
    : await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.setTourUserIds = (req, res, next) => {
  req.body = {
    ...req.body,
    tour: req.params.tourId,
    user: req.user.id,
  };

  next();
};

exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
