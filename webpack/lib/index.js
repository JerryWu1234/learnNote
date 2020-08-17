const Compiler = require("./compiler");
const options = require("../simplepack.config");
const compilerFun = new Compiler(options);

compilerFun.run();
