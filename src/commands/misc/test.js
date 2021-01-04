class TestCommand {
    /**
     * test command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* send a message */
        message.channel.send("Hello World!");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;

        this.name = "test";
    }
};

module.exports = TestCommand;