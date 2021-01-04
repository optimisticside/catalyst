/**
 * test command
 * @param catalyst the framework
 * @param message the message that called the command
 * @param args any arguments provided in the message
 */
async function run(catalyst, message, args) {
    message.channel.send("Hello World!");
};

module.exports = {
    name: "test",
    permissions: ["SEND_MESSAGES"],
    run = run
};