class EventsModule {
    /**
     * connects to an event in the client
     * @param name the name of the event
     * @param listener the function to be executed upon event fire
     */
    async addListener(name, listener) {
        if (!this.catalyst.client) return;
        return this.catalyst.client.on(name, (...params) => {
            return listener(this.catalyst, params);
        });
    }

    /**
     * sets up event listeners in a directory
     * @param folder the directory to set up event liteners in
     */
    async setupListeners(path) {
        this.catalyst.setupDirectory(path || "../events", this.listeners, [".js", ".mjs"]);
        for (const [event, listener] of Object.entries(this.listeners)) {
            this.addListener(event, listener)
        }
    };

    /**
     * module initialization process
     */
    async init() {
        this.setupListeners();
        this.catalyst.log("Events", "Loaded");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
        this.listeners = {};

        catalyst.log("Events", "Loading");
    }
};