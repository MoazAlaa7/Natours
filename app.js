const express = require('express');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toDateString();
  next();
});

// Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: 'The requested URL was not found on this server.',
  });
});

module.exports = app;
