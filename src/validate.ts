import { warning } from '@actions/core'
import tinify from 'tinify'

export function validateKey(key: string): boolean {
  tinify.key = key
  tinify.validate(function (err) {
    if (err instanceof tinify.AccountError) {
      warning('AccountError message is: ' + err.message)
      return false
    }
  })
  return true
}
