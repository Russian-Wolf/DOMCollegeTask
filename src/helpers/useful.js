/**
 * Returns input as-is if meets predicate's condition, otherwise - returns fallback.
 * @template I,F
 * @param {I} input
 * @param {F} fallback
 * @param {(input: I) => boolean} predicate
 * @returns {I | F}
 */
export function chooseBy(input, fallback, predicate) {
  return predicate(input) ? input : fallback
}

/**
 * @template V
 * @param {string} key Option/parameter/value to select.
 * @param {Object<string, V>} dispatchMap Dispatch map object that contains option -> respective value pairs as key: value pairs.
 * @param {string} [errorMsg] Custom error message. Optional. If none/bad is supplied => generic one will be used instead.
 * @returns {V}
 */
export function safeDispatch(key, dispatchMap, errorMsg = undefined) {
  if (!Object.hasOwn(dispatchMap, key)) {
    const isValidMsg = err => typeof err === 'string'
    const genericMsg = `Option ${key} is missing from dispatch map.`
      + `\nAvailable options: ${Object.keys(dispatchMap)}`
    const errorMsgFinal = chooseBy(errorMsg, genericMsg, isValidMsg)
    throw new Error(errorMsgFinal)
  }
  return dispatchMap[key]
}

/**
 * Returns true if meets predicate's condition, otherwise - returns onError(input).
 * @template I,F
 * @param {I} input
 * @param {(input: I) => F} onError
 * @param {(input: I) => boolean} predicate
 * @returns {true | F}
 */
export function validateBy(input, onError, predicate) {
  if (predicate(input)) return true
  else return onError(input)
}

/**
 * @typedef SafeStringifyOptions
 *
 * @property {number} [maxDepth = 3]
 * Non-negative safe integer. The value passed in starts at depth 0.
 * It is 'container depth'. Increases with nested objects.
 * A container at this depth prints as [Depth Limit: ...].
 *
 * @property {number} [expandObjectsEntriesThreshold=3]
 * Safe integer >= -1.
 * An Object with at least this many entries is multi-lined.
 * -1 means Infinity. 0 and 1 expand every non-empty Object.
 * An child entry containing a newline forces multi-line regardless of this.
 *
 * @property {number} [expandArraysLineLengthThreshold=80]
 * Safe integer >= -1.
 * -1 means Infinity (never multiline Arrays themselves)
 * If Array only contains non-containers (primitives, functions...) it is never multilined.
 * Otherwise, may multiline if Array's text length is at or above this threshold.
 */

/**
 * Safely and neatly stringifies ANY input. Objects, Arrays, null, Class instances, anything.
 *
 * Thresholds to control multiline vs single-line output are configurable.
 *
 * Max output depth is also configurable.
 *
 * Wrong options do not throw, they fallback to defaults & logged via console.error.
 * @param {any} value
 * @param {SafeStringifyOptions} [options = {}]
 * @returns {string}
 */
export function safeStringify(value, options = {}) {
  const defaultOpts = {
    maxDepth: 3,
    expandObjectsEntriesThreshold: 3,
    expandArraysLineLengthThreshold: 80,
  }
  if (typeof options !== 'object' || Array.isArray(options) || options === null) {
    console.error('safeStringify: wrong options supplied. Falling back to defaults.')
    options = {}
  }
  const opts = { ...defaultOpts, ...options }

  const onError = (key) => {
    console.error(`safeStringify: wrong ${key} supplied. Falling back to default.`)
    opts[key] = defaultOpts[key]
  }

  const isMaxDepthValid = (key) => {
    return Number.isSafeInteger(opts[key]) && opts[key] >= 0
  }

  const isThreshValid = (key) => {
    return Number.isSafeInteger(opts[key]) && opts[key] >= -1
  }

  const validateList = [
    ['maxDepth', isMaxDepthValid],
    ['expandObjectsEntriesThreshold', isThreshValid],
    ['expandArraysLineLengthThreshold', isThreshValid],
  ]

  validateList.forEach(([key, callback]) => validateBy(key, onError, callback))

  if (opts.expandObjectsEntriesThreshold === -1) opts.expandObjectsEntriesThreshold = Infinity
  if (opts.expandArraysLineLengthThreshold === -1) opts.expandArraysLineLengthThreshold = Infinity

  const walk = (value, depth = 0, path = new Set()) => {
    if (typeof value === 'string') return value

    // any safely and nicely convertible by String()
    if (
      typeof value === 'number'
      || typeof value === 'bigint'
      || typeof value === 'boolean'
      || typeof value === 'symbol'
      || value === undefined
      || value === null
      || value instanceof Date
      || value instanceof RegExp
    ) return String(value)

    if (typeof value === 'function') return `[Function: ${value.name || '(anonymous)'}]`

    if (path.has(value)) return '[Circular]'
    if (depth >= opts.maxDepth) {
      let label
      if (Array.isArray(value)) label = `Array(${value.length})`
      else if (typeof value.constructor === 'function' && value.constructor.name) label = value.constructor.name
      else label = typeof value

      return `[Depth Limit: ${label}]`
    }

    path.add(value)
    const childrenTextArray = []
    let text
    let hasContainerChildren = false
    if (Array.isArray(value)) {
      for (const item of value) {
        const itemText = walk(item, depth + 1, path)
        childrenTextArray.push(itemText)
        if ((item !== null) && typeof item === 'object') hasContainerChildren = true
      }

      const stringifiedText = childrenTextArray.join(', ')
      if ((stringifiedText.length >= opts.expandArraysLineLengthThreshold && hasContainerChildren) || childrenTextArray.some(element => element.includes('\n'))) {
        const indentationBase = '  '.repeat(depth)
        text = `[\n${indentationBase}  ${childrenTextArray.join(`,\n${indentationBase}  `)}\n${indentationBase}]`
      }
      else text = `[${stringifiedText}]`
    }
    else {
      const proto = Object.getPrototypeOf(value)
      const plain = proto === Object.prototype || proto === null
      const name = typeof value.constructor === 'function' ? value.constructor.name : ''

      let prefix
      if (plain || !name || name === 'Object') prefix = ''
      else prefix = `[${name}] `

      const keys = Object.keys(value)
      for (const key of keys) {
        const entryText = `${key}: ${walk(value[key], depth + 1, path)}`
        childrenTextArray.push(entryText)
      }
      if (childrenTextArray.length === 0) {
        text = prefix ? prefix.trimEnd() : '{}'
      }
      else if (childrenTextArray.length >= opts.expandObjectsEntriesThreshold || childrenTextArray.some(element => element.includes('\n'))) {
        const indentationBase = '  '.repeat(depth)
        text = `${prefix}{\n${indentationBase}  ${childrenTextArray.join(`,\n${indentationBase}  `)}\n${indentationBase}}`
      }
      else text = `${prefix}{ ${childrenTextArray.join(', ')} }`
    }

    path.delete(value)
    return text
  }

  return walk(value)
}
