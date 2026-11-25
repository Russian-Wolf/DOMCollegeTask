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
 * @param {Record<string, V>} dispatchMap Dispatch map object that contains option -> respective value pairs as key: value pairs.
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
 * Takes any value, unit string and plural string (if many units).
 * Counts the thing by using getCountCB(value).
 * Prints the count with the unit or units (if plural) attached.
 * @param {any} value
 * @param {string} unit
 * @param {string} units
 * @param {function} getCountCB
 * @returns {string}
 */
export function getCountStr(value, unit, units, getCountCB) {
  const count = getCountCB(value)
  if ((count) === 1) return `${count} ${unit}`
  else return `${count} ${units}`
}

/**
 * Take the first N elements of any iterable, lazily (no over-read).
 * Returs a new Array of said elements.
 *
 * @param {Iterable<T>} iterable
 * @param {number} [limit] Max elements. `<= 0`: returns `[]`.
 * `NaN`/`Infinity`/omitted (`undefined`): no limit (returns `Array` with everything).
 * Non-integers round up (1.1, 1.5, 1.8 = 2 elements).
 * @returns {T[]}
 * @template T
 */
export function getArrayFirstN(iterable, limit) {
  const result = []
  if (limit <= 0) return result
  for (const element of iterable) {
    result.push(element)
    if (result.length >= limit) break
  }
  return result
}
