const express=require('express');
const {connect,subscribeToQueue}=require('./broker/broker');
const listener=require('./broker/listener');


const app=express();

connect().then(()=>{
    listener();
}).catch((error)=>{   
    console.error("Failed to connect to RabbitMQ:",error);
})


app.get('/',(req,res)=>{
    res.send("Notification service is up and running");
}); 



module.exports=app;