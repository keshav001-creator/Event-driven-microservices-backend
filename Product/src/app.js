const express = require("express")
const productRoute = require("./routes/product.routes")
const cookieParser = require("cookie-parser")
const { connect } = require("../src/broker/broker")


connect().then(() => {
    console.log("Broker connected successfully");
}).catch((error) => {
    console.error("Error connecting to broker:", error);
})

const app = express()    //server is initialised


app.use(express.json())
app.use(cookieParser())
app.use("/products", productRoute)


module.exports = app