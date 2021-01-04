class EventsModule {
    /**
     * connects to an event in the client
     * @param name the name of the event
     * @param listener the function to be executed upon event fire
     */
    async addListener(name, listener) {
        /* make sure the client exists */
        if (!this.catalyst.client) return;

        /* connect a wrapper function that executes the listener
           with the parameters and the catalyst framework as parameters */
        this.catalyst.log("Events", `Adding listener to ${name} event`);
        return this.catalyst.client.on(name, (...params) => {
            return listener(this.catalyst, params);
        });
    }

    /**
     * sets up event listeners in a directory
     * @param folder the directory to set up event liteners in
     */
    async setupListeners(path) {
        /* add listeners */
        await this.catalyst.setupDirectory(path || "./src/events", this.listeners, [".js", ".mjs"]);

        /* create functions to handle nested tables recursively */
        function setupTable(table, handler) {
            for (const [name, listener] of Object.entries(table)) {
                if (typeof listener == "function") {
                    handler(name, listener);
                } else {
                    setupTable(listener, handler);
                }
            }
        }

        /* actually connect the listeners */
        return setupTable(this.listeners, this.addListener);
    }

    /**
     * module initialization process
     */
    async init() {
        await this.setupListeners();
        this.catalyst.log("Events", "Loaded");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
        this.listeners = {};
    }
};

module.exports = EventsModule;