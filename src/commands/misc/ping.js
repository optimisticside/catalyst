class PingCommand {
    /**
     * ping command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* send a message */
        message.channel.send(`Pinging...`).then(reply => {
            /* calculate delta time, and edit message accordingly */
            var deltaTime = reply.createdAt - message.createdAt;
            reply.edit(`🏓 Pong! Took ${deltaTime} ms (API latency: ${catalyst.client.ws.ping} ms).`);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "ping";
        this.description = "Pings the bot's connection with the Discord API";
        this.aliases = ["pingTest", "getPing"];
        this.argFormat = null;
    }
};

module.exports = PingCommand;