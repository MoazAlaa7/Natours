const express = require('express');
const rateLimit = require('express-rate-limit');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');

const app = express();

app.use(express.json());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests! Please try again later.',
});
app.use('/api', limiter);

app.use((req, res, next) => {
  req.requestTime = new Date().toDateString();
  next();
});

// Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {
  next(new AppError('The requested URL was not found on this server.', 404));
});

app.use(errorController);

module.exports = app;
