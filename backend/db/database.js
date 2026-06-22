const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data', 'zaneco.db')

let db = null
let SQL = null

class Statement {
  constructor(sql, dbInstance) {
    this.sql = sql
    this.db = dbInstance
    this._stmt = null
  }

  _prepare() {
    if (!this._stmt) {
      this._stmt = this.db.prepare(this.sql)
    }
    return this._stmt
  }

  _toParams(args) {
    if (args.length === 0) return []
    if (args.length === 1 && Array.isArray(args[0])) return args[0]
    return Array.from(args)
  }

  run(...params) {
    const stmt = this._prepare()
    const p = this._toParams(params)
    try {
      stmt.bind(p)
      stmt.step()
      stmt.reset()
      return { lastInsertRowid: this.db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0][0] || 0 }
    } finally {
      stmt.reset()
    }
  }

  get(...params) {
    const stmt = this._prepare()
    const p = this._toParams(params)
    try {
      stmt.bind(p)
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.reset()
        return row
      }
      stmt.reset()
      return undefined
    } finally {
      stmt.reset()
    }
  }

  all(...params) {
    const stmt = this._prepare()
    const p = this._toParams(params)
    const rows = []
    try {
      stmt.bind(p)
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      stmt.reset()
      return rows
    } finally {
      stmt.reset()
    }
  }
}

function prepare(sql) {
  return new Statement(sql, db)
}

function exec(sql) {
  return db.exec(sql)
}

async function init() {
  SQL = await initSqlJs()

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // Enable WAL mode and foreign keys
  db.run('PRAGMA journal_mode=WAL')
  db.run('PRAGMA foreign_keys=ON')

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  db.run(schema)

  // Save initial schema to disk
  save()

  console.log('Database ready at', DB_PATH)
}

function save() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

// Auto-save periodically and on exit
setInterval(save, 5000)
process.on('exit', save)
process.on('SIGINT', () => { save(); process.exit() })

// Export getter for db so it's available after init
module.exports = { prepare, exec, init, save, getDb: () => db }
