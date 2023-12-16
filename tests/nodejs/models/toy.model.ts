import type {Optional} from 'sequelize'
import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript'
import {PetModel} from './pet.model'

// Trying to recreate the following interface with sequelize-typescript:
//
// export interface Toy {
//   id: Generated<number>
//   name: string
//   price: number
//   pet_id: number
// }
//
// .addColumn('name', 'varchar(255)', (col) => col.unique().notNull())
// .addColumn('price', 'double precision', (col) => col.notNull())
// .addColumn('pet_id', 'integer', (col) => col.references('pet.id').onDelete('cascade').notNull())

export interface ToyAttributes {
  id: number
  name: string
  price: number
  petId: number
}

export type ToyCreationAttributes = Optional<ToyAttributes, 'id'>

@Table({modelName: 'Toy', tableName: 'toy', timestamps: false, underscored: true})
export class ToyModel extends Model<ToyAttributes, ToyCreationAttributes> {
  @Column({allowNull: false, type: DataType.STRING(255)})
  name: ToyAttributes['name']

  @Column({allowNull: false, type: DataType.INTEGER})
  @ForeignKey(() => PetModel)
  petId: ToyAttributes['petId']

  @Column({allowNull: false, type: DataType.DOUBLE})
  price: ToyAttributes['price']

  @BelongsTo(() => PetModel)
  pet: PetModel
}
