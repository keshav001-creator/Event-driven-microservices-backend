const cartModel = require("../models/cart.model")
const db=require("../config/mySql")

async function addItem(req, res) {

    try {

        const { productId, quantity } = req.body

        const user = req.user

        // let cart = await cartModel.findOne({ user: user.id })

        const [existingCart] = await db.execute(
            `SELECT * FROM cart WHERE user_id = ?`,
            [user.id]
        );


        let cartId;
        // if cart does not exist create new cart for user
        if (existingCart.length==0) {

           const [newCart] = await db.execute(
                `INSERT INTO cart (user_id) VALUES (?)`,
                [user.id]
            );
            cartId=newCart.insertId;
        }else{
            cartId=existingCart[0].id
        }


        const [existingItem] = await db.execute(
            `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?`,
            [cartId, productId]
        )

        if (existingItem.length > 0) {
            await db.execute(
                `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?`,
                [quantity, cartId, productId]
            );
        } else {
            await db.execute(
                `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)`,
                [cartId, productId, quantity]
            );
        }

        res.status(200).json({
            message: "items added to cart",
            cart: {
                user: user.id,
                items: [
                    {
                        productId,
                        quantity
                    }
                ]
            }
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

        const [cartItem]=await db.execute(
           `SELECT c.id as cart_id, ci.product_id, ci.quantity
            FROM cart c
            JOIN cart_items ci ON c.id = ci.cart_id
            WHERE c.user_id = ?`,
           [userId]
        )

        if(cartItem.length==0){
            return res.status(404).json({ message: "Cart not found" });
        }

        return res.status(200).json({
            message: "Cart fetch successfull",
            cart:cartItem.map(item=>({
                productId:item.product_id,
                quantity:item.quantity
            }))
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

        const [cart] = await db.execute(    
            `SELECT * FROM cart WHERE user_id = ?`,
            [userId]
        );

        if (cart.length == 0) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // await cartModel.deleteOne({
        //     user: userId
        // })

        await db.execute(
            `DELETE FROM cart WHERE user_id=?`,[userId]
        )

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

async function removeItem(req, res) {   
    try {
        const userId = req.user.id;
        const { productId } = req.body;

         const [cart] = await db.execute(    
            `SELECT * FROM cart WHERE user_id = ?`,
            [userId]
        );

        if (cart.length == 0) {
            return res.status(404).json({ message: "Cart not found" });
        }


        await db.execute(
            `DELETE FROM cart_items WHERE cart_id=? AND product_id=?`,[cart[0].id,productId]
        )

        return res.status(200).json({
            message: "Item removed from cart"
        })

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }      
}
module.exports = { addItem, getItem, deleteCart,removeItem }