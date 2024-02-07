const express = require('express');
const fs = require('fs');

const app = express();
// Middleware
app.use(express.json());
app.use((req, res, next) => {
  req.requestTime = new Date().toDateString();
  next();
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// Route Handlers
const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    resuls: tours.length,
    data: {
      tours: tours,
    },
  });
};

const getTour = (req, res) => {
  const tour = tours[req.params.id];
  //if (req.params.id >= tours.length || req.params.id < 0) {
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
};

const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

const updateTour = (req, res) => {
  const tour = tours[req.params.id];
  //if (req.params.id >= tours.length || req.params.id < 0) {
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  const updatedTour = { ...tour, ...req.body };
  tours[req.params.id] = updatedTour;

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: updatedTour,
        },
      });
    }
  );
};

const deleteTour = (req, res) => {
  const tour = tours[req.params.id];
  //if (req.params.id >= tours.length || req.params.id < 0) {
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  const updatedTours = tours.filter((t) => t.id !== tour.id);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(updatedTours),
    (err) => {
      res.status(204).json({
        status: 'success',
        data: null,
      });
    }
  );
};

const getAllUsers = (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet Implemented',
  });
};

const createUser = (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet Implemented',
  });
};

const getUser = (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet Implemented',
  });
};

const updateUser = (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet Implemented',
  });
};

const deleteUser = (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet Implemented',
  });
};

// Routes
app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.route('/api/v1/users').get(getAllUsers).post(createUser);

app
  .route('/api/v1/users/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
