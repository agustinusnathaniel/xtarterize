import yaml from 'js-yaml'
import { defu } from 'defu'

export function mergeYaml(existing: string, incoming: string): string {
  const existingObj = yaml.load(existing) as object
  const incomingObj = yaml.load(incoming) as object
  const merged = defu(incomingObj, existingObj)
  return yaml.dump(merged, { lineWidth: -1 })
}
