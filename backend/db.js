const path = require('path');
const mongoose = require('mongoose');

// Load the backend's own environment file regardless of the current directory.
require('dotenv').config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

module.exports = mongoose;
