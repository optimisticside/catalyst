/**
 * ping command
 * @param catalyst the framework
 * @param message the message that called the command
 * @param args any arguments provided in the message
 */
async function run(catalyst, message, args) {
    /* send a message */
    message.channel.send(`Pinging...`).then(reply => {
        /* calculate delta time, and edit message accordingly */
        var deltaTime = reply.createdAt - message.createdAt;
        reply.edit(`🏓 Pong! Took ${deltaTime} ms.`);
    });
};

module.exports = {
    name: "ping",
    aliases: ["pingTest", "getPing"],
    permissions: ["SEND_MESSAGES"],
    run = run
};