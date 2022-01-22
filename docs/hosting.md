# Hosting
Catalyst can be hosted on your local device. You'll first want to install Node.js, which you can do [here](https://nodejs.org/en/). Additionally, you will also need to install MongoDB. Catalyst uses MongoDB to store data. You can use MongoDB through MongoDB Atlas, which is hosted in the cloud for free. You can also run MongoDB by by installing it on your computer, which you can do [here](https://www.mongodb.com/try/download/community).

Once you have installed Node.js and MongoDB, you will need to download the repository on your device. You can do this through the GitHub website (by downlaoding and extracting the ZIP file), or through the command-line by doing `git clone https://github.com/optimisticside/catalyst`.

Once the repository has been downloaded to your device, you need to install all the packages required to run Catalyst. Catalyst only has a few dependencies, so this should not take too long. You can do this by entering `npm install` in the command-line (once you've changed into the repository's directory). You will also need to install the TypeScript compiler, which you can do through `npm install -g typescript`.

Now you need to set up the configuration/env file. Go to the directory and create a file called `.env`. This will be an environment-file, and will be where sensitive information and other configuration settings will be kept. Refer to `Config` section below for more information regarding this.

Catalyst is written in Typescript but Node.js only runs Javascript. We can compile Typescript to Javascript by running `tsc`, which will output a lot of stuff, but will compile successfully (if done correctly).

Once you've done all of the above, all you have to do is start the MongoDB server and run `npm start`. This will start running Catalyst. Congratulations, you are now self-hosting Catalyst!