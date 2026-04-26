const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');
const problemRoutes = require('./routes/problem');
const volunteerRoutes = require('./routes/volunteer');
const geocodeRoutes = require('./routes/geocode');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/geocode', geocodeRoutes);

// Nested routes for problems and volunteers under workspaces
app.use('/api/workspaces/:workspaceId/problems', (req, res, next) => {
  req.workspaceId = req.params.workspaceId;
  next();
}, problemRoutes);

app.use('/api/workspaces/:workspaceId/volunteers', (req, res, next) => {
  req.workspaceId = req.params.workspaceId;
  next();
}, volunteerRoutes);

app.use(errorHandler);

module.exports = app;
