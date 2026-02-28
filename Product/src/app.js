const express=require("express")
const productRoute=require("./routes/product.routes")
const cookieParser=require("cookie-parser")




const app=express()    //server is initialised


app.use(express.json())    
app.use(cookieParser())
app.use("/products",productRoute)


module.exports=app