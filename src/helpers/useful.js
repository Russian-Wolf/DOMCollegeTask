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
