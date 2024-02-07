const express = require('express');
const fs = require('fs');

const app = express();
// Middleware
app.use(express.json());

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    resuls: tours.length,
    data: {
      tours: tours,
    },
  });
});

app.get('/api/v1/tours/:id', (req, res) => {
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
});

app.post('/api/v1/tours', (req, res) => {
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
});

app.patch('/api/v1/tours/:id', (req, res) => {
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
});

app.delete('/api/v1/tours/:id', (req, res) => {
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
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
