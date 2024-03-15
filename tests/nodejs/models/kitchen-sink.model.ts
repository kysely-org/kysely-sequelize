import {
  Model,
  type Association,
  type CreationOptional,
  type ForeignKey,
  type HasManyAddAssociationMixin,
  type HasManyAddAssociationsMixin,
  type HasManyCountAssociationsMixin,
  type HasManyCreateAssociationMixin,
  type HasManyGetAssociationsMixin,
  type HasManyHasAssociationMixin,
  type HasManyHasAssociationsMixin,
  type HasManyRemoveAssociationMixin,
  type HasManyRemoveAssociationsMixin,
  type HasManySetAssociationsMixin,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from 'sequelize'
import {Table} from 'sequelize-typescript'
import type {GeneratedAlways} from '../../../src/index.js'

@Table({modelName: 'KitchenSink', tableName: 'kitchen_sink', underscored: true})
export class KitchenSinkModel extends Model<
  InferAttributes<KitchenSinkModel>,
  InferCreationAttributes<KitchenSinkModel>
> {
  declare id: GeneratedAlways<CreationOptional<number>>
  declare name: string
  declare preferredName: string | null
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare getProjects: HasManyGetAssociationsMixin<any>
  declare addProject: HasManyAddAssociationMixin<any, number>
  declare addProjects: HasManyAddAssociationsMixin<any, number>
  declare setProjects: HasManySetAssociationsMixin<any, number>
  declare removeProject: HasManyRemoveAssociationMixin<any, number>
  declare removeProjects: HasManyRemoveAssociationsMixin<any, number>
  declare hasProject: HasManyHasAssociationMixin<any, number>
  declare hasProjects: HasManyHasAssociationsMixin<any, number>
  declare countProjects: HasManyCountAssociationsMixin
  declare createProject: HasManyCreateAssociationMixin<any, 'ownerId'>
  declare projects?: NonAttribute<any[]>
  get fullName(): NonAttribute<string> {
    return this.name
  }
  declare static associations: {
    projects: Association<KitchenSinkModel, any>
  }
  declare kitchenId: ForeignKey<number | null>
}
