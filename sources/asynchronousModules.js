// @ts-check

"use strict";

// Exports
module.exports = {
    asynchronousExports: {},
    async asynchronousImports() {
        let [
            chalk,
            stringWidth
        ] = await Promise.all([
            import("chalk"),
            import("string-width")
        ]);
        Object.assign(this.asynchronousExports, {
            "chalk": chalk.default,
            "stringWidth": stringWidth.default
        });
        return this.asynchronousExports;
    }
};