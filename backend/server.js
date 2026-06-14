const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve Static Files in Production
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`LOGE CRM server running on http://localhost:${PORT}`);
});
