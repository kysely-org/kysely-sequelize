import type {Generated as KyselyGenerated, GeneratedAlways as KyselyGeneratedAlways} from 'kysely'
import type {CreationOptional, ForeignKey, InferAttributes, Model, NonAttribute} from 'sequelize'

/**
 * Translates a sequelize `CreationAttributes` type (legacy pre 6.14.0) to a Kysely
 * table schema type.
 *
 * @example
 *
 * ```ts
 * type ToyAttributes {
 *   id: number
 *   name: string
 *   price: number
 *   petId: number
 * }
 *
 * type ToyCreationAttributes = Optional<ToyAttributes, 'id'>
 *
 * \@Table({modelName: 'Toy', tableName: 'toy', timestamps: false, underscored: true})
 * export class ToyModel extends Model<ToyAttributes, ToyCreationAttributes> {
 *   declare id: ToyAttributes['id']
 *
 *   \@Column({allowNull: false, type: DataType.STRING(255)})
 *   name: ToyAttributes['name']
 *
 *   \@Column({allowNull: false, type: DataType.INTEGER})
 *   \@ForeignKey(() => PetModel)
 *   petId: ToyAttributes['petId']
 *
 *   \@Column({allowNull: false, type: DataType.DOUBLE})
 *   price: ToyAttributes['price']
 *
 *   \@BelongsTo(() => PetModel)
 *   pet: PetModel
 * }
 *
 * export type Toy = KyselifyCreationAttributes<ToyCreationAttributes>
 *
 * interface Database {
 *   toy: Toy
 * }
 *
 * export const db = new Kysely<Database>({
 *   // ...
 * })
 * ```
 *
 * @template CA - CreationAttributes
 * @template O - Overrides
 */
export type KyselifyCreationAttributes<CA, O = {}> = {
  [K in keyof CA]-?: K extends keyof O
    ? O[K]
    : undefined extends CA[K]
    ? KyselyGenerated<Exclude<CA[K], undefined>>
    : CA[K]
}

/**
 * Similar to Kysely's `GeneratedAlways` type, but is compatible with sequelize's
 * branded types (e.g. `CreationOptional`).
 */
export type GeneratedAlways<T> = T & {
  readonly __kysely__generated__always__?: unique symbol
}

/**
 * sequelize >= 6.14.0
 */
export type KyselifyModel<M extends Model<any, any>, O = {}> = {
  [K in keyof InferAttributes<M> as NonAttribute<any> extends M[K] ? never : K]-?: K extends keyof O
    ? O[K]
    : '__kysely__generated__always__' extends keyof M[K]
    ? M[K] extends GeneratedAlways<infer T>
      ? keyof CreationOptional<{}> extends keyof T
        ? T extends CreationOptional<infer U>
          ? KyselyGeneratedAlways<U>
          : never
        : never
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
