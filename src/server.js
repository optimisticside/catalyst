const { Client, Collection } = require("discord.js");
const { config } = require("dotenv");
const path = require("path");
const fs = require("fs");

class Catalyst {
    /**
     * outputs a message to the console
     * @param data the message data
     */
    async log(...data) {
        console.log(data.join(" - "));
    }

    /**
     * outputs an error to the console
     * @param data the error data
     */
    async error(...data) {
        console.error(data.join(" - "));
    }

    /**
     * requires and executes a file
     * @param file the path of the file to execute
     * @returns the file's exports
     */
    async executeFile(file) {
        var result = require(path.join("..", file));
        var type = typeof result;

        /* if it's a function, it's probably a class */
        if (type == "function") {
            result = new result(this, file);
        }

        return result;
    }

    /**
     * sets up members in a directory and puts them in a table
     * @param path the path of the directory to search
     * @param destination the destination table to store the modules
     * @param fileTypes the types of files allowed
     */
    async setupDirectory(dirPath, destination, fileTypes) {
        /* read the directory */
        const files = fs.readdirSync(dirPath);

        /* go through the files */
        const promises = files.map(async file => {
            /* get the file's name and path */
            var fileName = path.basename(file);
            var filePath = path.join(dirPath, file);

            /* make sure entry is a file and has a correct file-type */
            if (fs.statSync(filePath).isFile() && (!fileTypes || fileTypes.indexOf(path.extname(file)) != -1)) {
                /* require the file and add it to the destination accordingly */
                this.log("Core", `Requiring ${filePath}`);
                await this.executeFile(filePath).then(data => {
                    this.log("Core", `Successfully required ${filePath}`);
                    destination[fileName] = data;

                /* handle any errors */
                }).catch(err => {
                    this.log("Core", `Unable to require ${filePath}: ${err}`);
                });

            /* recursively set-up directory if the entry is one */
            } else if (fs.statSync(filePath).isDirectory()) {
                destination[fileName] = {};
                await this.setupDirectory(filePath, destination[fileName]);
            }
        });

        /* yield until finished */
        await Promise.all(promises);
    }

    /**
     * initializes catalyst modules
     */
    async initModules() {
        /* go through modules */
        for (var [name, module] of Object.entries(this.modules)) {
            /* check if module has init function */
            if (typeof module == "object" && module.init) {
                /* initialize module and handle errors accordingly */
                this.log("Core", `Initializing ${name} module`);

                await module.init(this).catch(err => {
                    this.log("Core", `Unable to load module ${name}: ${err}`);
                });
            } else {
                this.log("Core", `No initialization function found in ${name} module`);
            }
        }
    }

    /**
     * sets up all moduels
    */
    async setupModules() {
        return this.setupDirectory("./src/modules", this.modules, [".js", ".mjs"]);
    }

    /**
     * initializes framework
     */
    async init() {
        /* load modules */
        this.log("Core", "Loading modules");
        await this.setupModules();

        /* initialize modules */
        this.log("Core", "Initializing modules");
        await this.initModules();

        /* log into client */
        this.log("Core", "Logging in client");
        this.client.login(this.config.TOKEN);
    }

    constructor(client, env) {
        this.modules = {};
        this.config = env || process.env;

        this.client = client || new Client();

        /* initialize */
        this.init();
    }
};

config();
var catalyst = new Catalyst();