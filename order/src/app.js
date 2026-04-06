const express = require("express");
const cookieParser = require('cookie-parser');
const orderRoute = require("./routes/order.routes");
const {connect}=require("./broker/broker");
const listener = require("./broker/listener");

const app = express();
connect().then(()=>{
    listener();
    console.log("Broker connected successfully");
}).catch((error)=>{
    console.error("Error connecting to broker:",error);
})

app.use(express.json());
app.use(cookieParser());

app.use("/api", orderRoute);

module.exports = app;