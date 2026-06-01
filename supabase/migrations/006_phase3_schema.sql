-- ============================================================
-- Real Estate Development ERP — Phase 3 Schema
-- Equipment, Legal, Work Orders, Preventive Maintenance,
-- Buildings/Floors, Cost Centers, Bank Accounts, Audit Log,
-- Cheque Management, Rent Schedules, HR & Payroll
-- ============================================================

-- ============================================================
-- 1. BUILDINGS
-- ============================================================
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  building_code TEXT NOT NULL,
  building_name TEXT NOT NULL,
  number_of_floors INTEGER DEFAULT 1,
  number_of_units INTEGER DEFAULT 0,
  parking_spaces INTEGER DEFAULT 0,
  elevator_count INTEGER DEFAULT 0,
  completion_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 2. FLOORS
-- ============================================================
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number TEXT NOT NULL,
  description TEXT,
  number_of_units INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 3. EQUIPMENT
-- ============================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  equipment_code TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  category TEXT
    CHECK (category IN ('vehicle','generator','excavator','crane','compressor','tools','safety_equipment','scaffolding','other')),
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  assigned_project_id UUID REFERENCES projects(id),
  current_location TEXT,
  responsible_person_id UUID REFERENCES profiles(id),
  condition TEXT,
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available','assigned','under_maintenance','damaged','sold','retired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 4. EQUIPMENT MAINTENANCE
-- ============================================================
CREATE TABLE equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT CHECK (maintenance_type IN ('preventive','corrective','breakdown')),
  description TEXT,
  repair_cost NUMERIC DEFAULT 0,
  vendor_id UUID REFERENCES vendors(id),
  maintenance_date DATE,
  next_maintenance_date DATE,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 5. WORK ORDERS
-- ============================================================
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_order_number TEXT NOT NULL,
  maintenance_request_id UUID REFERENCES maintenance_requests(id),
  technician_id UUID REFERENCES profiles(id),
  scheduled_date DATE,
  start_time TEXT,
  end_time TEXT,
  labor_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  vendor_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  diagnosis TEXT,
  work_done TEXT,
  materials_used TEXT,
  tenant_signature_url TEXT,
  status TEXT DEFAULT 'assigned'
    CHECK (status IN ('assigned','in_progress','waiting_parts','completed','tenant_confirmed','closed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 6. PREVENTIVE MAINTENANCE SCHEDULES
-- ============================================================
CREATE TABLE preventive_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  asset_name TEXT NOT NULL,
  category TEXT,
  frequency TEXT CHECK (frequency IN ('weekly','monthly','quarterly','semi_annually','annually')),
  next_due_date DATE,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 7. COST CENTERS
-- ============================================================
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cost_center_code TEXT NOT NULL,
  cost_center_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('project','property','department','unit','other')),
  linked_project_id UUID REFERENCES projects(id),
  linked_property_id UUID REFERENCES properties(id),
  linked_department_id UUID REFERENCES departments(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 8. BANK ACCOUNTS
-- ============================================================
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  currency TEXT DEFAULT 'SAR',
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 9. CHEQUE MANAGEMENT
-- ============================================================
CREATE TABLE cheques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cheque_number TEXT NOT NULL,
  bank_name TEXT,
  cheque_date DATE,
  amount NUMERIC DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id),
  contract_id UUID REFERENCES lease_contracts(id),
  status TEXT DEFAULT 'received'
    CHECK (status IN ('received','deposited','cleared','bounced','cancelled','returned')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 10. LEGAL NOTICES
-- ============================================================
CREATE TABLE legal_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  notice_number TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contract_id UUID REFERENCES lease_contracts(id),
  unit_id UUID REFERENCES units(id),
  notice_type TEXT CHECK (notice_type IN (
    'friendly_reminder','first_warning','final_warning','bounced_cheque',
    'lease_violation','unauthorized_occupancy','property_damage',
    'eviction','contract_termination','final_notice_before_legal'
  )),
  due_amount NUMERIC DEFAULT 0,
  notice_date DATE,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','generated','sent','acknowledged','closed')),
  generated_content TEXT,
  approved_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 11. LEGAL CASES
-- ============================================================
CREATE TABLE legal_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contract_id UUID REFERENCES lease_contracts(id),
  unit_id UUID REFERENCES units(id),
  case_type TEXT CHECK (case_type IN ('unpaid_rent','bounced_cheque','property_damage','eviction','contract_violation','other')),
  claim_amount NUMERIC DEFAULT 0,
  lawyer_name TEXT,
  court_name TEXT,
  filing_date DATE,
  hearing_date DATE,
  judgment_date DATE,
  status TEXT DEFAULT 'under_review'
    CHECK (status IN ('under_review','notice_sent','filed','hearing_scheduled','judgment_issued','enforcement','closed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 12. RENT SCHEDULES
-- ============================================================
CREATE TABLE rent_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES lease_contracts(id),
  due_date DATE,
  period_start DATE,
  period_end DATE,
  rent_amount NUMERIC DEFAULT 0,
  service_charges NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  late_fee NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','due','partially_paid','paid','overdue','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 13. AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id UUID,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. EMPLOYEES
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  job_title TEXT,
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES employees(id),
  hire_date DATE,
  salary NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 15. ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  hours_worked NUMERIC DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'present'
    CHECK (status IN ('present','absent','late','half_day','leave','holiday')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 16. PAYROLL
-- ============================================================
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payroll_month TEXT NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  basic_salary NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','approved','paid','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 17. INDEXES
-- ============================================================
CREATE INDEX idx_buildings_property ON buildings(property_id);
CREATE INDEX idx_floors_building ON floors(building_id);
CREATE INDEX idx_equipment_project ON equipment(assigned_project_id);
CREATE INDEX idx_work_orders_request ON work_orders(maintenance_request_id);
CREATE INDEX idx_legal_notices_tenant ON legal_notices(tenant_id);
CREATE INDEX idx_legal_cases_tenant ON legal_cases(tenant_id);
CREATE INDEX idx_rent_schedules_contract ON rent_schedules(contract_id);
CREATE INDEX idx_rent_schedules_due_date ON rent_schedules(due_date);
CREATE INDEX idx_audit_log_module ON audit_log(module, record_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id, attendance_date);
CREATE INDEX idx_payroll_employee ON payroll(employee_id, payroll_month);
CREATE INDEX idx_cheques_tenant ON cheques(tenant_id);

-- ============================================================
-- 18. RLS — Enable
-- ============================================================
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 19. RLS — Company-scoped SELECT
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'buildings','floors','equipment','equipment_maintenance',
      'work_orders','preventive_maintenance_schedules',
      'cost_centers','bank_accounts','cheques',
      'legal_notices','legal_cases','rent_schedules',
      'audit_log','employees','attendance','payroll'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Users can view company %I" ON %I FOR SELECT USING (company_id = get_current_company_id())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "Users can insert into company %I" ON %I FOR INSERT WITH CHECK (company_id = get_current_company_id())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "Users can update company %I" ON %I FOR UPDATE USING (company_id = get_current_company_id())',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 20. AUTO-UPDATE TRIGGERS
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
    AND table_name IN (
      'buildings','floors','equipment','equipment_maintenance',
      'work_orders','preventive_maintenance_schedules',
      'cost_centers','bank_accounts','cheques',
      'legal_notices','legal_cases','rent_schedules',
      'employees','attendance','payroll'
    )
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;
