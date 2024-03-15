import type {Generated as KyselyGenerated, GeneratedAlways as KyselyGeneratedAlways} from 'kysely'
import {CreationOptional, ForeignKey, Model, NonAttribute, InferAttributes as SequelizeInferAttributes} from 'sequelize'

/**
 * sequelize < 6.14.0
 */
export type KyselifyCreationAttributes<CA, O = {}> = {
  [K in keyof CA]-?: K extends keyof O
    ? O[K]
    : undefined extends CA[K]
    ? KyselyGenerated<Exclude<CA[K], undefined>>
    : CA[K]
}

export type GeneratedAlways<T> = T & {
  readonly __kysely__generated__always__?: unique symbol
}

/**
 * sequelize >= 6.14.0
 */
export type KyselifyModel<M extends Model<any, any>, O = {}> = {
  [K in keyof SequelizeInferAttributes<M> as NonAttribute<any> extends M[K] ? never : K]-?: K extends keyof O
    ? O[K]
    : '__kysely__generated__always__' extends keyof M[K]
    ? M[K] extends GeneratedAlways<infer T>
      ? KyselyGeneratedAlways<T>
      : never
    : keyof CreationOptional<{}> extends keyof M[K]
    ? M[K] extends CreationOptional<infer T>
      ? KyselyGenerated<T>
      : never
    : M[K] extends ForeignKey<infer T>
    ? undefined extends T
      ? Exclude<T, undefined> | null
      : T
    : undefined extends M[K]
    ? Exclude<M[K], undefined> | null
    : M[K]
}
