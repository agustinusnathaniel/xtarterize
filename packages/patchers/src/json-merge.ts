import { defu } from 'defu'

export function mergeJson(existing: object, incoming: object): object {
  return defu(existing, incoming)
}
