import type {Generated} from 'kysely'

export type Kyselify<T, O = {}> = {
  [K in keyof T]-?: K extends keyof O ? O[K] : undefined extends T[K] ? Generated<Exclude<T[K], undefined>> : T[K]
}
