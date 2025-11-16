const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files (HTML, JS, CSS, XML, etc.)
app.use(express.static(path.join(__dirname)));

// Handle root request
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((req, res, next) => {
  console.log(`Requesting for: ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
