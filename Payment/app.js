const express = require("express");
const cookieParser = require('cookie-parser');
const paymentRoute = require("./src/routes/payment.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api", paymentRoute);

module.exports = app;