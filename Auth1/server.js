const app=require("./src/app")
const connectDB=require("./src/db/db")
require("dotenv").config()

connectDB()


app.listen(3000,()=>{
    console.log("Connected to port 3000")
})