export function generate(ast) {
  const code = ast ? genElement(ast) : '_c("div")';
  return `with(this){return ${code}}`;
}

function genElement(el) {
  let data = genData(el);
  const children = el.inilineTemplate ? null : genChildren(el, true);
  code = `_c('${el.tag}')`;
}
