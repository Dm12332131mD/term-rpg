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
    let [ displayColumns, displayRows ] = terminalInterface.getSize(); 
    let displaySatisfied = isDisplaySatisfied(displayColumns, displayRows);
    let frame = new Array(presets.minimumColumns * presets.minimumRows);
    let render = new Array(presets.minimumColumns * presets.minimumRows);
    let scene = "start";

    // Key-press Event
    terminalInterface.controls.on("key", key => {
        if(key.name === save.controls.exit) process.exit();
    });

    // Resize Event
    terminalInterface.controls.on("resize", (columns, rows) => {
        terminalInterface.clear();
        [ displayColumns, displayRows ] = [ columns, rows ];
        displaySatisfied = isDisplaySatisfied(displayColumns, displayRows);
        frame = new Array(presets.minimumColumns * presets.minimumRows);
        checkDisplaySize();
    });

    // Displays Terminal
    terminalInterface.clear();
    checkDisplaySize();
    let a = 1;
    setInterval(() => {
        // Renders Scene
        if(!displaySatisfied) return;
        switch(scene) {
            case "start": {
                let title = assets.title.split("\n").map(v => " ".repeat(Math.floor((presets.minimumColumns - 80) / 2)) + v);
                for(let i = 0; i < title.length; i++) render.splice((i + 5) * presets.minimumColumns, title[i].length, ...title[i]);
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
        render = new Array(presets.minimumColumns * presets.minimumRows);
        // process.exit();
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
});