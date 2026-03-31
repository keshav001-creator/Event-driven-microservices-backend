const express= require("express")
const authRoute=require("./routes/register.route")
const cookieParser=require("cookie-parser")
const {connect}=require("./broker/broker")

connect();

const app=express()

app.use(express.json())
app.use(cookieParser())


app.use("/auth",authRoute)



module.exports=app