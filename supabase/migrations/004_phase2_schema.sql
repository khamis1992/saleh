-- ============================================================
-- Real Estate Development ERP — Phase 2 Schema
-- Construction, Contractor Claims, Procurement & Inventory
-- ============================================================

-- ============================================================
-- 1. CONTRACTOR CONTRACTS
-- ============================================================
CREATE TABLE contractor_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  contract_number TEXT NOT NULL,
  contract_title TEXT,
  scope_of_work TEXT,
  contract_amount NUMERIC DEFAULT 0 CHECK (contract_amount > 0),
  retention_percentage NUMERIC DEFAULT 0,
  advance_payment NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  payment_terms TEXT,
  penalty_terms TEXT,
  warranty_period_months INTEGER,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','active','suspended','completed','terminated','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 2. CONTRACTOR CLAIMS
-- ============================================================
CREATE TABLE contractor_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contractor_contract_id UUID NOT NULL REFERENCES contractor_contracts(id),
  contractor_id UUID NOT NULL REFERENCES contractors(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  claim_number TEXT NOT NULL,
  claim_date DATE,
  claimed_amount NUMERIC DEFAULT 0 CHECK (claimed_amount > 0),
  work_completed_percentage NUMERIC DEFAULT 0 CHECK (work_completed_percentage >= 0 AND work_completed_percentage <= 100),
  previous_claims_amount NUMERIC DEFAULT 0,
  retention_amount NUMERIC DEFAULT 0,
  advance_deduction NUMERIC DEFAULT 0,
  penalty_amount NUMERIC DEFAULT 0,
  net_payable NUMERIC DEFAULT 0,
  engineer_verification_status TEXT DEFAULT 'pending'
    CHECK (engineer_verification_status IN ('pending','verified','rejected')),
  engineer_notes TEXT,
  project_manager_approval_status TEXT DEFAULT 'pending'
    CHECK (project_manager_approval_status IN ('pending','approved','rejected')),
  finance_approval_status TEXT DEFAULT 'pending'
    CHECK (finance_approval_status IN ('pending','approved','rejected')),
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partially_paid','paid')),
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','verified','approved','rejected','partially_paid','paid','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 3. PROJECT DAILY REPORTS
-- ============================================================
CREATE TABLE project_daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_number TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  report_date DATE,
  weather_condition TEXT,
  manpower_count INTEGER DEFAULT 0,
  equipment_on_site TEXT,
  work_completed_today TEXT,
  planned_work_tomorrow TEXT,
  issues_encountered TEXT,
  safety_incidents TEXT,
  materials_received TEXT,
  delay_reason TEXT,
  submitted_by UUID REFERENCES profiles(id),
  approval_status TEXT DEFAULT 'draft'
    CHECK (approval_status IN ('draft','submitted','approved','returned','rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 4. PROJECT PROGRESS UPDATES
-- ============================================================
CREATE TABLE project_progress_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  phase_id UUID REFERENCES project_phases(id),
  update_date DATE,
  previous_progress NUMERIC DEFAULT 0,
  new_progress NUMERIC DEFAULT 0 CHECK (new_progress >= 0 AND new_progress <= 100),
  progress_change NUMERIC DEFAULT 0,
  description TEXT,
  issues TEXT,
  photos_count INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES profiles(id),
  approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','returned')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 5. VENDORS
-- ============================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor_code TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT
    CHECK (vendor_type IN ('material_supplier','service_provider','consultant','maintenance_provider','utility_provider','other')),
  cr_number TEXT,
  tax_number TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  bank_name TEXT,
  iban TEXT,
  payment_terms TEXT,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 6. PURCHASE REQUESTS
-- ============================================================
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pr_number TEXT NOT NULL,
  requested_by UUID REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  cost_center_id UUID,
  department_id UUID REFERENCES departments(id),
  required_date DATE,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','urgent')),
  justification TEXT,
  estimated_total NUMERIC DEFAULT 0,
  approval_status TEXT DEFAULT 'draft',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved','rejected','rfq_created','po_created','closed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 7. PURCHASE REQUEST ITEMS
-- ============================================================
CREATE TABLE purchase_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_name TEXT,
  item_description TEXT,
  quantity NUMERIC DEFAULT 0 CHECK (quantity > 0),
  unit TEXT,
  estimated_unit_cost NUMERIC DEFAULT 0,
  estimated_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 8. RFQs
-- ============================================================
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rfq_number TEXT NOT NULL,
  purchase_request_id UUID REFERENCES purchase_requests(id),
  project_id UUID REFERENCES projects(id),
  title TEXT,
  description TEXT,
  submission_deadline DATE,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','quotations_received','under_evaluation','awarded','cancelled','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 9. RFQ VENDORS
-- ============================================================
CREATE TABLE rfq_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  invitation_status TEXT DEFAULT 'invited'
    CHECK (invitation_status IN ('invited','sent','responded','declined','no_response')),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 10. VENDOR QUOTATIONS
-- ============================================================
CREATE TABLE vendor_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  rfq_id UUID NOT NULL REFERENCES rfqs(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  quotation_date DATE,
  valid_until DATE,
  delivery_time_days INTEGER,
  payment_terms TEXT,
  warranty_terms TEXT,
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  evaluation_score NUMERIC DEFAULT 0,
  is_recommended BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','recommended','accepted','rejected')),
  attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 11. VENDOR QUOTATION ITEMS
-- ============================================================
CREATE TABLE vendor_quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor_quotation_id UUID NOT NULL REFERENCES vendor_quotations(id) ON DELETE CASCADE,
  item_name TEXT,
  description TEXT,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 12. PURCHASE ORDERS
-- ============================================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  purchase_request_id UUID REFERENCES purchase_requests(id),
  rfq_id UUID REFERENCES rfqs(id),
  vendor_quotation_id UUID REFERENCES vendor_quotations(id),
  project_id UUID REFERENCES projects(id),
  cost_center_id UUID,
  po_date DATE,
  expected_delivery_date DATE,
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  approval_status TEXT DEFAULT 'draft',
  receipt_status TEXT DEFAULT 'not_received'
    CHECK (receipt_status IN ('not_received','partially_received','fully_received')),
  invoice_status TEXT DEFAULT 'not_invoiced',
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partially_paid','paid')),
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','sent_to_vendor','partially_received','fully_received','cancelled','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 13. PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID,
  item_name TEXT,
  description TEXT,
  quantity NUMERIC DEFAULT 0 CHECK (quantity > 0),
  received_quantity NUMERIC DEFAULT 0,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 14. GOODS RECEIPTS
-- ============================================================
CREATE TABLE goods_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  grn_number TEXT NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  vendor_id UUID REFERENCES vendors(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  project_id UUID REFERENCES projects(id),
  receipt_date DATE,
  received_by UUID REFERENCES profiles(id),
  delivery_note_number TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','posted','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 15. GOODS RECEIPT ITEMS
-- ============================================================
CREATE TABLE goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES purchase_order_items(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  item_name TEXT,
  quantity_received NUMERIC DEFAULT 0 CHECK (quantity_received > 0),
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 16. WAREHOUSES
-- ============================================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_code TEXT NOT NULL,
  warehouse_name TEXT NOT NULL,
  location TEXT,
  manager_id UUID REFERENCES profiles(id),
  type TEXT DEFAULT 'main'
    CHECK (type IN ('main','project','site','maintenance')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 17. INVENTORY ITEMS
-- ============================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT
    CHECK (category IN ('cement','steel','blocks','wood','electrical','plumbing','hvac','finishing','paint','tools','safety','spare_parts','other')),
  unit_of_measure TEXT,
  minimum_stock NUMERIC DEFAULT 0,
  maximum_stock NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 0,
  average_cost NUMERIC DEFAULT 0,
  default_supplier_id UUID REFERENCES vendors(id),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 18. STOCK TRANSACTIONS
-- ============================================================
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('purchase_receipt','issue_to_project','issue_to_maintenance','transfer_in','transfer_out','return_from_project','adjustment','damage','write_off')),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  project_id UUID REFERENCES projects(id),
  property_id UUID REFERENCES properties(id),
  work_order_id UUID,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  transaction_date DATE,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 19. PROJECT BUDGETS
-- ============================================================
CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  budget_code TEXT NOT NULL,
  budget_name TEXT,
  budget_category TEXT
    CHECK (budget_category IN ('land','design','permits','civil_works','mep','finishing','landscaping','consultant','contingency','other')),
  approved_amount NUMERIC DEFAULT 0,
  committed_amount NUMERIC DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  variance_amount NUMERIC DEFAULT 0,
  variance_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 20. INDEXES
-- ============================================================
CREATE INDEX idx_contractor_contracts_project ON contractor_contracts(project_id);
CREATE INDEX idx_contractor_contracts_contractor ON contractor_contracts(contractor_id);
CREATE INDEX idx_contractor_claims_contract ON contractor_claims(contractor_contract_id);
CREATE INDEX idx_contractor_claims_project ON contractor_claims(project_id);
CREATE INDEX idx_contractor_claims_status ON contractor_claims(status);
CREATE INDEX idx_project_daily_reports_project ON project_daily_reports(project_id);
CREATE INDEX idx_project_progress_updates_project ON project_progress_updates(project_id);
CREATE INDEX idx_purchase_requests_project ON purchase_requests(project_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_rfqs_purchase_request ON rfqs(purchase_request_id);
CREATE INDEX idx_vendor_quotations_rfq ON vendor_quotations(rfq_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_goods_receipts_po ON goods_receipts(purchase_order_id);
CREATE INDEX idx_stock_transactions_item ON stock_transactions(inventory_item_id);
CREATE INDEX idx_stock_transactions_warehouse ON stock_transactions(warehouse_id);
CREATE INDEX idx_stock_transactions_project ON stock_transactions(project_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_project_budgets_project ON project_budgets(project_id);

-- ============================================================
-- 21. AUTO-UPDATE TRIGGERS
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
    AND table_name IN (
      'contractor_contracts','contractor_claims','project_daily_reports',
      'project_progress_updates','vendors','purchase_requests','purchase_request_items',
      'rfqs','rfq_vendors','vendor_quotations','vendor_quotation_items',
      'purchase_orders','purchase_order_items','goods_receipts','goods_receipt_items',
      'warehouses','inventory_items','stock_transactions','project_budgets'
    )
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- 22. RLS — Enable on all new tables
-- ============================================================
ALTER TABLE contractor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 23. RLS POLICIES — Phase 2 tables (company-scoped SELECT)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'contractor_contracts','contractor_claims','project_daily_reports',
      'project_progress_updates','vendors','purchase_requests','purchase_request_items',
      'rfqs','rfq_vendors','vendor_quotations','vendor_quotation_items',
      'purchase_orders','purchase_order_items','goods_receipts','goods_receipt_items',
      'warehouses','inventory_items','stock_transactions','project_budgets'
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
