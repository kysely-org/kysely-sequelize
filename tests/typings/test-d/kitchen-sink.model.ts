import type {
  Association,
  CreationOptional,
  ForeignKey,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize'
import {BelongsTo, Column, DataType, HasMany, HasOne, Model, Table} from 'sequelize-typescript'
import type {GeneratedAlways} from '../../../src/index.js'

@Table({modelName: 'KitchenSink', tableName: 'kitchen_sink', underscored: true})
export class KitchenSinkModel extends Model<
  InferAttributes<KitchenSinkModel>,
  InferCreationAttributes<KitchenSinkModel>
> {
  declare id: GeneratedAlways<CreationOptional<number>>

  @Column({allowNull: false, type: DataType.STRING(255)})
  name: string

  @Column(DataType.STRING(255))
  preferredName: string | null

  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare getProjects: HasManyGetAssociationsMixin<ProjectModel>
  declare addProject: HasManyAddAssociationMixin<ProjectModel, number>
  declare addProjects: HasManyAddAssociationsMixin<ProjectModel, number>
  declare setProjects: HasManySetAssociationsMixin<ProjectModel, number>
  declare removeProject: HasManyRemoveAssociationMixin<ProjectModel, number>
  declare removeProjects: HasManyRemoveAssociationsMixin<ProjectModel, number>
  declare hasProject: HasManyHasAssociationMixin<ProjectModel, number>
  declare hasProjects: HasManyHasAssociationsMixin<ProjectModel, number>
  declare countProjects: HasManyCountAssociationsMixin
  declare createProject: HasManyCreateAssociationMixin<ProjectModel, 'kitchenSinkId'>

  @HasMany(() => ProjectModel, 'kitchenSinkId')
  projects: NonAttribute<ProjectModel[]>

  @BelongsTo(() => KitchenModel, 'kitchenId')
  kitchen: NonAttribute<KitchenModel>

  declare kitchenId: ForeignKey<number | null>

  get fullName(): NonAttribute<string> {
    return this.name
  }

  declare static associations: {
    projects: Association<KitchenSinkModel, ProjectModel>
  }
}

@Table({modelName: 'Kitchen', tableName: 'kitchen', timestamps: false, underscored: true})
class KitchenModel extends Model<InferAttributes<KitchenModel>, InferCreationAttributes<KitchenModel>> {
  declare id: GeneratedAlways<CreationOptional<number>>

  @HasMany(() => KitchenSinkModel, 'kitchenId')
  kitchenSinks: KitchenSinkModel[]
}

@Table({modelName: 'Project', tableName: 'project', timestamps: false, underscored: true})
class ProjectModel extends Model<InferAttributes<ProjectModel>, InferCreationAttributes<ProjectModel>> {
  declare id: GeneratedAlways<CreationOptional<number>>

  @HasOne(() => KitchenSinkModel, 'kitchenId')
  kitchenSink: KitchenSinkModel

  declare kitchenSinkId: ForeignKey<number | null>
}
