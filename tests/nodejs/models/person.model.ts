import {Optional} from 'sequelize'
import {Column, DataType, HasMany, Model, Table} from 'sequelize-typescript'
import {PetModel} from './pet.model'

// Trying to recreate the following interface with sequelize-typescript:
//
// export interface Person {
//   id: Generated<number>
//   first_name: string | null
//   middle_name: ColumnType<string | null, string | undefined, string | undefined>
//   last_name: string | null
//   gender: 'male' | 'female' | 'other'
//   marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
// }
//
// .addColumn('first_name', 'varchar(255)')
// .addColumn('middle_name', 'varchar(255)')
// .addColumn('last_name', 'varchar(255)')
// .addColumn('gender', 'varchar(50)', (col) => col.notNull())
// .addColumn('marital_status', 'varchar(50)')

export interface PersonAttributes {
  id: number
  firstName: string | null
  middleName: string | null
  lastName: string | null
  gender: 'male' | 'female' | 'other'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | null
}

export type PersonCreationAttributes = Optional<PersonAttributes, 'id'>

@Table({modelName: 'Person', tableName: 'person', timestamps: false, underscored: true})
export class PersonModel extends Model<PersonAttributes, PersonCreationAttributes> {
  declare id: PersonAttributes['id']

  @Column(DataType.STRING(255))
  firstName: PersonAttributes['firstName']

  @Column(DataType.STRING(255))
  middleName: PersonAttributes['middleName']

  @Column(DataType.STRING(255))
  lastName: PersonAttributes['lastName']

  @Column({allowNull: false, type: DataType.STRING(50)})
  gender: PersonAttributes['gender']

  @Column(DataType.STRING(50))
  maritalStatus: PersonAttributes['maritalStatus']

  @HasMany(() => PetModel)
  pets: PetModel[]
}
