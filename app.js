const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();

// Middleware for logging requests and parsing the body
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

//CORS setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT,POST,DELETE,GET,PATCH");
    return res.status(200).json({});
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

const authRoutes = require("./api/routes/auth-routes");
const itemRoutes = require("./api/routes/item-routes");
const cartRoutes = require("./api/routes/cart-routes");
const orderRoutes = require("./api/routes/order-routes");
const promotionRoutes = require("./api/routes/promotion-routes");
const feedbackRoutes = require("./api/routes/feedback-routes");

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/feedback", feedbackRoutes);

module.exports = app;
