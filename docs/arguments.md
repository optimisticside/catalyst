# Arguments
Arguments allow you to pass information to commands. There are different types of arguments, such as text, integers, channels, and users. Sometimes an argument is is required to run a command, but they can also be optional. Arguments can have choices too, where you have to choose from a list of options.

# Prompting
If a command request is sent but all required arguments are not provided, then Catalyst will ask you to provide it with the arguments in a prompt. This is done to create a smoother, more human-like experience. An example of this is in the `echo` command, which replies with the text you send. If no arguments are provided, there is nothing to say and the bot will ask you to tell it something to say. This is easier than just being told to run the command all over again, but with a message.

# Types
There are many different types of arguments. These are done to make the job of the individual command easier. The argument types are as follow:

- text: This can be any text.
- integer: These can only be integers, meaning they cannot have decimals. When used in the chat, they can also be in hexadecimal or exponential form.
- number: These can be any number at all. When used in the chat, they can also be in hexadecimal or exponential form.
- time: This is used to represent a time interval. An example of this is `5h30m`, which is 5 hours and 30 minutes. Time intervals are as follows: `s` for seconds, `m` for minutes, `h` for hours, `d` for days, `w` for weeks, `y` for years.
- boolean: This is use to represent an on-off value. On is `yes`, `on`, or `true`. Off is `no`, `off`, or `false`.
- user: These are mentioned users.
- member: These are users that are in the guild.
- channel: These are channels in the guild.
- role: These are roles in the guild.
- mentionable: These are anything mentionable, which includes `@everyone` and `@here` (they aren't technically roles, but they are mentionable).