const ampqlib=require('amqplib');


let channel,connection;

async function connect(){

    if (connection){
        return connection;
    }

    try{
        connection=await ampqlib.connect(process.env.RABBIT_URL);
        channel=await connection.createChannel();
        console.log("Connected to RabbitMQ");
    }catch(error){
        console.error("Error connecting to RabbitMQ:",error);
    }
}

async function publishToQueue(queueName,data={}){

    if (!channel || !connection){ 
        await connect();
    }

    try{
        await channel.assertQueue(queueName,{durable:true});
        channel.sendToQueue(queueName,Buffer.from(JSON.stringify(data)));
        console.log(`Message sent to queue ${queueName}:`,data);

    }catch(error){
        console.error("Error publishing to queue:",error);
    }
}

async function subscribeToQueue(queueName,callback){

    if (!channel || !connection){ 
        await connect();
    }
    
    await channel.assertQueue(queueName,{durable:true});
    channel.consume(queueName,async (msg)=>{
        if (msg !== null){
            const data=JSON.parse(msg.content.toString());
           await callback(data);
            channel.ack(msg);
        }
    });
}



module.exports={
    connect,
    channel,
    connection,
    publishToQueue,
    subscribeToQueue
}