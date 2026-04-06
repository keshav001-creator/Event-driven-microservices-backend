const { subscribeToQueue } = require("./broker");
const db=require("../config/mySql")

module.exports = async function listener() {

    const { subscribeToQueue } = require("./broker");   

    subscribeToQueue("payment_cart_queue", async (data) => {
        const userId = data.userId;
        try {
            await db.execute(
                `DELETE FROM cart WHERE user_id=?`, [userId]
            )
        } catch (err) {
            console.error("Error clearing cart:", err);
        }
    })

}