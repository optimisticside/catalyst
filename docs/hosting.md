# Hosting
Catalyst can be hosted on your local device. You'll first want to install Node.js, which you can do [here](https://nodejs.org/en/). Additionally, you will also need to install Redis. Catalyst uses Redis to store data. You can install it [here](https://redis.io/topics/quickstart).

Once you have installed Node.js and Redis, you will need to download the repository on your device. You can do this through the GitHub website (by downlaoding and extracting the ZIP file), or through the command-line by doing `git clone https://github.com/optimisticside/catalyst`.

Once the repository has been downloaded to your device, you need to install all the packages required to run Catalyst. Catalyst only has a few dependencies, so this should not take too long. You can do this by entering `npm install` in the command-line (once you've changed into the repository's directory).

Now you need to set up the configuration file. Go to the `src` folder and clone `config.template.json`. Rename this cloned file `config.json`. This is the file the bot will use to get configuration information. Refer to `Config` section below for more information regarding this.

Once you've done all of the above, all you have to do is start the Redis server and run `npm start`. This will start running Catalyst. Congratulations, you are now self-hosting Catalyst!