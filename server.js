const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const host = process.env.HOST;
const apiKey = process.env.API_KEY

app.use(cookieParser());
app.use(express.json());

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const requestApiKey = req.headers['x-api-key'];
  if (!requestApiKey || requestApiKey !== apiKey) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
  next();
};

// Function to write the cookie to the .env file
const writeCookieToEnv = (cookie) => {
  const envPath = path.resolve(__dirname, '.env');
  
  // Read existing .env file
  let envVars = {};
  if (fs.existsSync(envPath)) {
    envVars = dotenv.parse(fs.readFileSync(envPath));
  }

  // Add or update the cookie in the .env file
  envVars['SUNO_COOKIE'] = `"${cookie}"`; // Ensure the value is stored as a string

  // Write the updated environment variables back to the .env file
  const newEnvVars = Object.keys(envVars)
    .map(key => `${key}=${envVars[key]}`)
    .join('\n');

  fs.writeFileSync(envPath, newEnvVars);
}

// Route to receive the cookie and save it to the .env file
app.post('/send-cookie', checkApiKey, (req, res) => {
  const { cookie } = req.body;
  console.log(cookie);
  if (!cookie) {
    return res.status(400).json({ error: 'Cookie is required' });
  }

  // Save the cookie to the .env file
  try {
    writeCookieToEnv(cookie);
    res.json({ message: 'Cookie received and stored successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store cookie' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('SunoApi Cookie Provider');
});

// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
