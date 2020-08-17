const vueCompiler = require("./vueCompiler");
import { codegen } from "./codegen";
const parse = vueCompiler.parse;

export function templateToCode(template) {
  const ast = parse(template, {});
  console.log(ast);
  return codegen(ast);
}
