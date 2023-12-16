import type {Dialect} from 'sequelize'

const SUPPORTED_DIALECTS = ['mariadb', 'mssql', 'mysql', 'postgres', 'sqlite'] as const satisfies Dialect[]

export type SupportedDialect = (typeof SUPPORTED_DIALECTS)[number]

function isDialectSupported(dialect: string): dialect is SupportedDialect {
  return SUPPORTED_DIALECTS.includes(dialect as any)
}

export function assertSupportedDialect(dialect: string) {
  if (!isDialectSupported(dialect)) {
    throw new Error(`Unsupported dialect: ${dialect}!`)
  }
}
