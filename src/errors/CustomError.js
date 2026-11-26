import { safeStringify } from '../helpers/stringify.js'

export class CustomError extends Error {
  static type = 'custom'
  static defaults = {
    reason: 'unknown',
    field: 'unknown',
    value: 'unknown',
    valueType: 'unknown',
    expected: 'unknown',
  }

  static formatAssertion(options) {
    const lines = [options.head]
    if (Object.hasOwn(options, 'expected')) lines.push(`Expected: ${options.expected}`)
    if (Object.hasOwn(options, 'actual')) lines.push(`Actual: ${options.actual}`)
    return lines.join('\n')
  }

  static templateWrongType({ field, expected, valueType }) {
    return this.formatAssertion({
      head: `Wrong type for ${this.stringify(field)}`,
      expected: this.stringify(expected),
      actual: valueType,
    })
  }

  static templateMissingField({ field, expected }) {
    return this.formatAssertion({
      head: `Missing ${this.stringify(field)}`,
      expected: this.stringify(expected),
    })
  }

  static templateInvalidValue({ field, expected, value }) {
    return this.formatAssertion({
      head: `Invalid ${this.stringify(field)}`,
      expected: this.stringify(expected),
      actual: this.stringify(value),
    })
  }

  static templateInvalidNoActual({ field, expected }) {
    return this.formatAssertion({
      head: `Invalid ${this.stringify(field)}`,
      expected: this.stringify(expected),
    })
  }

  static templateInvalidHandleMode({ expected, value }) {
    return this.formatAssertion({
      head: `Invalid handle mode`,
      expected: this.stringify(expected),
      actual: this.stringify(value),
    })
  }

  static templateUnknown() {
    return `Unknown error type.`
  }

  /** @type {Map<string, string>} */
  static messageTemplates = new Map([
    ['unknown', 'templateUnknown'],
    ['wrong-type', 'templateWrongType'],
    ['missing-field', 'templateMissingField'],
    ['invalid-value', 'templateInvalidValue'],
    ['invalid-handle-mode', 'templateInvalidHandleMode'],
  ])

  static buildMessage(data) {
    const errMsg = `${this.name} internal message generation error.`
      + `\n Message templates likely malformed.`
    const methodMap = this.messageTemplates
    if (!(methodMap instanceof Map)) throw new Error(errMsg)

    const key = methodMap.has(data.reason) ? data.reason : 'unknown'
    const methodName = methodMap.get(key)

    if (typeof methodName !== 'string'
      || !methodName.startsWith('template')
      || typeof this[methodName] !== 'function') throw new Error(errMsg)
    return this[methodName](data)
  }

  static stringify(value) {
    return safeStringify(value, { includeStack: false })
  }

  constructor(rawData = {}, errorOptions = undefined, messageOverride = undefined) {
    const newClass = new.target
    const data = { ...newClass.defaults, ...rawData }
    if (Object.hasOwn(rawData, 'value')) data.valueType = typeof rawData.value
    else data.valueType = 'unknown'

    super(messageOverride ?? newClass.buildMessage(data), errorOptions)

    this.name = newClass.name
    this.type = newClass.type
    this.rawData = rawData

    for (const key of Object.keys(newClass.defaults)) {
      this[key] = data[key]
    }
  }
}
