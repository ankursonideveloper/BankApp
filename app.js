const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const errorHandler = require("./errors/errorHandler");

mongoose.connect("mongodb://localhost:27017/bankApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

// Error handler should be the last middleware
app.use(errorHandler);

app.listen(3000, () => console.log("Server started on port 3000"));
