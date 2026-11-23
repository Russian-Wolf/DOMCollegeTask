import { CustomError } from './CustomError.js'

export function handleError(error, mode = 'throw') {
  let handlerErrData
  switch (mode) {
    case 'console.log':
      console.log(error)
      return error
    case 'console.error':
      console.error(error)
      return error
    case 'swallow':
      return null
    case 'throw':
      throw error
    default:
      handlerErrData = {
        reason: 'invalid-handle-mode',
        field: 'mode',
        value: mode,
        expected: 'throw | console.error | console.log | swallow',
      }
      throw new CustomError(handlerErrData, { cause: error })
  }
}
