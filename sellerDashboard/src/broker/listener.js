const { subscribeToQueue } = require("../broker/broker")
const db = require("../config/mySql")

module.exports = function () {

    // queue to receive user details from auth service and add into seller_users table
    subscribeToQueue("auth_sellerDashboard_queue", async (data) => {

        try {

            await db.execute(
                `INSERT INTO seller_users
                (user_id, username, email, first_name, last_name)
                VALUES(?,?,?,?,?)`,
                [data.user_id, data.username, data.email, data.fullName.firstName, data.fullName.lastName]
            )
        } catch (error) {
            console.log("Error processing message from auth_sellerDashboard_queue:", error);
        }
    })

    // queue to receive product details from product service and add into seller_product table
    subscribeToQueue("product_sellerDashboard_queue", async (data) => {

        console.log("Received data from product service:", data)
        try {

            await db.execute(
                `INSERT INTO seller_product
                (product_id, title, description, price_amount, price_currency, seller_id, stock)
                VALUES(?,?,?,?,?,?,?)`,
                [data.product_id, data.title, data.description, data.price_amount, data.price_currency, data.seller_id, data.stock]
            )
        } catch (error) {
            console.log("Error processing message from product_sellerDashboard_queue:", error);
        }
    })


// queue to receive order details from order service and add into seller_orders and seller_order_items table
    subscribeToQueue("order_sellerDashboard_queue", async (data) => {
        try {

            const sellerMap = {};

            for (let item of data.items) {
                if (!sellerMap[item.sellerId]) {
                    sellerMap[item.sellerId] = [];
                }
                sellerMap[item.sellerId].push(item);
            }

            for (let sellerId in sellerMap) {

                const items = sellerMap[sellerId];

                const totalAmount = items.reduce(
                    (sum, item) => sum + item.price_amount,
                    0
                );

                const [result] = await db.execute(
                    `INSERT INTO seller_orders
                (order_id, seller_id, user_id, total_amount, total_currency, address_id)
                VALUES (?,?,?,?,?,?)`,
                    [
                        data.order_id,
                        sellerId,
                        data.user_id,
                        totalAmount,
                        data.currency,
                        data.address_id
                    ]
                );

                const sellerOrderId = result.insertId;

                for (let item of items) {
                    await db.execute(
                        `INSERT INTO seller_order_items
                    (seller_order_id, product_id, quantity, price_amount)
                    VALUES (?,?,?,?)`,
                        [
                            sellerOrderId,
                            item.product_id,
                            item.quantity,
                            item.price_amount
                        ]
                    );
                }
            }

        } catch (error) {
            console.log("Error:", error);
        }
    });


    //payment completed queue to update payment status in seller dashboard
    subscribeToQueue("payment_completed_sellerDashboard_queue", async (data) => {

        console.log("Received data from payment service:", data)
        try {

            await db.execute(
                `INSERT INTO seller_payments
                (payment_id, order_id, amount, currency, username, email)
                VALUES(?,?,?,?,?,?)`,
                [data.paymentId, data.orderId, data.amount, data.currency, data.username, data.email]
            )

        } catch (error) {
            console.log("Error processing message from product_sellerDashboard_queue:", error);
        }
    })


}