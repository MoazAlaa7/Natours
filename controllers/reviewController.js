const Review = require('../models/reviewModel');
const factory = require('./controllerFactory');

exports.setTourUserIds = (req, res, next) => {
  req.body = {
    ...req.body,
    tour: req.params.tourId,
    user: req.user.id,
  };

  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
