const express = require("express");
const cookieParser = require('cookie-parser');
const paymentRoute = require("./src/routes/payment.routes");
const {connect} = require("./src/broker/broker");



const app = express();
connect();


app.use(express.json());
app.use(cookieParser());

app.use("/api", paymentRoute);

module.exports = app;