const express=require("express")
const cartRoutes=require("./routes/cart.routes")
const cookieParser=require("../src/")

const app=express()

app.use(express.json()) 
app.use("/cart",cartRoutes)


module.exports=app