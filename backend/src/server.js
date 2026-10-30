import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'

const port = Number(process.env.PORT || 4000)
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const adminUsername = process.env.ADMIN_USERNAME || ''
const adminPassword = process.env.ADMIN_PASSWORD || ''
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'School Accountant'
const jwtSecret = process.env.JWT_SECRET || ''
const sessionCookie = 'gs_busanza_session'
const sessionDurationMs = 8 * 60 * 60 * 1000
const pool = mysql.createPool(process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gs_busanza_accounting',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
})

const recordTypes = new Set(['stock', 'filing', 'payments', 'feeding', 'suppliers', 'approvals'])
const requiredFields = {
  stock: ['academic_year', 'fiscal_year', 'date', 'item_code', 'item_name', 'unit'],
  filing: ['academic_year', 'fiscal_year', 'file_code', 'date', 'title', 'category', 'status'],
  payments: ['academic_year', 'fiscal_year', 'payment_ref', 'request_date', 'supplier', 'purpose', 'amount_before', 'net_payable', 'status'],
  feeding: ['academic_year', 'fiscal_year', 'date', 'term', 'class_group', 'expected_fee', 'amount_collected', 'payment_method'],
  suppliers: ['academic_year', 'fiscal_year', 'supplier_code', 'name', 'tin', 'tax_clearance_checked'],
  approvals: ['academic_year', 'fiscal_year', 'reference', 'type', 'submitted_by', 'amount', 'submitted_at', 'status'],
}

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '32kb' }))
app.use((_request, _response, next) => {
  initializeServer().then(() => next(), next)
})

function validYear(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{4}$/.test(value)) return false
  const [start, end] = value.split('-').map(Number)
  return start >= 2022 && start <= 2031 && end === start + 1
}

function authenticate(request, response, next) {
  const token = request.cookies[sessionCookie]
  if (!token) return response.status(401).json({ error: 'Sign in to continue.' })
  try {
    request.user = jwt.verify(token, jwtSecret)
    return next()
  } catch {
    response.clearCookie(sessionCookie, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' })
    return response.status(401).json({ error: 'Your session expired. Please sign in again.' })
  }
}

function requireAccountant(request, response, next) {
  if (request.user.role !== 'accountant') {
    return response.status(403).json({ error: 'Only the accountant can manage staff accounts.' })
  }
  return next()
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
})

function validateRecord(type, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'A record object is required.'
  }
  const missing = requiredFields[type].find((key) => input[key] === undefined || input[key] === null || input[key] === '')
  if (missing) return `${missing} is required.`
  if (!validYear(input.academic_year) || !validYear(input.fiscal_year)) {
    return 'Choose a valid academic year and fiscal year.'
  }

  const numericFields = {
    stock: ['opening_qty', 'received_qty', 'issued_qty'],
    filing: ['amount'],
    payments: ['amount_before', 'tax_amount', 'net_payable'],
    feeding: ['expected_fee', 'amount_collected'],
    suppliers: ['outstanding'],
    approvals: ['amount'],
  }[type] || []
  for (const field of numericFields) {
    if (input[field] === undefined || input[field] === '') continue
    if (!Number.isFinite(Number(input[field])) || Number(input[field]) < 0) {
      return `${field} must be a non-negative number.`
    }
  }

  if (type === 'filing' && !['Complete', 'Partial', 'Missing'].includes(input.status)) {
    return 'status must be Complete, Partial, or Missing.'
  }
  if (type === 'payments' && !['Pending approval', 'Approved', 'Paid'].includes(input.status)) {
    return 'status must be Pending approval, Approved, or Paid.'
  }
  if (type === 'suppliers' && !['Yes', 'No', 'Pending'].includes(input.tax_clearance_checked)) {
    return 'tax_clearance_checked must be Yes, No, or Pending.'
  }
  if (type === 'approvals' && !['Pending', 'Approved', 'Rejected'].includes(input.status)) {
    return 'status must be Pending, Approved, or Rejected.'
  }

  const payload = { ...input }
  for (const field of numericFields) {
    if (type === 'stock' || payload[field] !== undefined && payload[field] !== '') {
      payload[field] = Number(payload[field] || 0)
    }
  }
  if (type === 'stock') payload.balance = payload.opening_qty + payload.received_qty - payload.issued_qty
  if (type === 'feeding') {
    payload.expected_fee = Number(payload.expected_fee || 0)
    payload.amount_collected = Number(payload.amount_collected || 0)
    payload.balance_due = payload.expected_fee - payload.amount_collected
    payload.expected = payload.expected_fee
    payload.collected = payload.amount_collected
  }
  if (type === 'suppliers') {
    payload.outstanding = Number(payload.outstanding || 0)
    payload.tax_status = payload.tax_clearance_checked === 'Yes' ? 'Verified'
      : payload.tax_clearance_checked === 'No' ? 'Not verified' : 'Pending check'
  }
  if (type === 'payments') {
    payload.amount = payload.net_payable
    payload.payee = payload.supplier
    payload.description = payload.purpose
    payload.date = payload.payment_date || payload.request_date
    payload.method = payload.payment_method || ''
  }
  return payload
}

function getYearFilters(request, response) {
  const { academicYear, fiscalYear } = request.query
  if (!validYear(academicYear) || !validYear(fiscalYear)) {
    response.status(400).json({ error: 'Choose a valid academic year and fiscal year.' })
    return null
  }
  return [academicYear, fiscalYear]
}

async function getRecords(type, academicYear, fiscalYear) {
  const [rows] = type
    ? await pool.execute(
      'SELECT id, academic_year, fiscal_year, payload FROM accounting_records WHERE record_type = ? AND academic_year = ? AND fiscal_year = ? ORDER BY created_at DESC, id DESC',
      [type, academicYear, fiscalYear],
    )
    : await pool.execute(
      'SELECT id, record_type, academic_year, fiscal_year, payload FROM accounting_records WHERE academic_year = ? AND fiscal_year = ? ORDER BY created_at DESC, id DESC',
      [academicYear, fiscalYear],
    )

  if (type) return rows.map(({ id, academic_year, fiscal_year, payload }) => ({ id: String(id), academic_year, fiscal_year, ...payload }))
  const records = Object.fromEntries([...recordTypes].map((recordType) => [recordType, []]))
  for (const row of rows) records[row.record_type].push({
    id: String(row.id),
    academic_year: row.academic_year,
    fiscal_year: row.fiscal_year,
    ...row.payload,
  })
  return records
}

function stockBalance(rows, location, itemCode) {
  const normalizedCode = itemCode.trim().toLowerCase()
  return rows.reduce((total, { payload }) => {
    if (
      String(payload.location || '').trim() !== location
      || String(payload.item_code || '').trim().toLowerCase() !== normalizedCode
    ) return total
    return total + Number(payload.opening_qty || 0) + Number(payload.received_qty || 0) - Number(payload.issued_qty || 0)
  }, 0)
}

function isDuplicateEntry(error) {
  return error?.code === 'ER_DUP_ENTRY' || error?.code === '1062'
}

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', loginLimiter, async (request, response, next) => {
  const { username, password } = request.body || {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    return response.status(400).json({ error: 'Username and password are required.' })
  }
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, display_name, role, stock_location, password_hash FROM accounting_users WHERE username = ? LIMIT 1',
      [username],
    )
    const account = rows[0]
    const matchesPassword = account ? await bcrypt.compare(password, account.password_hash) : false
    if (!matchesPassword) {
      return response.status(401).json({ error: 'Username or password is incorrect.' })
    }
    const user = {
      id: String(account.id),
      username: account.username,
      displayName: account.display_name,
      role: account.role,
      stockLocation: account.stock_location,
    }
    const token = jwt.sign(user, jwtSecret, { expiresIn: '8h' })
    response.cookie(sessionCookie, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionDurationMs,
      path: '/',
    })
    return response.json({ user })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/auth/me', authenticate, (request, response) => {
  response.json({ user: request.user })
})

app.post('/api/auth/logout', authenticate, (_request, response) => {
  response.clearCookie(sessionCookie, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' })
  response.status(204).end()
})

app.use('/api/users', authenticate, requireAccountant)

app.get('/api/users', async (_request, response, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, display_name, role, stock_location, created_at FROM accounting_users ORDER BY created_at, id',
    )
    response.json({
      users: users.map(({ id, username, display_name, role, stock_location, created_at }) => ({
        id: String(id),
        username,
        displayName: display_name,
        role,
        stockLocation: stock_location,
        createdAt: created_at,
      })),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/users', async (request, response, next) => {
  const { username, password, displayName, stockLocation } = request.body || {}
  if (
    typeof username !== 'string'
    || !/^[a-zA-Z0-9._-]{3,32}$/.test(username)
    || typeof password !== 'string'
    || password.length < 12
    || password.length > 128
    || typeof displayName !== 'string'
    || !displayName.trim()
    || displayName.trim().length > 120
    || typeof stockLocation !== 'string'
    || !stockLocation.trim()
    || stockLocation.trim().length > 120
  ) {
    return response.status(400).json({
      error: 'Provide a 3–32 character username, a 12–128 character password, a display name, and a stock location.',
    })
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.execute(
      'INSERT INTO accounting_users (username, display_name, role, stock_location, password_hash) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), displayName.trim(), 'storekeeper', stockLocation.trim(), passwordHash],
    )
    response.status(201).json({
      user: {
        id: String(result.insertId),
        username: username.trim(),
        displayName: displayName.trim(),
        role: 'storekeeper',
        stockLocation: stockLocation.trim(),
      },
    })
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return response.status(409).json({ error: 'That username is already in use.' })
    }
    next(error)
  }
})

app.patch('/api/users/:id/password', async (request, response, next) => {
  const { id } = request.params
  const { password } = request.body || {}
  if (!/^\d+$/.test(id)) {
    return response.status(400).json({ error: 'Staff account id is invalid.' })
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return response.status(400).json({ error: 'Password must be between 12 and 128 characters.' })
  }
  try {
    const [result] = await pool.execute(
      'UPDATE accounting_users SET password_hash = ? WHERE id = ? AND role = ?',
      [await bcrypt.hash(password, 12), id, 'storekeeper'],
    )
    if (!result.affectedRows) {
      return response.status(404).json({ error: 'Storekeeper account not found.' })
    }
    response.json({ message: 'Storekeeper password changed.' })
  } catch (error) {
    next(error)
  }
})

app.use('/api/records', authenticate)

app.get('/api/records', async (request, response, next) => {
  const years = getYearFilters(request, response)
  if (!years) return
  try {
    if (request.user.role === 'storekeeper') {
      const records = Object.fromEntries([...recordTypes].map((recordType) => [recordType, []]))
      records.stock = (await getRecords('stock', ...years)).filter((row) => row.location === request.user.stockLocation)
      return response.json({ records })
    }
    response.json({ records: await getRecords(undefined, ...years) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/records/:type', async (request, response, next) => {
  const { type } = request.params
  if (!recordTypes.has(type)) return response.status(404).json({ error: 'Register not found.' })
  if (request.user.role === 'storekeeper' && type !== 'stock') {
    return response.status(403).json({ error: 'Storekeepers can only access their assigned stock.' })
  }
  const years = getYearFilters(request, response)
  if (!years) return
  try {
    let records = await getRecords(type, ...years)
    if (request.user.role === 'storekeeper') {
      records = records.filter((row) => row.location === request.user.stockLocation)
    }
    response.json({ records })
  } catch (error) {
    next(error)
  }
})

app.post('/api/records/:type', async (request, response, next) => {
  const { type } = request.params
  if (!recordTypes.has(type)) return response.status(404).json({ error: 'Register not found.' })
  if (request.user.role === 'storekeeper' && type !== 'stock') {
    return response.status(403).json({ error: 'Storekeepers can only record movements in their assigned stock.' })
  }
  const payload = validateRecord(type, request.body)
  if (typeof payload === 'string') return response.status(400).json({ error: payload })
  if (type === 'stock') {
    if (request.user.role === 'storekeeper' && payload.location !== request.user.stockLocation) {
      return response.status(403).json({ error: 'Stock movements must use your assigned store location.' })
    }
    payload.recorded_by = request.user.username
    if (request.user.role === 'storekeeper' && !payload.prepared_by) payload.prepared_by = request.user.displayName
  }
  try {
    if (type === 'stock') {
      const connection = await pool.getConnection()
      let transactionStarted = false
      try {
        await connection.beginTransaction()
        transactionStarted = true
        const [stockRows] = await connection.execute(
          'SELECT payload FROM accounting_records WHERE record_type = ? AND academic_year = ? AND fiscal_year = ? FOR UPDATE',
          ['stock', payload.academic_year, payload.fiscal_year],
        )
        const existingRows = stockRows.filter(({ payload: row }) => (
          String(row.location || '').trim() === payload.location
          && String(row.item_code || '').trim().toLowerCase() === payload.item_code.trim().toLowerCase()
        ))
        const available = stockBalance(stockRows, payload.location, payload.item_code)
        const opening = Number(payload.opening_qty || 0)
        const received = Number(payload.received_qty || 0)
        const issued = Number(payload.issued_qty || 0)
        if (existingRows.length && opening > 0) {
          await connection.rollback()
          transactionStarted = false
          return response.status(400).json({ error: 'Opening quantity can only be entered for a new item. Use Quantity received for existing stock.' })
        }
        if (issued > available + opening + received) {
          await connection.rollback()
          transactionStarted = false
          return response.status(400).json({
            error: `Cannot issue ${issued} units; only ${Math.max(0, available + opening + received)} units are available at this store.`,
          })
        }
        const [result] = await connection.execute(
          'INSERT INTO accounting_records (record_type, academic_year, fiscal_year, payload) VALUES (?, ?, ?, ?)',
          [type, payload.academic_year, payload.fiscal_year, JSON.stringify(payload)],
        )
        await connection.commit()
        transactionStarted = false
        return response.status(201).json({ record: { id: String(result.insertId), ...payload } })
      } catch (error) {
        if (transactionStarted) await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    }
    const [result] = await pool.execute(
      'INSERT INTO accounting_records (record_type, academic_year, fiscal_year, payload) VALUES (?, ?, ?, ?)',
      [type, payload.academic_year, payload.fiscal_year, JSON.stringify(payload)],
    )
    response.status(201).json({ record: { id: String(result.insertId), ...payload } })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/records/:type/:id', async (request, response, next) => {
  const { type, id } = request.params
  if (request.user.role !== 'accountant') {
    return response.status(403).json({ error: 'Only the accountant can review approval requests.' })
  }
  if (type !== 'approvals') return response.status(404).json({ error: 'This register does not support updates.' })
  if (!/^\d+$/.test(id)) return response.status(400).json({ error: 'Record id is invalid.' })
  const { status } = request.body
  if (!['Approved', 'Rejected'].includes(status)) {
    return response.status(400).json({ error: 'status must be Approved or Rejected.' })
  }
  try {
    const [rows] = await pool.execute(
      'SELECT academic_year, fiscal_year, payload FROM accounting_records WHERE id = ? AND record_type = ? LIMIT 1',
      [id, type],
    )
    if (!rows.length) return response.status(404).json({ error: 'Approval request not found.' })
    const updated = {
      ...rows[0].payload,
      academic_year: rows[0].academic_year,
      fiscal_year: rows[0].fiscal_year,
      status,
    }
    await pool.execute(
      'UPDATE accounting_records SET payload = ? WHERE id = ? AND record_type = ?',
      [JSON.stringify(updated), id, type],
    )
    response.json({ record: { id, ...updated } })
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error('Accounting API request failed:', error)
  response.status(500).json({ error: 'The accounting service could not complete the request.' })
})

async function initialize() {
  if (
    !adminUsername
    || adminPassword.length < 12
    || jwtSecret.length < 32
    || adminPassword.startsWith('replace-with-')
    || jwtSecret.startsWith('replace-with-')
  ) {
    throw new Error('Set ADMIN_USERNAME, an ADMIN_PASSWORD of at least 12 characters, and a JWT_SECRET of at least 32 characters in backend/.env.')
  }
  await pool.query('SELECT 1')
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS accounting_users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(32) NOT NULL,
      display_name VARCHAR(120) NOT NULL,
      role ENUM('accountant', 'storekeeper') NOT NULL,
      stock_location VARCHAR(120) NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_accounting_users_username (username)
    ) ENGINE=InnoDB
  `)
  const [accountants] = await pool.execute(
    'SELECT id, display_name, role, stock_location, password_hash FROM accounting_users WHERE username = ? LIMIT 1',
    [adminUsername],
  )
  if (!accountants.length) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await pool.execute(
      'INSERT INTO accounting_users (username, display_name, role, stock_location, password_hash) VALUES (?, ?, ?, NULL, ?)',
      [adminUsername, adminDisplayName, 'accountant', passwordHash],
    )
  } else {
    const accountant = accountants[0]
    const passwordMatches = await bcrypt.compare(adminPassword, accountant.password_hash)
    if (
      !passwordMatches
      || accountant.display_name !== adminDisplayName
      || accountant.role !== 'accountant'
      || accountant.stock_location !== null
    ) {
      const passwordHash = passwordMatches ? accountant.password_hash : await bcrypt.hash(adminPassword, 12)
      await pool.execute(
        'UPDATE accounting_users SET display_name = ?, role = ?, stock_location = NULL, password_hash = ? WHERE id = ?',
        [adminDisplayName, 'accountant', passwordHash, accountant.id],
      )
    }
  }
  await pool.execute(
    'DELETE FROM accounting_users WHERE role = ? AND username <> ?',
    ['accountant', adminUsername],
  )
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS accounting_records (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      record_type ENUM('stock', 'filing', 'payments', 'feeding', 'suppliers', 'approvals') NOT NULL,
      academic_year CHAR(9) NULL,
      fiscal_year CHAR(9) NULL,
      payload JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_accounting_records_type_created (record_type, created_at),
      INDEX idx_accounting_records_years (academic_year, fiscal_year, record_type, created_at)
    ) ENGINE=InnoDB
  `)
  const [academicYearColumn] = await pool.query("SHOW COLUMNS FROM accounting_records LIKE 'academic_year'")
  if (!academicYearColumn.length) {
    await pool.execute('ALTER TABLE accounting_records ADD COLUMN academic_year CHAR(9) NULL AFTER record_type')
  }
  const [fiscalYearColumn] = await pool.query("SHOW COLUMNS FROM accounting_records LIKE 'fiscal_year'")
  if (!fiscalYearColumn.length) {
    await pool.execute('ALTER TABLE accounting_records ADD COLUMN fiscal_year CHAR(9) NULL AFTER academic_year')
  }
  await pool.execute(`
    UPDATE accounting_records
    SET payload = JSON_SET(
      payload,
      '$.academic_year', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.academic_year')), '2026-2027'),
      '$.fiscal_year', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.fiscal_year')), '2026-2027')
    )
    WHERE JSON_EXTRACT(payload, '$.academic_year') IS NULL
       OR JSON_EXTRACT(payload, '$.fiscal_year') IS NULL
  `)
  await pool.execute(`
    UPDATE accounting_records
    SET academic_year = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.academic_year')), '2026-2027'),
        fiscal_year = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.fiscal_year')), '2026-2027')
    WHERE academic_year IS NULL OR fiscal_year IS NULL
  `)
  await pool.execute('ALTER TABLE accounting_records MODIFY academic_year CHAR(9) NOT NULL, MODIFY fiscal_year CHAR(9) NOT NULL')
  const [yearIndex] = await pool.query("SHOW INDEX FROM accounting_records WHERE Key_name = 'idx_accounting_records_years'")
  if (!yearIndex.length) {
    await pool.execute('CREATE INDEX idx_accounting_records_years ON accounting_records (academic_year, fiscal_year, record_type, created_at)')
  }
}

let initialization
export function initializeServer() {
  if (!initialization) {
    initialization = initialize().catch((error) => {
      initialization = undefined
      throw error
    })
  }
  return initialization
}

export { app }
export default app

if (process.env.VERCEL !== '1') {
  initializeServer()
    .then(() => app.listen(port, () => console.log(`GS Busanza accounting API listening on http://localhost:${port}`)))
    .catch((error) => {
      console.error('Could not start the accounting API. Check the MySQL service and backend/.env settings.', error)
      process.exitCode = 1
    })
}
