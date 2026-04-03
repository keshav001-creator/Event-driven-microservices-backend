const express=require("express");
const {connect}=require("./broker/broker")
const listener=require("./broker/listener")
const routes=require("./routes")
const cookieParser=require("cookie-parser")


const app=express();

connect().then(
    listener()
).catch((error)=>{
    console.error("Error connecting to RabbitMQ:",error);
})

app.use(express.json())
app.use(cookieParser())


app.use("/api", routes)


module.exports=app