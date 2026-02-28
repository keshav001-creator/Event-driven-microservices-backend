const cartModel = require("../models/cart.model")


async function addItem(req,res){

    const {productId,quantity}=req.body

    const user=req.user

    const cart=await cartModel.findOne({user:user._id})

    if(!cart){
        cart=new cartModel({user:user._id,items:[]})
    }

    const existingItemIndex=cart.items.findIndex(item=>item.productId.toString()===productId) //index of current item 

    if(existingItemIndex>=0){
        cart.items[existingItemIndex].quantity += quantity
    }else{
        cart.items.push({productId,quantity})
    }


    await cart.save()


    res.status(200).json({
        message:"items added to cart",
        cart
    })

}



module.exports={addItem}