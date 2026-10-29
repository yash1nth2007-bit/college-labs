// Import express module
const express = require("express");

// Initialize express application
const app = express();

// Route 1: GET /
// Returns a welcome message
app.get("/", (req, res) => {
  res.status(200).send("Welcome to Lab 1 Node.js and Express Server");
});

// Route 2: GET /about
// Returns student name and section in JSON format
app.get("/about", (req, res) => {
  res.status(200).json({
    name: "Botka Yashwanth",
    section: "S-13"
  });
});

// Route 3: GET /time
// Returns the current date and time using new Date()
app.get("/time", (req, res) => {
  const currentTime = new Date();
  res.status(200).send(`Current Date and Time: ${currentTime.toString()}`);
});

// Route 4: Catch-all handler for unknown paths (404 Not Found)
app.use((req, res) => {
  res.status(404).send("404 - Route Not Found");
});

// Start Express server on port 3000
app.listen(3000, () => {
  console.log("Express server running on http://localhost:3000");
});

