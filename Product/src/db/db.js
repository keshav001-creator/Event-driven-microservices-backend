const mongoose=require("mongoose")


async function connectDB(){

    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("connected to mongoDB")
    }catch(err){
        console.log("MongoDb do not connected")
    }

}

module.exports=connectDB


