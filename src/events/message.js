class MessageHandler {
    execute(message) {
        return this.catalyst.modules.commands.handleMessage(message);
    }

    onConnect() {
        this.catalyst.log("Message handler", "Listening for messages");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
    }
};

module.exports = MessageHandler;