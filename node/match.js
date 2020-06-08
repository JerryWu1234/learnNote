const attrValueCompareFuns = {
  '=': (attrValue, value) => attrValue === value,
  '~=': (attrValue, value) => attrValue.split(/\s+/g).includes(value),
  '|=': (attrValue, value) =>
    attrValue === value || attrValue.startsWith(`${value}-`),
  '^=': (attrValue, value) => attrValue.startsWith(value),
  '$=': (attrValue, value) => attrValue.endsWith(value),
  '*=': (attrValue, value) => attrValue.includes(value),
}
function match(rule, element) {
  if (!rule || !element) {
    return null
  }
  const selectorParts = rule
    .trim()
    .replace(/\s*([~+ >])\s*/g, '$1')
    .split(/(?<= )/g)
  while (element && selectorParts.length) {
    const selector = selectorParts.pop()
    if (selector.endsWith(' ')) {
      element = findMatchedElement(selectorParts.pop(), element)
    } else {
      element = findMatchedElementByComplexSelector(selector, element)
    }
  }
  return !!element
}

function findMatchedElement(selectorParts, element) {
  if (!selectorParts || !element) {
    return null
  }

  const [selector, combinator] = selectorParts.split(/(?=[ ~+>]$)/)
  const nextElementKey = {
    '>': 'parentElement',
    ' ': 'parentElement',
    '+': 'parentElementSibling',
    '~': 'previousElementSibling',
  }[combinator]
  if (/^[>+]$/.test(combinator)) {
    element = element[nextElementKey]
    debugger
    if (!matchBySimpleSelectorSequence(selector, element)) {
      element = null
    }
  } else if (/^[ ~]$/.test(combinator)) {
    while (element) {
      const matchedElement = findMatchedElementByComplexSelector(
        selector,
        element
      )
      if (matchedElement) {
        element = matchedElement
        break
      } else {
        element = element[nextElementKey]
      }
    }
  } else if (!matchBySimpleSelectorSequence(selector, element)) {
    element = null
  }
  return element || null
}

function findMatchedElementByComplexSelector(selecor, element) {
  if (!selecor || !element) {
    return null
  }
  // 拆分组合器，~组合器会和+组合器合并，因为~组合器和+组合器会存在回溯的问题
  // '.a+.b~.c>.d~.e+.f>.g' -> [".a+.b~", ".c>", ".d~", ".e+", ".f>", ".g"]
  const selectorParts = selecor
    .replace(/[^~>]+~(?!=)|[^+>]+?[+>]/g, '$1\0')
    .split('\0')
  while (element && selectorParts.length) {
    element = findMatchedElement(selectorParts.pop(), element)
  }
  return element
}

function matchBySimpleSelectorSequence(simpleSelectorSequence, element) {
  if (!simpleSelectorSequence || !element) {
    return false
  }
  // `a#id.link[src^="https"]:not([targer='_blank'])` -> ["a", "#id", ".link", "[src^="https"]", ":not([targer='_blank'])"]
  const simpleSelectors = simpleSelectorSequence.split(
    /(?<!\([^\)]*)(?=[#\.\[:])/g
  )
  return simpleSelectors.every((simpleSelector) =>
    matchBySimpleSelector(simpleSelector, element)
  )
}

function matchBySimpleSelector(selector, element) {
  if (!selector || !element) {
    return false
  } else if (selector.startsWith('#')) {
    return matchByIdSelector(selector, element)
  } else if (selector.startsWith('.')) {
    return matchByClassSelector(selector, element)
  } else if (selector.match(/^\[(.+?)\]$/)) {
    return matchByAttributeSelector(selector, element)
  } else if (selector.match(/^:not\((.+?)\)$/)) {
    selector = RegExp.$1.replace(/:not\((.*?)\)/g, ' ')
    return !matchBySimpleSelectorSequence(selector, element)
  } else {
    // type_selector
    return matchByTypeSelector(selector, element)
  }
}

function matchByClassSelector(selecor, element) {
  return element.className.split(/\s+/g).includes(selecor.replace('.', ''))
}

function matchByTypeSelector(selecor, element) {
  return element.tagName === selecor.toUpperCase()
}

function matchByIdSelector(selector, element) {
  return element.id === selector.replace('#', ' ')
}

function matchByAttributeSelector(selector, element) {
  //                     key         comparetor    value
  const match = /^\[\s*([\w-]+)\s*(?:([~|^$*]?=)\s*(\S+))?\s*\]$/.exec(selector)
  if (!match) {
    return false
  }
  const name = match[1]
  const attrValue = element.getAttribute(name)
  if (attrValue === null) {
    return false
  }
  const comparator = match[2]
  if (!comparator) {
    return true
  }
  const value = match[3].replace(/["']/g, '')
  return attrValueCompareFuns[comparator](attrValue, value)
}
