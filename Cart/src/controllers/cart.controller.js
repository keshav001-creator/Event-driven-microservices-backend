const cartModel = require("../models/cart.model")


async function addItem(req, res) {

    try {

        const { productId, quantity } = req.body

        const user = req.user

        let cart = await cartModel.findOne({ user: user.id })

        if (!cart) {
            cart = new cartModel({ user: user.id, items: [] })
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId === productId) //index of current item 

        if (existingItemIndex > 0) {
            cart.items[existingItemIndex].quantity = quantity
        } else {
            cart.items.push({ productId, quantity })
        }


        await cart.save()


        res.status(200).json({
            message: "items added to cart",
            cart
        })


    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }
}

async function getItem(req, res) {
    try {
        const userId = req.user.id

        const cart = await cartModel.findOne({
            user: userId
        });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        return res.status(200).json({
            message: "Cart fetch successfull",
            cart
        })
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }
}

async function deleteCart(req, res) {
    try {
        const userId = req.user.id;

        const cart = await cartModel.findOne({
            user: userId
        });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        await cartModel.deleteOne({
            user: userId
        })

        return res.status(200).json({
            message: "Delete successfull"
        })
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }

}



module.exports = { addItem, getItem, deleteCart }