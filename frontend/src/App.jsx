import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Utensils,
  Wallet,
  X,
} from 'lucide-react'

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Stock register', icon: Boxes },
  { id: 'filing', label: 'Filing register', icon: FileText },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'feeding', label: 'School feeding', icon: Utensils },
  { id: 'suppliers', label: 'Suppliers', icon: CircleDollarSign },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
]

const definitions = {
  stock: {
    singular: 'stock item',
    title: 'Stock register',
    description: 'Record dated stock movements, item references, locations, and signed checks.',
    columns: [
      ['date', 'Date'],
      ['item_code', 'Item code'],
      ['item_name', 'Item description'],
      ['unit', 'Unit'],
      ['opening_qty', 'Opening qty'],
      ['received_qty', 'Qty received'],
      ['issued_qty', 'Qty issued'],
      ['balance', 'Balance qty'],
      ['reference_in', 'Reference in'],
      ['reference_out', 'Reference out'],
      ['location', 'Store / location'],
      ['issued_to', 'Issued to / purpose'],
      ['prepared_by', 'Prepared by'],
      ['checked_by', 'Checked by'],
      ['remarks', 'Remarks'],
    ],
    fields: [
      ['date', 'Date', 'date'],
      ['item_code', 'Item code', 'text'],
      ['item_name', 'Item description', 'text'],
      ['unit', 'Unit', 'text'],
      ['opening_qty', 'Opening quantity', 'number'],
      ['received_qty', 'Quantity received', 'number'],
      ['issued_qty', 'Quantity issued', 'number'],
      ['reference_in', 'Reference in', 'text'],
      ['reference_out', 'Reference out', 'text'],
      ['location', 'Store / location', 'text'],
      ['issued_to', 'Issued to / purpose', 'text'],
      ['prepared_by', 'Prepared by', 'text'],
      ['checked_by', 'Checked by', 'text'],
      ['remarks', 'Remarks', 'text'],
    ],
  },
  filing: {
    singular: 'file',
    title: 'Filing register',
    description: 'Track each financial file, its supporting documents, storage locations, and review follow-up.',
    columns: [
      ['file_code', 'File code'],
      ['date', 'Date'],
      ['title', 'File / document title'],
      ['category', 'Category'],
      ['supplier_payee', 'Supplier / payee'],
      ['amount', 'Amount (RWF)'],
      ['period', 'Period / term'],
      ['required_documents', 'Required documents'],
      ['status', 'Complete?'],
      ['physical_location', 'Physical location'],
      ['digital_file', 'Digital file name / path'],
      ['prepared_by', 'Prepared by'],
      ['reviewed_by', 'Reviewed by'],
      ['missing_items', 'Missing items / follow-up'],
      ['remarks', 'Remarks'],
    ],
    fields: [
      ['file_code', 'File code', 'text'],
      ['date', 'Date', 'date'],
      ['title', 'Document or file title', 'text'],
      ['category', 'Category', 'text'],
      ['supplier_payee', 'Supplier / payee', 'text'],
      ['amount', 'Amount (RWF)', 'number'],
      ['period', 'Period / term', 'text'],
      ['required_documents', 'Required documents', 'text'],
      ['status', 'Complete?', 'select', ['Complete', 'Partial', 'Missing']],
      ['physical_location', 'Physical location', 'text'],
      ['digital_file', 'Digital file name / path', 'text'],
      ['prepared_by', 'Prepared by', 'text'],
      ['reviewed_by', 'Reviewed by', 'text'],
      ['missing_items', 'Missing items / follow-up', 'text'],
      ['remarks', 'Remarks', 'text'],
    ],
  },
  payments: {
    singular: 'payment',
    title: 'Payment register',
    description: 'Track supplier payments, tax checks, supporting references, approval, and proof of payment.',
    columns: [
      ['payment_ref', 'Payment ref'],
      ['request_date', 'Request date'],
      ['supplier', 'Supplier'],
      ['tin', 'TIN'],
      ['purpose', 'Purpose / items'],
      ['amount_before', 'Amount before (RWF)'],
      ['tax_checked', 'Tax type checked'],
      ['tax_amount', 'Tax amount (RWF)'],
      ['net_payable', 'Net payable (RWF)'],
      ['budget_line', 'Budget line'],
      ['budget_ref_date', 'Budget ref date'],
      ['internal_requisition_ref', 'Internal requisition ref'],
      ['po_contract_ref', 'PO / contract ref'],
      ['invoice_ref', 'Invoice ref'],
      ['pv_delivery_ref', 'PV / delivery ref'],
      ['voucher', 'Voucher'],
      ['status', 'Approval status'],
      ['payment_date', 'Payment date'],
      ['payment_method', 'Payment method'],
      ['proof_bank_ref', 'Proof / bank ref'],
      ['file_code', 'File code'],
      ['prepared_by', 'Prepared by'],
      ['remarks', 'Remarks'],
    ],
    fields: [
      ['payment_ref', 'Payment reference', 'text'],
      ['request_date', 'Request date', 'date'],
      ['supplier', 'Supplier / payee', 'text'],
      ['tin', 'TIN', 'text'],
      ['purpose', 'Purpose / items', 'text'],
      ['amount_before', 'Amount before tax (RWF)', 'number'],
      ['tax_checked', 'Tax type checked', 'text'],
      ['tax_amount', 'Tax amount (RWF)', 'number'],
      ['net_payable', 'Net payable (RWF)', 'number'],
      ['budget_line', 'Budget line', 'text'],
      ['budget_ref_date', 'Budget reference date', 'date'],
      ['internal_requisition_ref', 'Internal requisition reference', 'text'],
      ['po_contract_ref', 'PO / contract reference', 'text'],
      ['invoice_ref', 'Invoice reference', 'text'],
      ['pv_delivery_ref', 'PV / delivery reference', 'text'],
      ['voucher', 'Voucher reference', 'text'],
      ['status', 'Approval status', 'select', ['Pending approval', 'Approved', 'Paid']],
      ['payment_date', 'Payment date', 'date'],
      ['payment_method', 'Payment method', 'select', ['Bank transfer', 'Cash', 'Mobile money', 'Cheque']],
      ['proof_bank_ref', 'Proof / bank reference', 'text'],
      ['file_code', 'File code', 'text'],
      ['prepared_by', 'Prepared by', 'text'],
      ['remarks', 'Remarks', 'text'],
    ],
  },
  feeding: {
    singular: 'feeding record',
    title: 'School feeding',
    description: 'Track student contributions, receipts, deposits, and reconciliation for school feeding.',
    columns: [
      ['date', 'Date'],
      ['term', 'Term'],
      ['class_group', 'Class / group'],
      ['student_reference', 'Student / reference'],
      ['expected_fee', 'Expected fee (RWF)'],
      ['amount_collected', 'Amount collected (RWF)'],
      ['balance_due', 'Balance due (RWF)'],
      ['receipt_no', 'Receipt no.'],
      ['payment_method', 'Payment method'],
      ['bank_cash_ref', 'Bank / cash ref'],
      ['collector', 'Collector'],
      ['deposited', 'Deposited?'],
      ['deposit_date', 'Deposit date'],
      ['expense_ref', 'Expense ref (if applicable)'],
      ['file_code', 'File code'],
      ['remarks', 'Remarks'],
    ],
    fields: [
      ['date', 'Date', 'date'],
      ['term', 'Term', 'select', ['Term 1', 'Term 2', 'Term 3']],
      ['class_group', 'Class / group', 'text'],
      ['student_reference', 'Student / reference', 'text'],
      ['expected_fee', 'Expected fee (RWF)', 'number'],
      ['amount_collected', 'Amount collected (RWF)', 'number'],
      ['receipt_no', 'Receipt number', 'text'],
      ['payment_method', 'Payment method', 'select', ['Cash', 'Bank transfer', 'Mobile money', 'Other']],
      ['bank_cash_ref', 'Bank / cash reference', 'text'],
      ['collector', 'Collector', 'text'],
      ['deposited', 'Deposited?', 'select', ['Yes', 'No']],
      ['deposit_date', 'Deposit date', 'date'],
      ['expense_ref', 'Expense reference (if applicable)', 'text'],
      ['file_code', 'File code', 'text'],
      ['remarks', 'Remarks', 'text'],
    ],
  },
  suppliers: {
    singular: 'supplier',
    title: 'Suppliers',
    description: 'Maintain supplier identity, procurement references, tax clearance, and payment history.',
    columns: [
      ['supplier_code', 'Supplier code'],
      ['name', 'Supplier name'],
      ['tin', 'TIN'],
      ['contact', 'Contact'],
      ['address', 'Address'],
      ['goods_service', 'Goods / service'],
      ['contract_po_ref', 'Contract / PO ref'],
      ['tax_clearance_checked', 'Tax clearance checked?'],
      ['outstanding', 'Outstanding (RWF)'],
      ['last_invoice_ref', 'Last invoice ref'],
      ['last_payment_date', 'Last payment date'],
      ['file_code', 'File code'],
      ['remarks', 'Remarks'],
    ],
    fields: [
      ['supplier_code', 'Supplier code', 'text'],
      ['name', 'Supplier name', 'text'],
      ['tin', 'TIN', 'text'],
      ['contact', 'Contact details', 'text'],
      ['address', 'Address', 'text'],
      ['goods_service', 'Goods / service', 'text'],
      ['contract_po_ref', 'Contract / PO reference', 'text'],
      ['tax_clearance_checked', 'Tax clearance checked?', 'select', ['Yes', 'No', 'Pending']],
      ['outstanding', 'Outstanding (RWF)', 'number'],
      ['last_invoice_ref', 'Last invoice reference', 'text'],
      ['last_payment_date', 'Last payment date', 'date'],
      ['file_code', 'File code', 'text'],
      ['remarks', 'Remarks', 'text'],
    ],
  },
  approvals: {
    singular: 'approval request',
    title: 'Approval workflow',
    description: 'Review items prepared by the accountant and record authorized decisions.',
    columns: [
      ['reference', 'Reference'],
      ['type', 'Request type'],
      ['submitted_by', 'Prepared by'],
      ['amount', 'Amount (RWF)'],
      ['submitted_at', 'Submitted'],
      ['status', 'Decision'],
    ],
    fields: [
      ['reference', 'Reference', 'text'],
      ['type', 'Request type', 'text'],
      ['submitted_by', 'Prepared by', 'text'],
      ['amount', 'Amount (RWF)', 'number'],
      ['submitted_at', 'Submitted date', 'date'],
      ['status', 'Decision', 'select', ['Pending', 'Approved', 'Rejected']],
      ['approver', 'Authorized officer', 'text'],
    ],
  },
}

function normalizeFilingRecord(record) {
  return {
    ...record,
    date: record.date || '',
    supplier_payee: record.supplier_payee || '',
    amount: record.amount ?? '',
    period: record.period || '',
    required_documents: record.required_documents || '',
    status: record.status === 'In progress' ? 'Partial' : record.status,
    physical_location: record.physical_location || record.location || '',
    digital_file: record.digital_file || '',
    prepared_by: record.prepared_by || '',
    reviewed_by: record.reviewed_by || '',
    missing_items: record.missing_items || record.missing_documents || '',
    remarks: record.remarks || '',
  }
}

function normalizePaymentRecord(record) {
  const amount = record.amount ?? record.net_payable ?? ''
  return {
    ...record,
    payment_ref: record.payment_ref || record.reference || '',
    request_date: record.request_date || record.date || '',
    supplier: record.supplier || record.payee || '',
    purpose: record.purpose || record.description || '',
    amount_before: record.amount_before ?? amount,
    tax_checked: record.tax_checked || '',
    tax_amount: record.tax_amount ?? '',
    net_payable: record.net_payable ?? amount,
    budget_line: record.budget_line || '',
    budget_ref_date: record.budget_ref_date || '',
    internal_requisition_ref: record.internal_requisition_ref || '',
    po_contract_ref: record.po_contract_ref || '',
    invoice_ref: record.invoice_ref || '',
    pv_delivery_ref: record.pv_delivery_ref || '',
    voucher: record.voucher || record.reference || '',
    payment_date: record.payment_date || record.date || '',
    payment_method: record.payment_method || record.method || '',
    proof_bank_ref: record.proof_bank_ref || record.proof || '',
    prepared_by: record.prepared_by || '',
  }
}

function normalizeFeedingRecord(record) {
  const expectedFee = Number(record.expected_fee ?? record.expected ?? 0)
  const amountCollected = Number(record.amount_collected ?? record.collected ?? 0)
  return {
    ...record,
    term: record.term || record.description || '',
    class_group: record.class_group || '',
    student_reference: record.student_reference || '',
    expected_fee: expectedFee,
    amount_collected: amountCollected,
    balance_due: expectedFee - amountCollected,
    receipt_no: record.receipt_no || '',
    payment_method: record.payment_method || record.method || '',
    bank_cash_ref: record.bank_cash_ref || '',
    collector: record.collector || '',
    deposited: record.deposited || '',
    deposit_date: record.deposit_date || '',
    expense_ref: record.expense_ref || '',
    file_code: record.file_code || '',
    remarks: record.remarks || record.notes || '',
  }
}

function normalizeSupplierRecord(record) {
  return {
    ...record,
    supplier_code: record.supplier_code || '',
    address: record.address || '',
    goods_service: record.goods_service || '',
    contract_po_ref: record.contract_po_ref || '',
    tax_clearance_checked: record.tax_clearance_checked || (
      record.tax_status === 'Verified' ? 'Yes'
        : record.tax_status === 'Not verified' ? 'No'
          : record.tax_status === 'Pending check' ? 'Pending'
            : ''
    ),
    outstanding: record.outstanding ?? 0,
    last_invoice_ref: record.last_invoice_ref || '',
    last_payment_date: record.last_payment_date || '',
    file_code: record.file_code || '',
    remarks: record.remarks || '',
  }
}

function normalizeYearFields(record) {
  return {
    ...record,
    academic_year: record.academic_year || defaultYear,
    fiscal_year: record.fiscal_year || defaultYear,
  }
}

const apiUrl = import.meta.env.VITE_API_URL || ''
const money = (value) => new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(Number(value) || 0)

const emptyRecords = Object.fromEntries(['stock', 'filing', 'payments', 'feeding', 'suppliers', 'approvals'].map((type) => [type, []]))
const yearOptions = Array.from({ length: 10 }, (_value, index) => {
  const start = 2022 + index
  return `${start}-${start + 1}`
})
const defaultYear = '2026-2027'

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return body
}

function readSelectedYears() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('gs-accounting-years') || '{}')
    return {
      academicYear: yearOptions.includes(saved.academicYear) ? saved.academicYear : defaultYear,
      fiscalYear: yearOptions.includes(saved.fiscalYear) ? saved.fiscalYear : defaultYear,
    }
  } catch (error) {
    console.error('Could not read selected accounting years.', error)
    return { academicYear: defaultYear, fiscalYear: defaultYear }
  }
}

function App() {
  const [active, setActive] = useState('dashboard')
  const [records, setRecords] = useState(emptyRecords)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [academicYear, setAcademicYear] = useState(() => readSelectedYears().academicYear)
  const [fiscalYear, setFiscalYear] = useState(() => readSelectedYears().fiscalYear)
  const [search, setSearch] = useState('')
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [modal, setModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let activeEffect = true
    request('/auth/me')
      .then(({ user: sessionUser }) => {
        if (activeEffect) setUser(sessionUser)
      })
      .catch((error) => {
        if (!activeEffect) return
        if (error.status !== 401) setAuthError(`Could not connect to the accounting service: ${error.message}`)
      })
      .finally(() => {
        if (activeEffect) setAuthLoading(false)
      })
    return () => { activeEffect = false }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('gs-accounting-years', JSON.stringify({ academicYear, fiscalYear }))
    } catch (error) {
      console.error('Could not save selected accounting years.', error)
    }
  }, [academicYear, fiscalYear])

  useEffect(() => {
    if (!user) {
      setRecords(emptyRecords)
      return undefined
    }
    let activeEffect = true
    async function loadRecords() {
      setLoading(true)
      try {
        const query = new URLSearchParams({ academicYear, fiscalYear })
        const data = await request(`/records?${query}`)
        if (!activeEffect) return
        const loaded = { ...emptyRecords, ...data.records }
        loaded.filing = loaded.filing.map((record) => normalizeYearFields(normalizeFilingRecord(record)))
        loaded.payments = loaded.payments.map((record) => normalizeYearFields(normalizePaymentRecord(record)))
        for (const type of Object.keys(loaded)) {
          if (type === 'feeding') loaded[type] = loaded[type].map((record) => normalizeYearFields(normalizeFeedingRecord(record)))
          else if (type === 'suppliers') loaded[type] = loaded[type].map((record) => normalizeYearFields(normalizeSupplierRecord(record)))
          else if (type !== 'filing' && type !== 'payments') loaded[type] = loaded[type].map(normalizeYearFields)
        }
        setRecords(loaded)
      } catch (error) {
        if (!activeEffect) return
        if (error.status === 401) setUser(null)
        else setNotice(`Could not load accounting records: ${error.message}`)
      } finally {
        if (activeEffect) setLoading(false)
      }
    }
    loadRecords()
    return () => { activeEffect = false }
  }, [academicYear, fiscalYear, user])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const scopedRecords = useMemo(() => Object.fromEntries(
    Object.entries(records).map(([type, rows]) => [type, rows.filter((row) => row.academic_year === academicYear && row.fiscal_year === fiscalYear)]),
  ), [academicYear, fiscalYear, records])
  const pendingCount = scopedRecords.approvals.filter((item) => item.status === 'Pending').length
  const paymentTotal = scopedRecords.payments.reduce((sum, item) => sum + Number(item.net_payable ?? item.amount ?? 0), 0)
  const filteredRows = useMemo(() => {
    const rows = scopedRecords[active] || []
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch = !query || Object.values(row).some((value) => String(value).toLowerCase().includes(query))
      const matchesAttention = !attentionOnly || (
        row.status ? !['Complete', 'Paid', 'Approved'].includes(row.status)
          : row.tax_clearance_checked ? row.tax_clearance_checked !== 'Yes' || Number(row.outstanding) > 0
            : row.deposited !== undefined ? row.deposited === 'No' || Number(row.balance_due) > 0
              : row.missing_items ? true
                : row.missing_documents ? row.missing_documents !== 'None'
                  : typeof row.balance === 'number' ? row.balance < 0
                    : false
      )
      return matchesSearch && matchesAttention
    })
  }, [active, attentionOnly, scopedRecords, search])

  async function signIn(username, password) {
    setAuthError('')
    try {
      const { user: sessionUser } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setUser(sessionUser)
    } catch (error) {
      setAuthError(error.status >= 500 || !error.status
        ? `The accounting service is unavailable. Start the backend and check its MySQL settings. (${error.message})`
        : error.message)
    }
  }

  async function signOut() {
    try {
      await request('/auth/logout', { method: 'POST', body: '{}' })
      setUser(null)
      setRecords(emptyRecords)
      setActive('dashboard')
      setSearch('')
      setNotice('')
    } catch (error) {
      setNotice(`Could not sign out: ${error.message}`)
    }
  }

  async function saveRecord(type, value) {
    const yearScopedValue = { ...value, academic_year: academicYear, fiscal_year: fiscalYear }
    try {
      const result = await request(`/records/${type}`, {
        method: 'POST',
        body: JSON.stringify(yearScopedValue),
      })
      const record = type === 'payments'
        ? normalizePaymentRecord(result.record)
        : type === 'filing' ? normalizeFilingRecord(result.record)
          : type === 'feeding' ? normalizeFeedingRecord(result.record)
            : type === 'suppliers' ? normalizeSupplierRecord(result.record)
              : result.record
      setRecords((current) => ({ ...current, [type]: [record, ...current[type]] }))
      setModal(false)
      setNotice('Record saved to the accounting database.')
    } catch (error) {
      setNotice(`Could not save record: ${error.message}`)
    }
  }

  async function updateApproval(record, status) {
    try {
      const result = await request(`/records/approvals/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setRecords((current) => ({
        ...current,
        approvals: current.approvals.map((item) => item.id === record.id ? result.record : item),
      }))
      setNotice(`Request ${status.toLowerCase()}.`)
    } catch (error) {
      setNotice(`Could not update approval: ${error.message}`)
    }
  }

  if (authLoading) return <div className="auth-loading"><span className="spinner" /> Checking your secure session…</div>
  if (!user) return <SignInPage onSignIn={signIn} error={authError} />

  function exportCsv() {
    const definition = definitions[active]
    const columns = definition.columns
    const values = [columns.map(([, label]) => label), ...filteredRows.map((row) => columns.map(([key]) => row[key] ?? ''))]
    const csv = values.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `${active}-register.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const currentModule = modules.find((item) => item.id === active)
  const profileInitials = user.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span>GS</span></div>
          <div><strong>GS BUSANZA</strong><small>FINANCE OFFICE</small></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="school-switch">
          <div className="school-avatar">B</div>
          <div><strong>Busanza School</strong><small>Accounting workspace</small></div>
          <ChevronDown size={16} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          {modules.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${active === id ? 'selected' : ''}`} onClick={() => { setActive(id); setSearch(''); setAttentionOnly(false); setMenuOpen(false) }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === 'approvals' && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="compliance-card">
            <div className="compliance-icon"><ShieldCheck size={17} /></div>
            <div><strong>Records protected</strong><p>Keep source documents with every entry.</p></div>
          </div>
          <div className="profile">
            <div className="profile-avatar">{profileInitials}</div>
            <div className="profile-copy"><strong>{user.displayName}</strong><small>Accountant</small></div>
            <button className="logout-button" onClick={signOut} aria-label="Log out" title="Log out"><LogOut size={16} /><span>Log out</span></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb">Finance <ChevronRight size={14} /> <strong>{currentModule.label}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" onClick={() => { setActive('approvals'); setSearch(''); setAttentionOnly(true) }} aria-label="Open pending approvals"><Bell size={18} /><i /></button>
            <div className="top-avatar">{profileInitials}</div>
          </div>
        </header>

        <div className="page-content">
          <div className="year-context-bar">
            <span className="year-context-label">RECORD PERIOD</span>
            <label><span>Academic year</span><select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>{yearOptions.map((year) => <option key={year}>{year}</option>)}</select></label>
            <label><span>Fiscal year</span><select value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)}>{yearOptions.map((year) => <option key={year}>{year}</option>)}</select></label>
            <span className="year-hint">Records are separated by both selected years.</span>
          </div>
          {active === 'dashboard'
            ? <Dashboard records={scopedRecords} pendingCount={pendingCount} paymentTotal={paymentTotal} onNavigate={(module) => { setActive(module); setSearch(''); setAttentionOnly(false) }} loading={loading} displayName={user.displayName} />
            : <RegisterPage
                type={active}
                rows={filteredRows}
                query={search}
                onQuery={setSearch}
                onAdd={() => setModal(true)}
                onExport={exportCsv}
                onApprove={updateApproval}
                attentionOnly={attentionOnly}
                onToggleAttention={() => setAttentionOnly((current) => !current)}
                academicYear={academicYear}
                fiscalYear={fiscalYear}
              />}
        </div>
      </main>

      {modal && <RecordModal type={active} onClose={() => setModal(false)} onSave={saveRecord} />}
      {notice && <div className={`toast ${notice.startsWith('Could not') ? 'toast-error' : ''}`}><CheckCircle2 size={18} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
    </div>
  )
}

function SignInPage({ onSignIn, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    await onSignIn(username, password)
    setSubmitting(false)
  }

  return (
    <main className="signin-shell">
      <section className="signin-card">
        <div className="brand-mark signin-mark"><span>GS</span></div>
        <div className="eyebrow signin-eyebrow">GS BUSANZA · FINANCE OFFICE</div>
        <h1>Sign in to your workspace</h1>
        <p>Access the school accounting registers and financial records.</p>
        <form onSubmit={submit}>
          <label><span>Username</span><input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <div className="signin-error" role="alert">{error}</div>}
          <button className="button button-primary signin-submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="signin-footer"><ShieldCheck size={15} /> Secure accountant access</div>
        <div className="signin-setup-note">Account access is configured privately in <code>backend/.env</code>.</div>
      </section>
    </main>
  )
}

function Dashboard({ records, pendingCount, paymentTotal, onNavigate, loading, displayName }) {
  const stockCount = records.stock.reduce((sum, item) => sum + Number(item.balance || 0), 0)
  const missingFiles = records.filing.filter((item) => item.status !== 'Complete').length
  const totalOutstanding = records.suppliers.reduce((sum, item) => sum + Number(item.outstanding || 0), 0)
  const currentDate = new Date()

  return (
    <>
      <div className="welcome-row">
        <div><div className="eyebrow"><span className="live-dot" /> ACCOUNTING OVERVIEW</div><h1>Welcome, {displayName.split(' ')[0]} <span className="wave">✳</span></h1><p>Here’s what’s happening with your school finances today.</p></div>
        <div className="date-display"><span>{currentDate.toLocaleDateString('en', { weekday: 'long' }).toUpperCase()}</span><strong>{currentDate.getDate()} <small>{currentDate.toLocaleDateString('en', { month: 'short' }).toUpperCase()}</small></strong><span>{currentDate.getFullYear()}</span></div>
      </div>
      <div className="dashboard-actions">
        <button className="button button-primary" onClick={() => onNavigate('payments')}><Plus size={16} /> Record a payment</button>
        <button className="button button-secondary" onClick={() => window.print()}><FileCheck2 size={16} /> Print overview</button>
      </div>
      <section className="metric-grid" aria-label="Key accounting metrics">
        <MetricCard label="Total payments" value={`${money(paymentTotal)} RWF`} helper="Across recorded payments" icon={Wallet} tone="blue" trend="This financial year" />
        <MetricCard label="Stock balance" value={`${money(stockCount)} items`} helper="Across active stock records" icon={Boxes} tone="green" trend="Updated this week" />
        <MetricCard label="Needs approval" value={String(pendingCount).padStart(2, '0')} helper="Requests awaiting a decision" icon={ClipboardCheck} tone="orange" trend="Review required" />
        <MetricCard label="Files to complete" value={String(missingFiles).padStart(2, '0')} helper="Missing or in-progress files" icon={FileText} tone="purple" trend={`${money(totalOutstanding)} RWF supplier balance`} />
      </section>

      <div className="dashboard-columns">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Payment activity</h2><p>Recent spending from the payment register</p></div><button className="text-button" onClick={() => onNavigate('payments')}>View register <ChevronRight size={15} /></button></div>
          <div className="chart-legend"><span><i className="legend-dot income-dot" /> Paid</span><span><i className="legend-dot expense-dot" /> Awaiting approval</span><span className="select-small">Last 6 months</span></div>
          <PaymentChart payments={records.payments} />
          <div className="chart-summary"><div><span>Total recorded</span><strong>{money(paymentTotal)} <small>RWF</small></strong></div><div><span>Pending review</span><strong>{pendingCount} <small>requests</small></strong></div><div><span>Unpaid supplier balance</span><strong>{money(totalOutstanding)} <small>RWF</small></strong></div></div>
        </section>
        <section className="panel approvals-panel">
          <div className="panel-heading"><div><h2>Approval queue</h2><p>Items requiring an authorized officer</p></div><button className="round-link" onClick={() => onNavigate('approvals')} aria-label="Go to approvals"><ArrowUpRight size={17} /></button></div>
          <div className="approval-list">
            {records.approvals.filter((item) => item.status === 'Pending').slice(0, 4).map((item) => (
              <div className="approval-row" key={item.id}>
                <div className="approval-icon"><Clock3 size={17} /></div>
                <div className="approval-info"><strong>{item.type}</strong><span>{item.reference} · {item.submitted_by}</span></div>
                <div className="approval-amount"><strong>{money(item.amount)}</strong><small>RWF</small></div>
              </div>
            ))}
            {!records.approvals.some((item) => item.status === 'Pending') && <div className="empty-queue"><CheckCircle2 size={23} /><strong>You’re all caught up</strong><span>No approvals are waiting right now.</span></div>}
          </div>
          <button className="queue-footer" onClick={() => onNavigate('approvals')}>Open approval workflow <ArrowUpRight size={15} /></button>
        </section>
      </div>

      <div className="dashboard-columns lower-columns">
        <section className="panel register-panel">
          <div className="panel-heading"><div><h2>Recent payments</h2><p>Latest entries in your payment register</p></div><button className="text-button" onClick={() => onNavigate('payments')}>See all <ChevronRight size={15} /></button></div>
          <div className="compact-table-wrap"><table className="data-table compact-table"><thead><tr><th>SUPPLIER</th><th>PAYMENT REF</th><th>NET PAYABLE</th><th>STATUS</th></tr></thead><tbody>
            {records.payments.slice(0, 4).map((payment) => <tr key={payment.id}><td><strong>{payment.supplier || payment.payee}</strong><small>{payment.purpose || payment.description}</small></td><td>{payment.payment_ref || payment.reference}</td><td className="amount-cell">{money(payment.net_payable ?? payment.amount)} <small>RWF</small></td><td><StatusBadge value={payment.status} /></td></tr>)}
          </tbody></table></div>
        </section>
        <section className="panel stock-panel">
          <div className="panel-heading"><div><h2>Stock at a glance</h2><p>Current store balances</p></div><button className="text-button" onClick={() => onNavigate('stock')}>Stock register <ChevronRight size={15} /></button></div>
          <div className="stock-list">{records.stock.slice(0, 4).map((item, index) => <div className="stock-row" key={item.id}><div className={`stock-thumb stock-thumb-${index % 4}`}><Boxes size={17} /></div><div className="stock-item"><strong>{item.item_name}</strong><small>{item.category}</small></div><div className="stock-quantity"><strong>{money(item.balance)}</strong><small>{item.unit.trim()}</small></div><div className="stock-track"><i style={{ width: `${Math.min(100, Math.max(9, Number(item.balance) / 1.8))}%` }} /></div></div>)}</div>
        </section>
      </div>
      {loading && <div className="loading-note"><span className="spinner" /> Checking accounting database…</div>}
    </>
  )
}

function MetricCard({ label, value, helper, icon: Icon, tone, trend }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={18} /></div></div><strong className="metric-value">{value}</strong><div className="metric-helper">{helper}</div><div className="metric-trend"><span className={`trend-mark ${tone}`}><ArrowDownLeft size={13} /></span>{trend}</div></article>
}

function PaymentChart({ payments }) {
  const months = Array.from({ length: 6 }, (_value, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return { key, label: date.toLocaleDateString('en', { month: 'short' }).toUpperCase(), paid: 0, pending: 0 }
  })
  for (const payment of payments) {
    const month = months.find((entry) => entry.key === String(payment.payment_date || payment.request_date || payment.date || '').slice(0, 7))
    if (!month) continue
    if (payment.status === 'Paid') month.paid += Number(payment.net_payable ?? payment.amount ?? 0)
    else month.pending += Number(payment.net_payable ?? payment.amount ?? 0)
  }
  const maximum = Math.max(500000, ...months.map((month) => month.paid + month.pending))
  const axisMaximum = Math.ceil(maximum / 500000) * 500000
  const axisLabels = [1, 0.75, 0.5, 0.25, 0].map((fraction) => {
    const amount = axisMaximum * fraction
    return amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}m` : `${Math.round(amount / 1000)}k`
  })
  return (
    <div className="chart-area">
      <div className="chart-y-labels">{axisLabels.map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className="chart-plot">
        <div className="chart-grid"><i /><i /><i /><i /><i /></div>
        <div className="chart-bars">{months.map((month) => (
          <div className="bar-group" key={month.key}>
            <div className="bars">
              <span className="bar-paid" style={{ height: `${month.paid / axisMaximum * 100}%` }} />
              <span className="bar-pending" style={{ height: `${month.pending / axisMaximum * 100}%` }} />
            </div>
            <small>{month.label}</small>
          </div>
        ))}</div>
      </div>
    </div>
  )
}

function RegisterPage({ type, rows, query, onQuery, onAdd, onExport, onApprove, attentionOnly, onToggleAttention, academicYear, fiscalYear }) {
  const definition = definitions[type]
  return (
    <>
      <div className="register-title-row"><div><div className="eyebrow">FINANCE WORKSPACE <ChevronRight size={13} /> REGISTERS</div><h1>{definition.title}</h1><p>{definition.description}</p></div><button className="button button-primary" onClick={onAdd}><Plus size={16} /> Add {definition.singular}</button></div>
      <div className="register-summary-row"><div className="register-summary"><span>Showing records</span><strong>{rows.length}</strong></div><div className="register-summary"><span>Academic year</span><strong>{academicYear}</strong></div><div className="register-summary"><span>Fiscal year</span><strong>{fiscalYear}</strong></div></div>
      <section className="panel register-page-panel">
        <div className="table-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={`Search ${definition.title.toLowerCase()}…`} /></div><div className="table-actions"><button className="button button-secondary button-small" onClick={onExport}><ArrowDownLeft size={15} /> Export CSV</button>{type !== 'stock' && <button className={`filter-button ${attentionOnly ? 'filter-active' : ''}`} onClick={onToggleAttention} aria-label={attentionOnly ? 'Show all records' : 'Show items needing attention'} aria-pressed={attentionOnly}><SlidersHorizontal size={17} /></button>}</div></div>
        {rows.length ? <div className="table-scroll"><table className="data-table"><thead><tr>{definition.columns.map(([, label]) => <th key={label}>{label.toUpperCase()}</th>)}{type === 'approvals' && <th>ACTION</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{definition.columns.map(([key]) => <td key={key}>{renderCell(key, row[key])}</td>)}{type === 'approvals' && <td>{row.status === 'Pending' ? <div className="approval-actions"><button className="approve-button" onClick={() => onApprove(row, 'Approved')}><Check size={14} /> Approve</button><button className="reject-button" onClick={() => onApprove(row, 'Rejected')}>Reject</button></div> : <span className="muted-cell">Recorded</span>}</td>}</tr>)}</tbody></table></div> : <div className="table-empty"><FileText size={28} /><strong>No records found</strong><span>{query ? 'Try another search term.' : `Add your first ${definition.singular} to get started.`}</span></div>}
        <div className="table-footer"><span>Showing {rows.length} {rows.length === 1 ? 'record' : 'records'}</span><div><button disabled aria-label="Previous page"><ChevronLeft size={16} /></button><span>1</span><button disabled aria-label="Next page"><ChevronRight size={16} /></button></div></div>
      </section>
      <div className="register-hint"><ShieldCheck size={16} /><span>Keep invoices, tax proof, and signed approvals with each transaction to support audit readiness.</span></div>
    </>
  )
}

function renderCell(key, value) {
  if (['amount', 'amount_before', 'tax_amount', 'net_payable', 'expected', 'collected', 'expected_fee', 'amount_collected', 'balance_due', 'outstanding'].includes(key)) return value === '' || value === null || value === undefined ? <span className="muted-cell">—</span> : <span className={`amount-cell ${key === 'balance_due' && Number(value) < 0 ? 'negative-value' : ''}`}>{money(value)} <small>RWF</small></span>
  if (value === '' || value === null || value === undefined) return <span className="muted-cell">—</span>
  if (key === 'balance' && typeof value === 'number' && Math.abs(value) > 1000) return <span className={value < 0 ? 'negative-value' : 'amount-cell'}>{money(value)} <small>RWF</small></span>
  if (key === 'balance') return <strong>{money(value)}</strong>
  if (key === 'status' || key === 'tax_status' || key === 'tax_clearance_checked' || key === 'deposited') return <StatusBadge value={value} />
  if (key === 'item_name' || key === 'name' || key === 'payee' || key === 'title' || key === 'file_code' || key === 'reference') return <strong>{value}</strong>
  return value || <span className="muted-cell">—</span>
}

function StatusBadge({ value }) {
  const normalized = String(value || '').toLowerCase()
  const tone = normalized.includes('paid') || normalized.includes('complete') || normalized.includes('verified') || normalized.includes('approved') || normalized === 'yes'
    ? 'badge-green'
    : normalized.includes('pending') || normalized.includes('progress') || normalized.includes('partial')
      ? 'badge-amber'
      : normalized.includes('missing') || normalized.includes('reject') || normalized === 'no'
        ? 'badge-red'
        : 'badge-gray'
  return <span className={`status-badge ${tone}`}><i />{value}</span>
}

function RecordModal({ type, onClose, onSave }) {
  const definition = definitions[type]
  const [form, setForm] = useState(() => Object.fromEntries(definition.fields.map(([key, , inputType]) => [
    key,
    inputType === 'date' && ['date', 'request_date', 'submitted_at'].includes(key) ? new Date().toISOString().slice(0, 10)
      : inputType === 'number' && (type === 'stock' || type === 'feeding' || type === 'suppliers' && key === 'outstanding') ? '0'
        : '',
  ])))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const optionalFields = ['missing_documents', 'notes', 'proof', 'location', 'physical_location', 'digital_file', 'supplier_payee', 'period', 'missing_items', 'approver', 'reference_in', 'reference_out', 'issued_to', 'prepared_by', 'reviewed_by', 'checked_by', 'remarks']
    if (type === 'stock') optionalFields.push('opening_qty', 'received_qty', 'issued_qty')
    if (type === 'filing') optionalFields.push('amount')
    if (type === 'payments') optionalFields.push('tin', 'tax_checked', 'tax_amount', 'budget_line', 'budget_ref_date', 'internal_requisition_ref', 'po_contract_ref', 'invoice_ref', 'pv_delivery_ref', 'voucher', 'payment_date', 'payment_method', 'proof_bank_ref', 'file_code', 'prepared_by', 'remarks')
    if (type === 'feeding') optionalFields.push('student_reference', 'receipt_no', 'bank_cash_ref', 'collector', 'deposited', 'deposit_date', 'expense_ref', 'file_code', 'remarks')
    if (type === 'suppliers') optionalFields.push('contact', 'address', 'goods_service', 'contract_po_ref', 'last_invoice_ref', 'last_payment_date', 'file_code', 'remarks')
    const required = definition.fields.filter(([key]) => !optionalFields.includes(key))
    const missing = required.find(([key]) => form[key] === '')
    if (missing) {
      setError(`${missing[1]} is required.`)
      return
    }
    setSaving(true)
    setError('')
    await onSave(type, form)
    setSaving(false)
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">NEW REGISTER ENTRY</span><h2 id="modal-title">Add {definition.singular}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><p className="modal-description">{definition.description}</p><form onSubmit={submit}><div className="form-grid">{definition.fields.map(([key, label, inputType, options]) => <label className={inputType === 'text' && ['description', 'title', 'notes', 'proof'].includes(key) ? 'form-wide' : ''} key={key}><span>{label}</span>{inputType === 'select' ? <select value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}><option value="">Select…</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={inputType} min={inputType === 'number' ? '0' : undefined} step={inputType === 'number' ? 'any' : undefined} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={inputType === 'number' ? '0' : ''} />}</label>)}</div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}><Plus size={15} />{saving ? 'Saving…' : 'Save record'}</button></div></form></section></div>
}

export default App
