class MessageHandler {
    /**
     * executes whenever a message is sent
     * @param message the message that was sent
     */
    execute(message) {
        return this.catalyst.modules.commands.handleMessage(message);
    }

    /**
     * executes once connected to the message event
     */
    onConnect() {
        this.catalyst.log("Message handler", "Listening for messages");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
    }
};

module.exports = MessageHandler;