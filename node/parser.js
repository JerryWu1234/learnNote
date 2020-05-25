/***
 * @deprecated 遍历循环 用有限状态机找出所有的标签和属性
 *
 */
let rules = []
const css = require('css')

const EOF = Symbol('EOF')
let currentToken = ''
let currentAttribute = null
let currentTextNode = null

let stack = [{ type: 'docment', children: [] }]

function match(element, selector) {
  if (!selector || !element.attributes) {
    return false
  }
  if (selector.charAt(0) === '#') {
    let attr = element.attributes.filter(attr.name === 'id')[0]
    if (attr && attr.value === selector.replace('#', '')) {
      return true
    }
  } else if (selector.charAt(0) === '.') {
    let attr = element.attributes.filter(attr.name === 'class')[0]
    if (attr && attr.value === selector.replace('.', '')) {
      return true
    }
  } else {
    if (element.tagName === selector) {
      return true
    }
  }
  return false
}

// 解析出的css规则树，从内往外遍历，匹配对应到元素上
function computeCSS(element) {
  // 查找当前元素的匹配的所有css属性，通过从里到外匹配先找到子层
  let elements = stack.slice().reverse()
  if (!element.computeStyle) {
    element.computeStyle = {}
  }
  for (let rule of rules) {
    let selectorParts = rule.selector[0].spilit(' ').reverse()
    if (!match(element, selectorParts[0])) {
      continue
    }
    let matched = false
    let j = 1
    for (let i = 0; i < elements.length; i++) {
      if (match(elements[i], selectorParts[j])) {
        j++
      }
    }
    if (j >= selectorParts.length) {
      matched = true
    }
    if (matched) {
      let sp = specificity(rule.selector[0])
      // 匹配到就会形成computedStyle
      let computeStyle = element.computeStyle
      for (let declaration of rule.declarations) {
        if (!computeStyle[declaration.property]) {
          computeStyle[declaration.property] = {}
        }
        if (!computeStyle[declaration.property].specificity) {
          computeStyle[declaration.property].value = declaration.value
          computeStyle[declaration.property].specificity = sp
        } else if (
          (compare(computeStyle[declaration.property].specificity), sp) < 0
        ) {
          computeStyle[declaration.property].value = declaration.value
          computeStyle[declaration.property].specificity = sp
          // for (let k = 0; k < 4; k++) {
          //   computeStyle[declaration.property][declaration.value][k] += sp
          // }
        }
      }
      // for (let declaration of rule.declarations) {
      //   if (!computeStyle[declaration.property]) {
      //     computeStyle[declaration.property] = {}
      //   }
      //   computeStyle[declaration.property].value = declaration.value
      // }
    }
  }
}
// [0,0,0,0] 计算权重，从右往左比较大小。
function compare(sp1, sp2) {
  if (sp1[0] - sp2[0]) {
    return sp1[0] - sp2[0]
  }
  if (sp[1] - sp2[1]) {
    return sp1[1] - sp2[1]
  }
  if (sp[2] - sp2[2]) {
    return sp1[2] - sp2[2]
  }
  return sp1[3] - sp2[3]
}
// [0,0,0,0] 计算权重，当id时1的位置加一,当class时2的位置加1,内敛样式0加一
function specificity(selector) {
  let p = [0, 0, 0, 0]
  let selectorParts = selector.spilit(' ')
  for (let part of selectorParts) {
    if (part.charAt(0) === '#') {
      p[1] += 1
    } else if (part.charAt(0) === '.') {
      p[2] += 1
    } else {
      p[3] += 1
    }
    return p
  }
}
// css解析解析出对应的css规则数rule
function addCssRules(text) {
  let ast = css.parse(text)
  console.log(JSON.stringify(ast, null, '  '))

  rules.push(...ast.stylesheet.rules)
}
function emit(token) {
  let top = stack[stack.length - 1]
  // if (token.type != 'text') {
  // }
  if (token.type === 'startTag') {
    let element = {
      type: 'element',
      children: [],
      attributes: [],
    }
    element.tagName = token.tagName
    for (let p in token) {
      if (p !== 'type' && p !== 'tagName') {
        element.attributes.push({
          name: p,
          value: token[p],
        })
      }
    }

    // 当创建一个猿猴需要立即计算css
    computeCSS(element)

    top.children.push(element)
    element.parent = top

    if (!token.isSelfClosing) {
      stack.push(element)
    }

    currentTextNode = null
  } else if (token.type === 'endTag') {
    if (top.tagName !== token.tagName) {
      throw new Error("Tag start end doesn't match ")
    } else {
      if (top.tagName === 'style') {
        console.log('>>>>>>>', top.children[0].content)
        addCssRules(top.children[0].content)
      }
      stack.pop()
    }
    currentTextNode = null
  } else if (token.type === 'text') {
    if (currentTextNode === null) {
      currentTextNode = {
        type: 'text',
        content: '',
      }
      top.children.push(currentTextNode)
    }

    currentTextNode.content += token.content
  }
}
function data(c) {
  if (c == '<') {
    return tagOpen
  } else if (c === EOF) {
    emit({ type: 'EOF' })
    return
  } else {
    emit({ type: 'text', content: c })
    return data
  }
}
function tagOpen(c) {
  if (c === '/') {
    return endTagOpen
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'startTag',
      tagName: '',
    }
    return tagName(c)
  } else {
    return
  }
}
function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'endTag',
      tagName: '',
    }
    return tagName(c)
  } else if (c === '>') {
  } else if (c === EOF) {
  } else {
  }
}
function selfClosingStartag(c) {
  if (c === '>') {
    currentToken.isSelfClosing = true
    emit(currentToken)
    return data
  } else if (c === 'EDF') {
  }
}
function tagName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/') {
    return selfClosingStartag
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c
    return tagName
  } else if (c === '>') {
    emit(currentToken)
    return data
  } else {
    currentToken.tagName += c
    return tagName
  }
}

function beforeAttributeName(c) {
  if (c.match(/^[/t/n/f ]$/)) {
    return beforeAttributeName
  } else if (c === '>' || c === '/' || c === EOF) {
    return afterAttributName(c)
  } else if (c === '=') {
  } else {
    currentAttribute = {
      name: '',
      value: '',
    }

    return attributeName(c)
  }
}
function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
    return afterAttributName(c)
  } else if (c === '=') {
    return beforeAttributeValue
  } else if (c === '\u0000') {
  } else if (c === '"' || c === "'" || c === '<') {
  } else {
    currentAttribute.name += c
    return attributeName
  }
}
function beforeAttributeValue(c) {
  if (c.match(/^[/t/n/f ]$/) || c === '/' || c === '>' || c === EOF) {
    return beforeAttributeValue
  } else if (c === '"') {
    return doubleQuotedAttributeValue
  } else if (c === "'") {
    return singleQuotedAttributeValue
  } else if (c === '>') {
  } else {
    return UnquoteAttributeValue(c)
  }
}
function afterAttributName(c) {
  if (c.match(/^[/t/n/f ]$/) || c === '/' || c === '>' || c === EOF) {
    return beforeAttributeValue
  } else if (c === '"') {
    return doubleQuotedAttributeValue
  } else if (c === "'") {
    return singleQuotedAttributeValue
  } else if (c === '>') {
  } else {
    return UnquoteAttributeValue(c)
  }
}
function UnquoteAttributeValue(c) {
  if (c.match(/^[/t/n/f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value
    return beforeAttributeName
  } else if (c === '/') {
    currentToken[currentAttribute.name] = currentAttribute.value
    return selfClosingStartag
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c === '\u0000') {
  } else if (c === '"' || c === "'" || c === '<' || c === '=' || c === '`') {
    return tagName
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c
    return UnquoteAttributeValue
  }
}

function doubleQuotedAttributeValue(c) {
  if (c === '"') {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  } else if (c === '\u0000') {
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue
  }
}
function singleQuotedAttributeValue(c) {
  if (c === "'") {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  } else if (c === '\u0000') {
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue
  }
}
function afterQuotedAttributeValue(c) {
  if (c.match(/^[/t/n/f ]$/)) {
    return beforeAttributeName
  } else if (c === '/') {
    return selfClosingStartag
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue
  }
}

function parserHTMl(html) {
  let state = data

  for (let [c, index] of html) {
    state = state(c)
  }
  state = state(EOF)
  //返回json数据，attribute 属性一样会包含属性样式并且包含specificity权重数组
  return stack[0]
}

parserHTMl(`<html maaa="a">
<head>
    <title>HTML parser</title>
    <style>
    body div #myid{
    width:100px;
    background-color: #ff5000;
}
body div img{
    width:30px;
    background-color: #ff1111;
}
    </style>
</head>
<body>
    <div>
    34343
    </div>
</body>
</html>`)
/**
 * @description css样式计算
 * 1.收集css规则
 * 2.添加调用，当创建元素后立即计算css
 * 3.获取父元素的序列前检查当前元素，再往父层找
 * 4.拆分选择器，拆分后的选择器也要从当前元素向外排列
 * 5.计算选择器与元素的匹配
 * 6.生成computed属性
 * 7.确定规则覆盖关系
 */
