const mongoose=require("mongoose")



const cartSchema=new mongoose.Schema({
    user:{
        type:String,
        required:true
    },
    items:[
        {
            productId:{
                type:String,
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            }
        }
    ]
},{timestamps:true})


const cartModel=mongoose.model("cart",cartSchema)


module.exports=cartModel