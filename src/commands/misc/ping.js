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
            reply.edit(`🏓 Pong! Took ${deltaTime} ms.`);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        this.name = "ping";
        this.aliases = ["pingTest", "getPing"];
        this.argFormat = null;
    }
};

module.exports = PingCommand;