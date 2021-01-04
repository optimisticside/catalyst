class ReadyHandler {
    execute() {
        this.catalyst.log("Client", "Ready");

        this.catalyst.log("Client", `Logged in as ${this.catalyst.client.user.tag}`);
	    this.catalyst.client.user.setActivity("Being a bot", { type: "WATCHING" });
    }

    onConnect() {
        this.catalyst.log("Ready handler", "Waiting for ready");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
    }
};

module.exports = ReadyHandler;