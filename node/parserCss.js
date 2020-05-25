let rules = []
const css = require('css')

module.exports = {
  addCssRules(text) {
    let ast = css.parse(text)
    console.log(JSON.stringify(ast, null, '  '))

    rules.push(...ast.stylesheet.rules)
  },
}
