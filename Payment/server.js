const app=require("./app")
require("dotenv").config()
const connectDB=require("./src/db/db")


connectDB()


app.listen(3004,()=>{
    console.log("Payment service Server is running on port 3004")
})

