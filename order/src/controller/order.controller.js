const axios = require("axios")
const db = require("../config/mysql")
const { publishToQueue, subscribeToQueue } = require("../broker/broker")

async function createOrder(req, res) {

    const userId = req.user.id;
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1]
    let orderId = null;

    try {
        const cartResponse = await axios.get(`http://localhost:3002/cart/item`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        // console.log("Cart Response:", cartResponse.data.cart.items);

        const products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {
            const response = await axios.get(`http://localhost:3001/products/${item.productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }

            })
            return response.data.row[0]
        }))

        const addressResponse = await axios.get(
            `http://localhost:3000/auth/users/me/addresses`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        // console.log("address:", addressResponse.data.addresses.address_id)


        const addressId = addressResponse.data.addresses.address_id
        let TotalPriceAmount = 0;


        const orderItems = [];  //array for multiple items in a cart at a time



        // adding each items of cart into orderItems array
        for (let item of cartResponse.data.cart.items) {
            const Product = products.find(p => p.product_id === Number(item.productId))

            if (!Product) {
                return res.status(404).json({ message: "Product not found" })
            }

            if (Product.stock < item.quantity) {
                return res.status(403).json({
                    message: `${Product.title} out of stock`
                })
            }

            const priceTotal = Number(Product.price_amount) * item.quantity;
            TotalPriceAmount += priceTotal;

            orderItems.push({
                product_id: item.productId,
                quantity: item.quantity,
                price_amount: priceTotal,
                price_currency: Product.price_currency,
                sellerId: Product.seller_id
            });
        }


        // add order into the database and get the orderId for adding items into order_items table
        const [orderResult] = await db.execute(
            `INSERT INTO orders
            (user_id, total_price_amount, total_price_currency, shipping_address_id)
            VALUES (?,?,?,?)`,
            [userId, TotalPriceAmount, "INR", addressId]
        )

        const orderId = orderResult.insertId;


        for (let item of orderItems) {
            await db.execute(
                `INSERT INTO order_items
                 (order_id, product_id, quantity, price_amount, price_currency, seller_id)
                 VALUES (?,?,?,?,?,?)`,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price_amount,
                    item.price_currency,
                    item.sellerId
                ]
            )
        }

        //publish order details to the queue for sellerDashboard service
        await publishToQueue("order_sellerDashboard_queue", {
            order_id: orderId,
            user_id: userId,
            total_amount: TotalPriceAmount,
            currency: "INR",
            address_id: addressId,
            items: orderItems
        })

        return res.status(201).json({
            message: "Order created successfully",

        })

    } catch (err) {
        if (orderId) {
            await db.execute(`DELETE FROM order_items WHERE order_id = ?`, [orderId])
            await db.execute(`DELETE FROM orders WHERE order_id = ?`, [orderId])
        }
        console.log(err)
        res.status(500).json({ message: "Internal server error", err })
    }

}

async function getMyOrderById(req, res) {

    const userId = req.user.id;
    const orderId = req.params.id;

    console.log("Get Order by ID Route reached with orderId:", orderId, "and userId:", userId)

    try {
        const [order] = await db.execute(
            `SELECT * FROM orders WHERE user_id=? AND order_id=?`, [userId, orderId]
        )

        console.log("Order fetched from DB:", order)

        if (order.length === 0) {
            return res.status(404).json({
                message: "No orders found"
            });
        }

        // console.log(order)

        return res.status(200).json({
            message: "Order fetched successfully",
            order: order
        })

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }



}

async function getMyOrder(req, res) {

    const userId = req.user.id;

    try {
        const [Orders] = await db.execute(
            `SELECT * FROM orders WHERE user_id=?`,
            [userId]
        );

        if (Orders.length === 0) {
            return res.status(404).json({
                message: "No Orders found"
            });
        }

        // console.log("Orders:", Orders);

        return res.status(200).json({
            message: "Order fetched successfully",
            Orders: Orders
        });

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
}

async function cancelMyOrderById(req, res) {
    const userId = req.user.id;
    const orderId = req.params.id;

    try {

        const [orderStatus] = await db.execute(
            `SELECT status FROM orders WHERE user_id=? AND order_id=?`, [userId, orderId]
        )

        if (!orderStatus.status == "PENDING") {
            return res.status(200).json({ message: "Order can not be cancelled" })
        }


        const [order] = await db.execute(
            `DELETE FROM orders WHERE user_id=? AND order_id=?`, [userId, orderId]
        )

        // console.log(order)

        return res.status(200).json({
            message: "Order cancelled successfully"
        })

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }
}

// async function updateOrderAddress(req,res){

//     const userId = req.user.id;
//     const orderId = req.params.id;

//     try {

//          const [orderStatus] = await db.execute(
//             `SELECT status FROM orders WHERE user_id=? AND order_id=?`, [userId, orderId]
//         )

//         if(!orderStatus.status=="PENDING"){
//             return res.status(200).json({message:"Order can not be cancelled"})
//         }


//         const [order] = await db.execute(
//             `DELETE FROM orders WHERE user_id=? AND order_id=?`, [userId, orderId]
//         )

//         // console.log(order)

//         return res.status(200).json({
//             message: "Order cancelled successfully"
//         })

//     } catch (err) {
//         return res.status(500).json({
//             message: "Internal server error",
//             error: err.message
//         })
//     }
// }


module.exports = { createOrder, getMyOrder, getMyOrderById, cancelMyOrderById }