module.exports = (catalyst) => {
    catalyst.log("Client", "Ready");

    catalyst.log("Client", `Logged in as ${catalyst.client.user.tag}`);
	catalyst.client.user.setActivity("Being a bot", { type: "WATCHING" });
}