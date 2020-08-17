const { getAST, transform, getDependencies } = require("./parser");
const path = require("path");
const ast = getAST(path.join(__dirname, "../src/index.js"));
console.log(transform(ast));
