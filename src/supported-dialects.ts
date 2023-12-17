import type {Dialect} from 'sequelize'

export const SUPPORTED_DIALECTS = [
  // 'mariadb', figure out how to test this
  // 'mssql', waiting for kysely to release a new version
  'mysql',
  'postgres',
  // 'sqlite', figure out how to test this
] as const satisfies Dialect[]

export type SupportedDialect = (typeof SUPPORTED_DIALECTS)[number]

function isDialectSupported(dialect: string): dialect is SupportedDialect {
  return SUPPORTED_DIALECTS.includes(dialect as any)
}

export function assertSupportedDialect(dialect: string) {
  if (!isDialectSupported(dialect)) {
    throw new Error(`Unsupported dialect: ${dialect}!`)
  }
}
