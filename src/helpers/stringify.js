import { validateBy, getCountStr, getArrayFirstN } from './useful.js'

class ValueStringifier {
  static DEFAULTS = {
    maxDepth: 3,
    expandObjectsEntriesThreshold: 3,
    expandArraysLineLengthThreshold: 80,
    includeStack: true,
    getters: false,
    maxItems: 100,
    quoteStrings: 'nested',
  }

  static TAG_KINDS = new Map([
    ['[object Date]', 'leaf'],
    ['[object RegExp]', 'leaf'],
    ['[object Number]', 'boxed'],
    ['[object String]', 'boxed'],
    ['[object Boolean]', 'boxed'],
    ['[object BigInt]', 'boxed'],
    ['[object Symbol]', 'boxed'],
    ['[object Array]', 'list'],
    ['[object Arguments]', 'list'],
    ['[object Set]', 'list'],
    ['[object Uint8Array]', 'list'],
    ['[object Uint8ClampedArray]', 'list'],
    ['[object Int8Array]', 'list'],
    ['[object Uint16Array]', 'list'],
    ['[object Int16Array]', 'list'],
    ['[object Uint32Array]', 'list'],
    ['[object Int32Array]', 'list'],
    ['[object Float32Array]', 'list'],
    ['[object Float64Array]', 'list'],
    ['[object BigInt64Array]', 'list'],
    ['[object BigUint64Array]', 'list'],
    ['[object Map]', 'map'],
    ['[object Error]', 'error'],
    ['[object DOMException]', 'error'],
    ['[object URL]', 'text'],
    ['[object URLSearchParams]', 'text'],
    ['[object WeakMap]', 'weak'],
    ['[object WeakSet]', 'weak'],
    ['[object Promise]', 'opaque'],
    ['[object Generator]', 'opaque'],
    ['[object AsyncGenerator]', 'opaque'],
    ['[object ArrayBuffer]', 'opaque'],
    ['[object SharedArrayBuffer]', 'opaque'],
    ['[object DataView]', 'opaque'],
    ['[object Blob]', 'opaque'],
    ['[object File]', 'opaque']])

  static normalizeOptions(options) {
    const ctor = ValueStringifier
    if (typeof options !== 'object' || Array.isArray(options) || options === null) {
      console.error('safeStringify: wrong options supplied. Falling back to defaults.')
      options = {}
    }
    const opts = { ...ctor.DEFAULTS, ...options }

    const onError = (key) => {
      console.error(`safeStringify: wrong ${key} supplied. Falling back to default.`)
      opts[key] = ctor.DEFAULTS[key]
    }

    const isGreaterThanNeg1SettingValid = (key) => {
      return opts[key] === Infinity || (Number.isSafeInteger(opts[key]) && opts[key] >= -1)
    }

    const isBoolSettingValid = (key) => {
      return typeof opts[key] === 'boolean'
    }

    const allowedQuoteSettings = ['none', 'nested', 'all']

    const isQuoteStringsValid = (key) => {
      return allowedQuoteSettings.includes(opts[key])
    }

    /** @type {Array<[string, (key: string) => boolean]>} */
    const validateList = [
      ['maxDepth', isGreaterThanNeg1SettingValid],
      ['expandObjectsEntriesThreshold', isGreaterThanNeg1SettingValid],
      ['expandArraysLineLengthThreshold', isGreaterThanNeg1SettingValid],
      ['includeStack', isBoolSettingValid],
      ['getters', isBoolSettingValid],
      ['maxItems', isGreaterThanNeg1SettingValid],
      ['quoteStrings', isQuoteStringsValid],
    ]

    validateList.forEach(([key, callback]) => validateBy(key, onError, callback))

    const neg1ToInfKeysArray = ['maxDepth', 'expandObjectsEntriesThreshold', 'expandArraysLineLengthThreshold', 'maxItems']
    for (const key of neg1ToInfKeysArray) {
      if (opts[key] === -1) opts[key] = Infinity
    }

    return opts
  }

  static classify(value) {
    const r = {
      tag: Object.prototype.toString.call(value),
      kind: 'unknown',
      label: 'Unknown',
      container: false,
      isClass: false,
      isPlainObject: false,
    }

    if (r.tag === '[object Object]') {
      r.kind = 'record'
      const proto = Object.getPrototypeOf(value)
      const ctor = proto?.constructor
      const hasIdentity = typeof ctor === 'function' && ctor.prototype === proto
      if (hasIdentity && Object.getPrototypeOf(proto) !== null) {
        r.isClass = true
        const name = ctor.name
        if (name === '') r.label = 'Anonymous'
        else r.label = name
      }
      else {
        r.isPlainObject = true
        r.label = 'Object'
      }
    }
    else {
      r.kind = this.TAG_KINDS.get(r.tag) ?? 'unknown'
      const re = /^\[object ([^\]]+)\]$/
      r.label = r.tag.match(re)?.[1] ?? 'Unknown'
      if (r.kind === 'error') r.label = this.errorName(value)
    }

    const containerKinds = ['record', 'list', 'map', 'error', 'unknown']
    if (containerKinds.includes(r.kind)) r.container = true
    return r
  }

  static labelOf(value, meta) {
    if (meta.tag === '[object Map]' || meta.tag === '[object Set]') {
      return `${meta.label}(${value.size})`
    }
    else if (meta.kind === 'list') {
      return `${meta.label}(${value.length})`
    }
    return meta.label
  }

  static indent(depth) {
    return '  '.repeat(depth)
  }

  static quoteString(text) {
    const str = text
      .replaceAll('\\', '\\\\')
      .replaceAll('\'', '\\\'')
      .replaceAll('\n', '\\n')
      .replaceAll('\t', '\\t')
      .replaceAll('\r', '\\r')
    return `'${str}'`
  }

  static errorName(error) {
    try {
      const name = error.name
      if (typeof name !== 'string' || name === '') return 'Error'
      else return name
    }
    catch (err) {
      console.error('Could not read name of Error.\n', err)
      return 'Error'
    }
  }

  constructor(value, options) {
    this.value = value
    this.ctor = ValueStringifier
    this.options = this.ctor.normalizeOptions(options)
    this.path = new Set()
  }

  stringify() {
    try {
      return this.describe(this.value, 0)
    }
    catch (error) {
      console.error('Stringify error encountered.\n', error)
      return `[Unserializable: ${this.ctor.errorName(error)}]`
    }
  }

  formatString(value, depth) {
    const opts = this.options
    if (opts.quoteStrings === 'all') return this.ctor.quoteString(value)
    else if (opts.quoteStrings === 'nested' && depth > 0) return this.ctor.quoteString(value)
    else return value
  }

  // Any primitive aside from string.
  formatPrimitive(value) {
    const str = String(value)
    if (typeof value === 'bigint') return `${str}n`
    else return str
  }

  formatFunction(value) {
    return `[Function: ${value.name || '(anonymous)'}]`
  }

  // Date, RegExp
  formatLeaf(value, meta) {
    if (meta.label === 'Date') {
      if (Number.isNaN(value.getTime())) return 'Invalid Date'
      else return value.toISOString()
    }
    else return String(value)
  }

  // Number, String, Boolean, BigInt, Symbol (inside the object box)
  formatBoxed(value, meta) {
    const str = value.valueOf()
    let content
    if (meta.label === 'String') content = this.formatString(str, 1)
    else if (meta.label === 'BigInt') content = `${String(str)}n`
    else content = String(str)
    return `[${meta.label}: ${content}]`
  }

  formatTextLike(value, meta) {
    const text = String(value)
    if (!text) return meta.label
    else return `${meta.label} ${text}`
  }

  // WeakMap, WeakSet
  formatWeak(_value, meta) {
    // Label-only for now, TBD in v3: probe extraction with potential keys supplied.
    return `[${meta.label}]`
  }

  // Promise, *Generator, *ArrayBuffer, DataView, Blob, File
  formatOpaque(value, meta) {
    const getSizeBuffer = value => value.byteLength
    const getSizeBlobFile = value => value.size
    if (['ArrayBuffer', 'SharedArrayBuffer', 'DataView'].includes(meta.label)) {
      const countStr = getCountStr(value, 'byte', 'bytes', getSizeBuffer)
      return `[${meta.label}: ${countStr}]`
    }
    else if (meta.label === 'Blob') {
      const countStr = getCountStr(value, 'byte', 'bytes', getSizeBlobFile)
      const typeStr = value.type ? `, ${value.type}` : ''
      return `[${meta.label}: ${countStr}${typeStr}]`
    }
    else if (meta.label === 'File') {
      const countStr = getCountStr(value, 'byte', 'bytes', getSizeBlobFile)
      const typeStr = value.type ? `, ${value.type}` : ''
      return `[${meta.label}: ${value.name}, ${countStr}${typeStr}]`
    }
    else return `[${meta.label}]`
  }

  // Only for non-containers
  formatNonContainer(value, meta) {
    const formatNCDispatchMap = {
      leaf: this.formatLeaf,
      boxed: this.formatBoxed,
      text: this.formatTextLike,
      weak: this.formatWeak,
      opaque: this.formatOpaque,
    }
    const dispatchedFunc = formatNCDispatchMap[meta.kind]
    return dispatchedFunc.call(this, value, meta)
  }

  // Only for containers
  propertyEntries(value, depth, keyOptions = {}) {
    const defaultOpts = {
      prepend: new Set(),
      exclude: new Set(),
    }
    const opts = { ...defaultOpts, ...keyOptions }
    const baseKeys = [...opts.prepend]
    const filterExclude = key => !opts.exclude.has(key)
    const stringKeys = Object.keys(value).filter(filterExclude)
    const symbolKeys = Object.getOwnPropertySymbols(value).filter(filterExclude)
      .filter((symbol) => {
        const descr = Object.getOwnPropertyDescriptor(value, symbol)
        return descr?.enumerable === true
      })
    const keys = baseKeys.concat(stringKeys, symbolKeys)
    const total = keys.length
    const limit = this.options.maxItems
    const getters = this.options.getters
    const r = {
      entries: [],
      total: total,
    }

    let i = 0
    while (i + 1 <= limit && i < keys.length) {
      const key = keys[i]
      const keyText = typeof key === 'string' ? key : `[${String(key)}]`
      let valueText = ''

      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor) {
        i++
        continue
      }

      const hasGetter = typeof descriptor.get === 'function'
      const hasSetter = typeof descriptor.set === 'function'

      if (hasSetter) {
        valueText = '[Setter]'
      }
      if (hasGetter) {
        if (!getters) {
          if (valueText === '[Setter]') valueText = '[Getter/Setter]'
          else valueText = '[Getter]'
        }
        else {
          let item
          let readFailed = false
          try {
            item = value[key]
          }
          catch (error) {
            readFailed = true
            valueText = `[Getter Throws: ${this.ctor.errorName(error)}]`
          }
          if (!readFailed) valueText = this.describe(item, depth + 1)
        }
      }
      if (!(hasGetter || hasSetter)) {
        valueText = this.describe(descriptor.value, depth + 1)
      }
      r.entries.push(`${keyText}: ${valueText}`)
      i++
    }

    return r
  }

  layoutParts(parts, depth, multiline, open, close, padding) {
    if (parts.length === 0) return `${open}${close}`
    if (!multiline) return `${open}${padding}${parts.join(', ')}${padding}${close}`
    else {
      const baseIndent = this.ctor.indent(depth)
      const nextIndent = this.ctor.indent(depth + 1)
      const res = open
        + `\n${nextIndent}${parts.join(`,\n${nextIndent}`)}`
        + `\n${baseIndent}${close}`
      return res
    }
  }

  tagRemaining(entries, total) {
    const limitReached = total > this.options.maxItems
    const remaining = total - entries.length
    let append
    let parts = entries

    if (remaining > 0) {
      if (limitReached) {
        append = `[Limit Reached] ...(${remaining} more)`
      }
      else append = `...(${remaining} more)`
    }
    if (append) {
      parts = entries.slice()
      parts.push(append)
    }
    return parts
  }

  formatEntries(entries, depth, total) {
    if (total === 0) return '{}'
    const parts = this.tagRemaining(entries, total)
    const threshold = this.options.expandObjectsEntriesThreshold
    const multiline = (parts.length >= threshold || parts.some(element => element.includes('\n')))

    return this.layoutParts(parts, depth, multiline, '{', '}', ' ')
  }

  formatItems(items, depth, total, hasObjectItem, style) {
    const stylesMap = {
      array: { open: '[', close: ']', padding: '' },
      set: { open: '{', close: '}', padding: ' ' },
    }
    const { open, close, padding } = stylesMap[style]
    if (total === 0) return `${open}${close}`
    const parts = this.tagRemaining(items, total)
    const threshold = this.options.expandArraysLineLengthThreshold
    const joinedLength = parts.join(', ').length
    const multiline = (joinedLength >= threshold && hasObjectItem) || parts.some(element => element.includes('\n'))
    return this.layoutParts(parts, depth, multiline, open, close, padding)
  }

  // Only objects / class instances (record-like)
  formatRecord(value, depth, meta) {
    const { entries, total } = this.propertyEntries(value, depth)
    const hasPrefix = meta.isClass && meta.label !== 'Object'
    const strLabel = `[${meta.label}]`
    const prefix = hasPrefix ? `${strLabel} ` : ''

    if (total === 0) {
      if (hasPrefix) return strLabel
      else return '{}'
    }

    return prefix + this.formatEntries(entries, depth, total)
  }

  // Only Array-like lists - Array, Set, typed Arrays, Arguments
  formatList(value, depth, meta) {
    let total, style
    const limit = this.options.maxItems

    if (meta.tag === '[object Set]') {
      total = value.size
      style = 'set'
    }
    else {
      total = value.length
      style = 'array'
    }

    let prefix = `${meta.label}(${total}) `
    if (meta.tag === '[object Array]') prefix = ''

    const shownItems = getArrayFirstN(value, limit)

    let hasObjectItem = false
    const itemTexts = []
    for (const item of shownItems) {
      if (item !== null && typeof item === 'object') hasObjectItem = true
      itemTexts.push(this.describe(item, depth + 1))
    }

    const body = this.formatItems(itemTexts, depth, total, hasObjectItem, style)

    return `${prefix}${body}`
  }

  formatMap(value, depth) {
    const total = value.size
    if (total === 0) return 'Map(0) {}'
    const limit = this.options.maxItems
    const shownItems = getArrayFirstN(value, limit)
    const itemTexts = []
    for (const [key, mapValue] of shownItems) {
      let keyText
      if (typeof key === 'string') keyText = this.ctor.quoteString(key)
      else {
        keyText = this.describe(key, depth + 1, { compact: true })
      }
      const valueText = this.describe(mapValue, depth + 1)
      itemTexts.push(`${keyText} => ${valueText}`)
    }
    const body = this.formatEntries(itemTexts, depth, total)
    return `Map(${total}) ${body}`
  }

  formatError(value, depth, meta) {
    const name = meta.label
    const message = String(value.message ?? '')
    const header = message === '' ? name : `${name}: ${message}`
    const prepend = new Set()
    const exclude = new Set(['name', 'message', 'stack'])

    if (Object.hasOwn(value, 'cause')) {
      prepend.add('cause')
      exclude.add('cause')
    }

    const errorsDescriptor = Object.getOwnPropertyDescriptor(value, 'errors')
    let safeDescr
    if (errorsDescriptor) {
      const hasGetter = typeof errorsDescriptor.get === 'function'
      const hasSetter = typeof errorsDescriptor.set === 'function'
      safeDescr = !hasGetter && !hasSetter
    }
    else safeDescr = false

    if (safeDescr && Array.isArray(errorsDescriptor.value)) {
      prepend.add('errors')
      exclude.add('errors')
    }

    const { entries, total } = this.propertyEntries(value, depth, { prepend, exclude })
    const parts = this.tagRemaining(entries, total)
    const lines = [header]
    parts.forEach((part) => {
      lines.push(this.ctor.indent(depth + 1) + part)
    })

    const stack = this.options.includeStack
    if (!stack) return lines.join('\n')
    else if (typeof value.stack !== 'string') return lines.join('\n')

    const stackLines = value.stack.split('\n')
      .filter(line => !(line.trim() === ''))
    const rawHeaderLines = header.split('\n')
    const headerLines = rawHeaderLines.filter(line => !(line.trim() === ''))

    let i = 0
    while (i < headerLines.length && stackLines[i] === headerLines[i]) {
      i++
    }

    stackLines.splice(0, i)

    const resultLines = lines.concat(stackLines)
    return resultLines.join('\n')
  }

  formatUnknown(value, depth, meta) {
    const label = meta.label
    const { entries, total } = this.propertyEntries(value, depth)
    if (total === 0) return `[${label}]`
    else return `[${label}] ${this.formatEntries(entries, depth, total)}`
  }

  describe(value, depth, describeOptions = {}) {
    const defaultOpts = {
      compact: false,
    }
    const o = { ...defaultOpts, ...describeOptions }
    const type = typeof value

    /** @type {Array<[boolean, (value: any, depth: number) => string]>} */
    const preMetaArray = [
      [type === 'string', (value, depth) => {
        if (o.compact) return this.ctor.quoteString(value)
        else return this.formatString(value, depth)
      }],
      [type === 'function', value => this.formatFunction(value)],
      [value === null || type !== 'object', value => this.formatPrimitive(value)],
    ]

    for (const [condition, fn] of preMetaArray) {
      if (condition) return fn(value, depth)
    }

    const meta = this.ctor.classify(value)

    /** @type {Array<[boolean, (value: any, meta: any) => string]>} */
    const preNestedArray = [
      [this.path.has(value), () => '[Circular]'],
      [o.compact && meta.container, (value, meta) => this.ctor.labelOf(value, meta)],
      [meta.container === false, (value, meta) => this.formatNonContainer(value, meta)],
      [depth >= this.options.maxDepth, (value, meta) => `[Depth Limit: ${this.ctor.labelOf(value, meta)}]`],
    ]

    for (const [condition, fn] of preNestedArray) {
      if (condition) return fn(value, meta)
    }

    this.path.add(value)

    const metaKindDispatch = {
      record: this.formatRecord,
      list: this.formatList,
      map: this.formatMap,
      error: this.formatError,
      unknown: this.formatUnknown,
    }

    try {
      return metaKindDispatch[meta.kind].call(this, value, depth, meta)
    }
    finally {
      this.path.delete(value)
    }
  }
}

/**
 * Options for safeStringify. All keys are optional.
 * Invalid values log and fall back to their defaults.
 *
 * @typedef SafeStringifyOptions
 *
 * @property {number} [maxDepth = 3]
 * Safe integer >= -1 or Infinity. -1 means Infinity.
 * The value passed in starts at depth 0.
 * It is 'container depth'. Increases with nested objects.
 * A container at this depth or deeper prints as `[Depth Limit: ...]`.
 * Leaves are never limited.
 *
 * @property {number} [expandObjectsEntriesThreshold=3]
 * Safe integer >= -1 or Infinity. -1 means Infinity.
 * 0 and 1 expand every non-empty body.
 * It determines a multiline threshold value for record-like values.
 * This covers items like: Object, class instance, Map, undetermined containers too.
 * Containers with at least this many entries are multi-lined.
 * If container has multiline children - it gets multilined regardless of this threshold.
 *
 * @property {number} [expandArraysLineLengthThreshold=80]
 * Safe integer >= -1 or Infinity.
 * -1 means Infinity (never multiline lists by length).
 * If a list only contains non-objects (primitives, functions...), it is never multilined by length.
 * This only applies to object-containing lists.
 * If such a list, when represented in single-line form, reaches or exceeds this length limit, it is multilined.
 * Any list containing a newline forces multi-line regardless.
 *
 * @property {boolean} [includeStack = true]
 * Append Error/DOMException stack frames after the fields.
 * When false, error.stack is not read.
 * Frames are raw engine text.
 * The repeated header is removed and blank lines are filtered.
 *
 * @property {boolean} [getters = false]
 * Invoke own enumerable getters.
 * Default `false` just prints `[Getter]`, or `[Getter/Setter]` for those.
 * Warning: if `true` any and all side effects of these getters will be triggered by this.
 * A throwing getter prints `[Getter Throws: Name]`.
 * This does not affect built-in reads such as valueOf, toString, Symbol.toStringTag, size or byteLength.
 * Note: setters-only are printed as `[Setter]`.
 *
 * @property {number} [maxItems = 100]
 * Safe integer >= -1 or Infinity.
 * -1 means Infinity (no limit on amount of entries).
 * Max number of items shown per one container. 0 shows none.
 * Array/Map/Set are read lazily (only up to this number).
 * Object key reads themselves are non-lazy. Output is still limited.
 * When the limit is reached, the last entry shows:
 * `[Limit Reached] ...(${remaining} more)`.
 *
 * @property {'nested' | 'all' | 'none'} [quoteStrings = 'nested']
 * Determines if output is quoted and single-lined.
 * Default is 'nested' which does this for nested (inside Object, Array, ...) values.
 * 'all' means all strings are given in this way.
 * 'none' means even nested strings will be shown as-is.
 * Property keys are never quoted.
 * Map keys are always quoted as otherwise they may look the same as a variable mapped.
 * Quoted strings escape backslash, single quote, newline, tab and `\r` only.
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
  return new ValueStringifier(value, options).stringify()
}
