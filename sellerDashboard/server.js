require("dotenv").config();
const app=require("./src/app");
const connectDB=require("./src/db")



connectDB()


app.listen(3007,()=>{
    console.log("Seller Dashboard service running on port 3007");
})