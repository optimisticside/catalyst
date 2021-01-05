/**
 * pauses the thread for some time
 * @param delay the amount of ms to wait before resolving
 * @reutrns the promise that resolves after the delay
 */
const sleep = (delay) => {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

module.exports;