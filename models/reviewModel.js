const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'a review can not be empty!'],
    },
    rating: {
      type: Number,
      max: [5, 'Rating must be between 1 and 5'],
      min: [1, 'Rating must be between 1 and 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'a review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'a review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAvgRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      // Set back to default values
      ratingsQuantity: 0,
      ratingsAverage: 4,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAvgRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
  if (doc) await doc.constructor.calcAvgRating(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
