const express = require('express');
const dotenv = require('dotenv');
dotenv.config();


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send(`🚀 Buddies Inn Backend server running on port ${PORT}.`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
