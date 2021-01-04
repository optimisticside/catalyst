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
        return fs.readdir(dirPath, (err, files) => {
            if (err) return this.error("Framework", `Unable to read directory ${dirPath}: ${err}`);

            return files.filter((file) => {
                return fileTypes.indexOf(path.extname(file)) != -1;

            }).forEach(file => {
                var fileName = destination[path.basename(file, path.extname(file))];
                var filePath = path.join(dirPath, file);

                if (fs.statSync(filePath).isFile() && fileTypes.indexOf(path.extname(file)) != -1) {
                    this.executeFile(filePath).then(data => {
                        destination[fileName] = data;

                    }).catch(err => {
                        this.log("Framework", `Unable to require ${filePath}: ${err}`);
                    });

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
        for (var [name, module] of Object.entries(this.modules)) {
            if (typeof module == "object") {
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

        this.log("Framework", "Loading modules");
        this.setupModules().then(() => {
            this.log("Framework", "Initializing modules");

            this.initModules().then(() => {
                this.log("Framework", "Logging in client");
                this.client.login(this.config.TOKEN);
            });
        });
    }
};

config();
var catalyst = new Catalyst();