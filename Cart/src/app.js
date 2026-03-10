const express=require("express")
const cartRoutes=require("./routes/cart.routes")
const cookieParser=require("cookie-parser")

const app=express()

app.use(express.json()) 
app.use(cookieParser())

app.use("/cart",cartRoutes)


module.exports=app