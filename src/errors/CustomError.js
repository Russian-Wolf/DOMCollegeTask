import { safeDispatch } from '../helpers/useful.js'

function wrongType({ field, expected, valueType }) {
  const msg = `Wrong type for ${field}`
    + `\nExpected: ${expected}`
    + `\nActual: ${valueType}`
  return msg
}

function missingField({ field, expected }) {
  const msg = `Missing ${field}`
    + `\nExpected: ${expected}`
  return msg
}

function invalidValue({ field, expected, value }) {
  const msg = `Invalid ${field}`
    + `\nExpected: ${expected}`
    + `\nActual: ${value}`
  return msg
}

function invalidHandleMode({ expected, value }) {
  const msg = `Invalid handle mode`
    + `\nExpected: ${expected}`
    + `\nActual: ${value}`
  return msg
}

const MESSAGE_TEMPLATES = {
  'unknown': function unknown() { return `Unknown error type.` },
  'wrong-type': wrongType,
  'missing-field': missingField,
  'invalid-value': invalidValue,
  'invalid-handle-mode': invalidHandleMode,
}

export class CustomError extends Error {
  static type = 'custom'
  static defaults = {
    reason: 'unknown',
    field: 'unknown',
    value: 'unknown',
    valueType: 'unknown',
    expected: 'unknown',
  }

  static messageTemplates = MESSAGE_TEMPLATES

  static buildMessage(data) {
    const errMsg = `${this.name} internal message generation error.`
      + `\n Message templates likely malformed.`

    if (!this.messageTemplates || typeof this.messageTemplates !== 'object') throw new Error(errMsg)

    let template
    try {
      template = safeDispatch(data.reason, this.messageTemplates)
    }
    catch {
      template = this.messageTemplates.unknown
    }
    if (typeof template !== 'function') throw new Error(errMsg)
    return template.call(this, data)
  }

  constructor(rawData = {}, errorOptions = undefined, messageOverride = undefined) {
    const newClass = new.target
    const data = { ...newClass.defaults, ...rawData }
    if (Object.hasOwn(rawData, 'value')) data.valueType = typeof rawData.value
    else data.valueType = 'unknown'

    super(messageOverride ?? newClass.buildMessage(data), errorOptions)

    this.name = newClass.name
    this.type = newClass.type

    for (const key of Object.keys(newClass.defaults)) {
      this[key] = data[key]
    }
  }
}
