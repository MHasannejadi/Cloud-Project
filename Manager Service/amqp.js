const amqp = require("amqplib");

async function createChannel() {
  const connection = await amqp.connect(
    "amqps://edafwaiw:nTSF2E9L5Pdl4SJGkAtgM-r7pLznYvWm@hummingbird.rmq.cloudamqp.com/edafwaiw"
  );
  const channel = await connection.createChannel();
  await channel.assertQueue("jobs", { durable: true });

  return channel;
}

module.exports = createChannel;