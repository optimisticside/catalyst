class Queue {
    /**
     * gets the item at the front of the queue
     * @returns the retrieved item (if any)
     */
    pop() {
        var front = this.data[0];

        /* shift data */
        for (var i = 1; i < this.size; i++) {
            this.data[i-1] = this.data[i];
        }

        /* upate size and return front */
        this.size = Math.max(this.size-1, 0);
        return front;
    }

    /**
     * gets the item at the front of the queue without removing it
     * @returns the retrieved item (if any)
     */
    peek() {
        return this.data[0];
    }

    /**
     * adds data to the end of the queue
     * @param element the data to add to the end of the queue
     */
    push(element) {
        this.data[this.size++] = element;
    }

    constructor(initialData) {
        this.data = initialData || [];
        this.size = this.data.length || 0;
    }
};

module.exports = Queue;