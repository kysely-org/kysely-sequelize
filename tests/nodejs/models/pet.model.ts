import {Optional} from 'sequelize'
import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table} from 'sequelize-typescript'
import {PersonModel} from './person.model.js'
import {ToyModel} from './toy.model.js'

// Trying to recreate the following interface with sequelize-typescript:
//
// export interface Pet {
//   id: Generated<number>
//   name: string
//   owner_id: number
//   species: 'dog' | 'cat' | 'hamster'
// }
//
//  .addColumn('name', 'varchar(255)', (col) => col.unique().notNull())
//  .addColumn('owner_id', 'integer', (col) => col.references('person.id').onDelete('cascade').notNull())
//  .addColumn('species', 'varchar(50)', (col) => col.notNull())
//
//  .createIndex('pet_owner_id_index').on('pet').column('owner_id')

export interface PetAttributes {
  id: number
  name: string
  ownerId: number
  species: 'dog' | 'cat' | 'hamster'
}

export type PetCreationAttributes = Optional<PetAttributes, 'id'>

@Table({
  modelName: 'Pet',
  // https://github.com/sequelize/sequelize-typescript/issues/725
  indexes: [{fields: ['owner_id'], name: 'pet_owner_id_index'}],
  tableName: 'pet',
  timestamps: false,
  underscored: true,
})
export class PetModel extends Model<PetAttributes, PetCreationAttributes> {
  declare id: PetAttributes['id']

  @Column({allowNull: false, type: DataType.STRING(255)})
  name: PetAttributes['name']

  @Column({allowNull: false, onDelete: 'CASCADE', type: DataType.INTEGER})
  @ForeignKey(() => PersonModel)
  ownerId: PetAttributes['ownerId']

  @Column({allowNull: false, type: DataType.STRING(50)})
  species: PetAttributes['species']

  @BelongsTo(() => PersonModel)
  owner: PersonModel

  @HasMany(() => ToyModel)
  toys: ToyModel[]
}
