// @ts-check

"use strict";

// Asynchronous Imports
process.stdout.write("Importing modules...\n");
require("./sources/asynchronousModules.js").asynchronousImports().then(async asynchronousExports => {
    // Imports
    const { chalk, stringWidth } = asynchronousExports;
    const nodeFS = require("node:fs");
    const nodePath = require("node:path");
    const presets = require("./sources/presets.json");
    const terminalInterface = require("./sources/terminalInterface.js");

    // Parses Assets
    process.stdout.write(chalk.green("Fetching assets...\n"));
    let assets = {};
    let assetsPath = nodePath.resolve(__dirname, "assets/");
    let assetsFiles = nodeFS.readdirSync(assetsPath);
    for(let i = 0; i < assetsFiles.length; i++) {
        let assetsFile = assetsFiles[i];
        assets[assetsFile.split(".").slice(0, -1).join(".")] =
            nodeFS.readFileSync(nodePath.resolve(assetsPath, assetsFile)).toString();
    };

    // Parses Save
    process.stdout.write(chalk.green("Fetching save file...\n"));
    let savePath = nodePath.resolve(__dirname, "save.json");
    if(!nodeFS.existsSync(savePath)) {
        process.stdout.write(chalk.red("File not found! Generating save file..."));
        nodeFS.writeFileSync(savePath, nodeFS.readFileSync(nodePath.resolve(__dirname, "sources/save.json")).toString());
    };
    let save = JSON.parse(nodeFS.readFileSync(savePath).toString());
    
    // Variables
    let blank = new Array(presets.minimumColumns * presets.minimumRows).fill(" ");
    let cache = new Map();
    let [ displayColumns, displayRows ] = terminalInterface.getSize();
    let displaySatisfied = isDisplaySatisfied(displayColumns, displayRows);
    let frame = [ ...blank ];
    let inputQueue = new Array(save.inputQueue);
    let render = [ ...blank ];
    let scene = "start";
    let startTimestamp = Date.now();

    // Input Event
    terminalInterface.controls.on("input", input => {
        if(inputQueue.length > save.inputQueue) inputQueue = inputQueue.slice(inputQueue.length - save.inputQueue);
        inputQueue.push(input);
    });

    // Resize Event
    terminalInterface.controls.on("resize", (columns, rows) => {
        terminalInterface.clear();
        [ displayColumns, displayRows ] = [ columns, rows ];
        displaySatisfied = isDisplaySatisfied(displayColumns, displayRows);
        frame = [ ...blank ];
        checkDisplaySize();
    });

    // Displays Terminal
    terminalInterface.clear();
    checkDisplaySize();
    setInterval(() => {
        // Fetches Input
        let input = inputQueue.length ? inputQueue.shift() : null;
        if(input && input.name === save.controls.exit) process.exit();

        // Renders Scene
        if(!displaySatisfied) return;
        switch(scene) {
            case "start": {
                let title = assets.title.split("\n").map(v => " ".repeat(Math.floor((presets.minimumColumns - 80) / 2)) + v);
                let choices = [ "Continue", "New Game", "Settings", "Exit" ];
                if(!cache.has("start_index")) cache.set("start_index", 1);
                if(!cache.has("start_save_init")) cache.set("start_save_init", !!save.username);
                if(input) {
                    let startIndex = cache.get("start_index");
                    if(input.name === save.controls.up && (startIndex - 1) > +(!cache.get("start_index")))
                        cache.set("start_index", startIndex - 1);
                    else if(input.name === save.controls.down && (startIndex + 1) < choices.length)
                        cache.set("start_index", startIndex + 1);
                    else if(input.name === save.controls.select) {
                        switch(startIndex) {
                            case 1: {
                                scene = "test";
                                break;
                            };
                            case 2: {
                                scene = "settings";
                                break;
                            };
                            case 3: process.exit();
                            default: break;
                        };
                    };
                };
                for(let i = 0; i < title.length; i++) render.splice((i + 5) * presets.minimumColumns, title[i].length, ...title[i]);
                for(let i = 0; i < choices.length; i++) {
                    let choiceRaw = choices[i];
                    let choice = [];
                    let padding = " ".repeat(3 - (getTick() % 3));
                    if(i === 0 && !cache.get("start_save_init")) choice = choiceRaw.split("").map(v => chalk.blackBright(v));
                    else if(i === cache.get("start_index")) choice = `>${padding} ${choiceRaw} ${padding}<`.split("").map(v => chalk.yellowBright(v));
                    else choice = choiceRaw.split("");
                    choice = new Array(Math.floor((presets.minimumColumns - choice.length) / 2)).fill(" ").concat(choice);
                    render.splice((i + 30) * presets.minimumColumns, choice.length, ...choice);
                };
                break;
            };
            default: break;
        };

        // Displays Render
        let renderString = "";
        let renderIndex = 0;
        let renderDifferences = [];
        for(let i = 0; i < presets.minimumColumns * presets.minimumRows; i++) {
            if(renderString && (!(i % presets.minimumColumns) || render[i] === frame[i])) {
                renderDifferences.push({ index: renderIndex, string: renderString });
                renderString = "";
            };
            if(render[i] !== frame[i]) {
                if(!renderString) renderIndex = i;
                renderString += render[i];
            };
        };
        if(renderString) renderDifferences.push({ index: renderIndex, string: renderString });
        for(let i = 0; i < renderDifferences.length; i++) {
            let renderDifference = renderDifferences[i];
            terminalInterface.moveCursor(renderDifference.index % presets.minimumColumns, Math.floor(renderDifference.index / presets.minimumColumns));
            process.stdout.write(renderDifference.string);
        };
        frame = render;
        render = [ ...blank ];
    }, 1000 / presets.framerate);

    // Functions
    function checkDisplaySize() {
        if(!displaySatisfied && displayColumns >= presets.requiredColumns && displayRows >= presets.requiredRows) {
            let title = chalk.yellowBright("Display is too small!");
            let minimumColumns = (
                displayColumns >= presets.minimumColumns ?
                chalk.greenBright :
                chalk.redBright
            )(`${displayColumns} / ${presets.minimumColumns}`);
            let minimumRows = (
                displayRows >= presets.minimumRows ?
                chalk.greenBright :
                chalk.redBright
            )(`${displayRows} / ${presets.minimumRows}`);
            let subtitle = `Minimum: ${minimumColumns} x ${minimumRows}`;
            process.stdout.write("\n".repeat(Math.floor(displayRows / 2 - 1)));
            process.stdout.write(" ".repeat(Math.floor((displayColumns - stringWidth(title)) / 2)) + title + "\n");
            process.stdout.write(" ".repeat(Math.floor((displayColumns - stringWidth(subtitle)) / 2)) + subtitle + "\n");
        };
    };

    function isDisplaySatisfied(columns, rows) {
        return columns >= presets.minimumColumns && rows >= presets.minimumRows;
    };

    function getTick() {
        return Math.floor((Date.now() - startTimestamp) / presets.framerate);
    };
});