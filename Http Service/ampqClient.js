const amqp = require("amqplib");
const { amqpUrl } = require("./config");

async function sendIdToQueue(id) {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();

    // Declare the queue
    const queueName = "jobs";
    await channel.assertQueue(queueName, { durable: true });

    // Send the ID to the queue
    const message = Buffer.from(String(id));
    await channel.sendToQueue(queueName, message, { persistent: true });

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (err) {
    console.error(err);
    throw new Error("Error sending message to queue");
  }
}

module.exports = { sendIdToQueue };
