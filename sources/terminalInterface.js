// @ts-check

"use strict";

// Imports
const NodeEvents = require("node:events");
const nodeReadline = require("node:readline");

// Configurations
nodeReadline.emitKeypressEvents(process.stdin);
process.stdin.setEncoding("utf-8");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdout.write("\x1b[?25l");

// Events
let controls = new NodeEvents();
process.stdin.on("keypress", (string, key) => controls.emit("input", { string, ...key }));
process.stdout.on("resize", () => controls.emit("resize", ...getSize()));

// Functions
/**
 * Clears the entire terminal
 * @param {boolean} stationary Clear from current cursor position
 */
function clear(stationary = false) {
    if(!stationary) nodeReadline.cursorTo(process.stdout, 0, 0);
    nodeReadline.clearScreenDown(process.stdout);
};

/**
 * Clears the current line
 * @param {nodeReadline.Direction} direction Direction to clear
 */
function clearLine(direction = 0) {
    nodeReadline.clearLine(process.stdout, direction);
};

/**
 * Fetches the current position of the cursor
 * @returns {Promise<[ number, number ]>} Returns the current position of the cursor
 */
function getCursor() {
    return new Promise(resolve => {
        // @ts-ignore
        process.stdin.once("readable", () => resolve(JSON.stringify(process.stdin.read()).match(/\d+;\d+/)[0].split(";").map(v => Number(v))));
        process.stdout.write("\u001b[6n");
    });
};

/**
 * Fetches the size of the current terminal
 * @returns {[ number, number ]} Returns the size of the current terminal
 */
function getSize() {
    return process.stdout.getWindowSize();
};

/**
 * Moves the cursor to a new position
 * @param {number} x Horizontal coordinate
 * @param {number} y Vertical coordinate
 */
function moveCursor(x, y) {
    nodeReadline.cursorTo(process.stdout, x, y);
};

/**
 * Shifts the cursor to a new position relatively
 * @param {number} x Horizontal shift
 * @param {number} y Vertical shift
 */
function shiftCursor(x, y) {
    nodeReadline.moveCursor(process.stdin, x, y);
};


// Exports
module.exports = {
    clear,
    clearLine,
    controls,
    getCursor,
    getSize,
    moveCursor,
    shiftCursor
};