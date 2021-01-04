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
            type = new result(this, file);
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
        return fs.readdir(dirPath, (err, files) => {
            /* handle any errors accordingly */
            if (err) return this.error("Framework", `Unable to read directory ${dirPath}: ${err}`);

            /* go through the files */
            return files.forEach(file => {
                /* get the file's name and path */
                var fileName = destination[path.basename(file, path.extname(file))];
                var filePath = path.join(dirPath, file);

                /* make sure entry is a file and has a correct file-type */
                if (fs.statSync(filePath).isFile() && (!fileTypes || fileTypes.indexOf(path.extname(file)) != -1)) {
                    /* require the file and add it to the destination accordingly */
                    this.executeFile(filePath).then(data => {
                        destination[fileName] = data;

                    /* handle any errors */
                    }).catch(err => {
                        this.log("Framework", `Unable to require ${filePath}: ${err}`);
                    });

                /* recursively set-up directory if the entry is one */
                } else if (fs.statSync(filePath).isDirectory()) {
                    destination[fileName] = {};
                    this.setupDirectory(filePath, destination[fileName]);
                }
            });
        });
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
                module.init(this).catch(err => {
                    this.log("Framework", `Unable to load module ${name}: ${err}`);
                });
            }
        }
    }

    /**
     * sets up all moduels
    */
    async setupModules() {
        return this.setupDirectory("./src/modules", this.modules, [".js", ".mjs"]);
    }

    constructor(client, env) {
        this.modules = {};
        this.config = env || process.env;

        this.client = client || new Client();

        /* load modules */
        this.log("Framework", "Loading modules");
        this.setupModules().then(() => {
            /* initialize modules */
            this.log("Framework", "Initializing modules");

            this.initModules().then(() => {
                /* log into client */
                this.log("Framework", "Logging in client");

                this.client.login(this.config.TOKEN);
            });
        });
    }
};

config();
var catalyst = new Catalyst();