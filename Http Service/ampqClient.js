const amqp = require("amqplib/callback_api");
const { ampqUrl } = require("./config");

async function sendIdToQueue(id) {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect(ampqUrl);
    const channel = await connection.createChannel();

    // Declare the queue
    const queueName = "jobs";
    await channel.assertQueue(queueName, { durable: true });

    // Send the ID to the queue
    const message = Buffer.from(id);
    await channel.sendToQueue(queueName, message, { persistent: true });

    console.log(`ID ${id} sent to queue ${queueName}`);

    // Close the connection
    await channel.close();
    await connection.close();

  } catch(err) {
    console.error(err);
    throw new Error("Error sending message to queue");
  }
}

module.exports = { sendIdToQueue };
