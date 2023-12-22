import type {Generated} from 'kysely'

export type KyselifyCreationAttributes<CA, O = {}> = {
  [K in keyof CA]-?: K extends keyof O ? O[K] : undefined extends CA[K] ? Generated<Exclude<CA[K], undefined>> : CA[K]
}
