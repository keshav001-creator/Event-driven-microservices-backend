const {subscribeToQueue} = require("../broker/broker");
const sendEmail = require("../email");


module.exports=function(){

    subscribeToQueue("auth_notification_queue",async (data)=>{
        const emailTemplate=`
        <h1>Welcome to Our Service, ${data.fullName.firstName} ${data.fullName.lastName}</h1>
        <p>Thank you for registering with us. We're excited to have you on board.</p>
        <p>You have successfully registered with the following details:</p>
        <ul>
            <li><strong>Username:</strong> ${data.username}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Role:</strong> ${data.role}</li>
        </ul>
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <p>Best regards,<br/>The Team</p>
        `;

        await sendEmail(data.email,"Welcome to Our Platform!",`Hello ${data.fullName.firstName} ${data.fullName.lastName}, welcome to our platform!`,emailTemplate);
    }); 

    subscribeToQueue("payment_completed_queue",async (data)=>{
        const emailTemplate=`
        <h1>Payment Confirmation</h1>
        <p>Dear Customer,</p>   
        <p>We are pleased to inform you that your payment has been successfully processed. Here are the details of your transaction:</p>
        <ul>
            <li><strong>Order ID:</strong> ${data.orderId}</li>
            <li><strong>Payment ID:</strong> ${data.paymentId}</li>
            <li><strong>Amount:</strong> ${data.amount} ${data.currency}</li>   
        </ul>
        <p>Thank you for your purchase! If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br/>The Team</p>
        `;  
        await sendEmail(data.email,"Payment Confirmation",`Your payment for order ${data.orderId} has been confirmed!`,emailTemplate);
    });

    subscribeToQueue("payment_failed_queue",async (data)=>{     
        const emailTemplate=`
        <h1>Payment Failed</h1>
        <p>Dear Customer,</p>
        <p>We regret to inform you that your recent payment attempt was unsuccessful. Here are the details of the transaction:</p>
        <ul>
            <li><strong>Order ID:</strong> ${data.orderId}</li>
            <li><strong>Payment ID:</strong> ${data.paymentId}</li>
            <li><strong>Amount:</strong> ${data.amount} ${data.currency}</li>
        </ul>
        <p>Please review your payment details and try again. If you continue to experience issues, feel free to contact our support team for assistance.</p>
        <p>Best regards,<br/>The Team</p>
        `;
        await sendEmail(data.email,"Payment Failed",`Unfortunately, your payment for order ${data.orderId} could not be processed.`,emailTemplate);
    });

}