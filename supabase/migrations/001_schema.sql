-- ============================================================
-- Real Estate Development ERP — Phase 1 Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CORE SYSTEM TABLES
-- ============================================================

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  cr_number TEXT,
  tax_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'QAR',
  default_language TEXT DEFAULT 'ar',
  fiscal_year_start_month INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_name_ar TEXT NOT NULL,
  branch_name_en TEXT,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_name_ar TEXT NOT NULL,
  department_name_en TEXT,
  manager_id UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_name_ar TEXT NOT NULL,
  role_name_en TEXT,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_code TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  action_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role_id UUID REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 2. BUSINESS TABLES
-- ============================================================

-- Lands
CREATE TABLE lands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  land_code TEXT NOT NULL,
  land_name TEXT NOT NULL,
  plot_number TEXT,
  zone TEXT,
  municipality TEXT,
  area_sqm NUMERIC,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  acquisition_date DATE,
  acquisition_price NUMERIC DEFAULT 0,
  broker_commission NUMERIC DEFAULT 0,
  registration_fees NUMERIC DEFAULT 0,
  legal_fees NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  total_acquisition_cost NUMERIC DEFAULT 0,
  current_estimated_value NUMERIC DEFAULT 0,
  title_deed_number TEXT,
  seller_name TEXT,
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available','under_study','under_design','under_approvals','under_construction','developed','sold','archived')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_code TEXT NOT NULL,
  project_name TEXT NOT NULL,
  land_id UUID REFERENCES lands(id),
  project_type TEXT,
  description TEXT,
  project_manager_id UUID REFERENCES profiles(id),
  engineer_id UUID REFERENCES profiles(id),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  estimated_budget NUMERIC DEFAULT 0,
  approved_budget NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status TEXT DEFAULT 'idea'
    CHECK (status IN ('idea','feasibility','design','approvals','tendering','construction','testing','handover','completed','converted_to_property','on_hold','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Project Phases
CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  sequence_number INTEGER,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  responsible_user_id UUID REFERENCES profiles(id),
  budget_amount NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','pending_approval','completed','delayed','rejected','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Contractors
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contractor_code TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  cr_number TEXT,
  specialty TEXT,
  classification TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  bank_name TEXT,
  iban TEXT,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_code TEXT NOT NULL,
  property_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  land_id UUID REFERENCES lands(id),
  property_type TEXT,
  address TEXT,
  completion_date DATE,
  handover_date DATE,
  land_cost NUMERIC DEFAULT 0,
  construction_cost NUMERIC DEFAULT 0,
  other_capitalized_cost NUMERIC DEFAULT 0,
  total_asset_value NUMERIC DEFAULT 0,
  useful_life_years INTEGER,
  depreciation_method TEXT,
  annual_depreciation NUMERIC DEFAULT 0,
  property_manager_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'ready_for_leasing'
    CHECK (status IN ('under_construction','ready_for_leasing','partially_leased','fully_leased','under_renovation','under_maintenance','sold','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  unit_type TEXT,
  floor_number TEXT,
  area_sqm NUMERIC,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking_number TEXT,
  electricity_meter TEXT,
  water_meter TEXT,
  furnished_status TEXT,
  expected_monthly_rent NUMERIC DEFAULT 0,
  market_monthly_rent NUMERIC DEFAULT 0,
  actual_rent NUMERIC DEFAULT 0,
  security_deposit_required NUMERIC DEFAULT 0,
  condition TEXT,
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available','reserved','leased','under_maintenance','blocked','sold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tenant_code TEXT NOT NULL,
  tenant_type TEXT DEFAULT 'individual'
    CHECK (tenant_type IN ('individual','company','government')),
  full_name TEXT,
  company_name TEXT,
  national_id TEXT,
  passport_number TEXT,
  cr_number TEXT,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  employer TEXT,
  authorized_person TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Lease Contracts
CREATE TABLE lease_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  start_date DATE,
  end_date DATE,
  rent_amount NUMERIC DEFAULT 0,
  payment_frequency TEXT DEFAULT 'monthly'
    CHECK (payment_frequency IN ('monthly','quarterly','semi_annual','annual','custom')),
  security_deposit NUMERIC DEFAULT 0,
  admin_fees NUMERIC DEFAULT 0,
  grace_period_days INTEGER DEFAULT 0,
  late_fee_type TEXT,
  late_fee_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','pending_signature','active','expiring_soon','renewed','terminated','cancelled','legal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Rental Invoices
CREATE TABLE rental_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contract_id UUID NOT NULL REFERENCES lease_contracts(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  invoice_date DATE,
  due_date DATE,
  rent_amount NUMERIC DEFAULT 0,
  service_charges NUMERIC DEFAULT 0,
  maintenance_charges NUMERIC DEFAULT 0,
  penalties NUMERIC DEFAULT 0,
  discounts NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'issued'
    CHECK (status IN ('draft','issued','partially_paid','paid','overdue','cancelled','written_off')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Receipts
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES rental_invoices(id),
  contract_id UUID REFERENCES lease_contracts(id),
  payment_date DATE,
  payment_method TEXT
    CHECK (payment_method IN ('cash','bank_transfer','cheque','card','online')),
  amount NUMERIC DEFAULT 0 CHECK (amount > 0),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Maintenance Requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  tenant_id UUID REFERENCES tenants(id),
  category TEXT,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','emergency')),
  description TEXT,
  preferred_visit_time TEXT,
  status TEXT DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','approved','rejected','assigned','in_progress','waiting_parts','completed','tenant_confirmed','closed','cancelled')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_title TEXT,
  document_type TEXT,
  linked_module TEXT,
  linked_record_id UUID,
  file_url TEXT,
  expiry_date DATE,
  version_number INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES profiles(id),
  access_level TEXT DEFAULT 'internal',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 3. FINANCE TABLES
-- ============================================================

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name_ar TEXT NOT NULL,
  account_name_en TEXT,
  account_type TEXT
    CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  level INTEGER DEFAULT 1,
  is_postable BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE,
  description TEXT,
  source_module TEXT,
  source_record_id UUID,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','posted','reversed','cancelled')),
  total_debit NUMERIC DEFAULT 0,
  total_credit NUMERIC DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  posted_by UUID REFERENCES profiles(id),
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  description TEXT
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX idx_lands_company_id ON lands(company_id);
CREATE INDEX idx_lands_status ON lands(status);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_land_id ON projects(land_id);
CREATE INDEX idx_properties_company_id ON properties(company_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_units_company_id ON units(company_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_tenants_company_id ON tenants(company_id);
CREATE INDEX idx_lease_contracts_tenant_id ON lease_contracts(tenant_id);
CREATE INDEX idx_lease_contracts_unit_id ON lease_contracts(unit_id);
CREATE INDEX idx_lease_contracts_status ON lease_contracts(status);
CREATE INDEX idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
CREATE INDEX idx_rental_invoices_status ON rental_invoices(status);
CREATE INDEX idx_rental_invoices_due_date ON rental_invoices(due_date);
CREATE INDEX idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_documents_linked ON documents(linked_module, linked_record_id);

-- ============================================================
-- 5. AUTO-UPDATE trigger for updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;
