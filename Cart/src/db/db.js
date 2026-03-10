require("dotenv").config()
const mongoose=require("mongoose")


async function connectDB(){

    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Connected to MONGO DB")

    }catch(err){

        console.log("Error while connecting to DB:",err)

    }
}


module.exports=connectDB