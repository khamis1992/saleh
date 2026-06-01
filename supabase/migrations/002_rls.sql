-- ============================================================
-- Real Estate Development ERP — Row Level Security Policies
-- Supabase PostgreSQL
-- ============================================================

-- ============================================================
-- 1. HELPER FUNCTION: get current user's company_id
-- ============================================================

CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
DECLARE
  cid UUID;
BEGIN
  SELECT company_id INTO cid
  FROM profiles
  WHERE user_id = auth.uid();
  RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. HELPER FUNCTION: check if user has a specific permission
-- ============================================================

CREATE OR REPLACE FUNCTION has_permission(perm_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN role_permissions rp ON rp.role_id = p.role_id
    JOIN permissions perm ON perm.id = rp.permission_id
    WHERE p.user_id = auth.uid()
    AND perm.permission_code = perm_code
  ) INTO has_perm;
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. COMPANIES POLICY
-- ============================================================

CREATE POLICY "Users can view their own company"
ON companies FOR SELECT
USING (id = get_current_company_id());

CREATE POLICY "Super admin can update company"
ON companies FOR UPDATE
USING (has_permission('settings.manage'));

-- ============================================================
-- 5. PROFILES POLICY
-- ============================================================

CREATE POLICY "Users can view profiles in their company"
ON profiles FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Super admin can manage profiles"
ON profiles FOR INSERT
WITH CHECK (has_permission('settings.manage'));

CREATE POLICY "Super admin can delete profiles"
ON profiles FOR DELETE
USING (has_permission('settings.manage'));

-- ============================================================
-- 6. LAND POLICIES
-- ============================================================

CREATE POLICY "Users can view company lands"
ON lands FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users with create permission can add lands"
ON lands FOR INSERT
WITH CHECK (
  company_id = get_current_company_id()
  AND has_permission('lands.create')
);

CREATE POLICY "Users with edit permission can update lands"
ON lands FOR UPDATE
USING (
  company_id = get_current_company_id()
  AND has_permission('lands.edit')
);

CREATE POLICY "Users with delete permission can soft-delete lands"
ON lands FOR DELETE
USING (has_permission('lands.delete'));

-- ============================================================
-- 7. PROJECT POLICIES
-- ============================================================

CREATE POLICY "Users can view company projects"
ON projects FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users with create permission can add projects"
ON projects FOR INSERT
WITH CHECK (
  company_id = get_current_company_id()
  AND has_permission('projects.create')
);

CREATE POLICY "Users with edit permission can update projects"
ON projects FOR UPDATE
USING (
  company_id = get_current_company_id()
  AND has_permission('projects.edit')
);

-- ============================================================
-- 8. PROJECT PHASES POLICIES
-- ============================================================

CREATE POLICY "Users can view company project phases"
ON project_phases FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage project phases"
ON project_phases FOR INSERT
WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "Users can update project phases"
ON project_phases FOR UPDATE
USING (company_id = get_current_company_id());

-- ============================================================
-- 9. CONTRACTOR POLICIES
-- ============================================================

CREATE POLICY "Users can view company contractors"
ON contractors FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users with create permission can add contractors"
ON contractors FOR INSERT
WITH CHECK (
  company_id = get_current_company_id()
  AND has_permission('contractors.create')
);

CREATE POLICY "Users with edit permission can update contractors"
ON contractors FOR UPDATE
USING (
  company_id = get_current_company_id()
  AND has_permission('contractors.edit')
);

-- ============================================================
-- 10. PROPERTY POLICIES
-- ============================================================

CREATE POLICY "Users can view company properties"
ON properties FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users with create permission can add properties"
ON properties FOR INSERT
WITH CHECK (
  company_id = get_current_company_id()
  AND has_permission('properties.create')
);

CREATE POLICY "Users with edit permission can update properties"
ON properties FOR UPDATE
USING (
  company_id = get_current_company_id()
  AND has_permission('properties.edit')
);

-- ============================================================
-- 11. UNIT POLICIES
-- ============================================================

CREATE POLICY "Users can view company units"
ON units FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage units"
ON units FOR INSERT
WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "Users can update units"
ON units FOR UPDATE
USING (company_id = get_current_company_id());

-- ============================================================
-- 12. TENANT POLICIES
-- ============================================================

CREATE POLICY "Users can view company tenants"
ON tenants FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage tenants"
ON tenants FOR INSERT
WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "Users can update tenants"
ON tenants FOR UPDATE
USING (company_id = get_current_company_id());

-- ============================================================
-- 13. LEASE CONTRACT POLICIES
-- ============================================================

CREATE POLICY "Users can view company lease contracts"
ON lease_contracts FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage lease contracts"
ON lease_contracts FOR INSERT
WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "Users can update lease contracts"
ON lease_contracts FOR UPDATE
USING (company_id = get_current_company_id());

-- ============================================================
-- 14. RENTAL INVOICE POLICIES
-- ============================================================

CREATE POLICY "Users can view company invoices"
ON rental_invoices FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage invoices"
ON rental_invoices FOR INSERT
WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "Users can update invoices"
ON rental_invoices FOR UPDATE
USING (company_id = get_current_company_id());

-- ============================================================
-- 15. RECEIPT POLICIES
-- ============================================================

CREATE POLICY "Users can view company receipts"
ON receipts FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage receipts"
ON receipts FOR INSERT
WITH CHECK (company_id = get_current_company_id());

-- ============================================================
-- 16. MAINTENANCE REQUEST POLICIES
-- ============================================================

CREATE POLICY "Users can view company maintenance requests"
ON maintenance_requests FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage maintenance requests"
ON maintenance_requests FOR INSERT
WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "Users can update maintenance requests"
ON maintenance_requests FOR UPDATE
USING (company_id = get_current_company_id());

-- ============================================================
-- 17. DOCUMENT POLICIES
-- ============================================================

CREATE POLICY "Users can view company documents"
ON documents FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can manage documents"
ON documents FOR INSERT
WITH CHECK (company_id = get_current_company_id());

-- ============================================================
-- 18. FINANCE POLICIES
-- ============================================================

CREATE POLICY "Finance users can view chart of accounts"
ON chart_of_accounts FOR SELECT
USING (
  company_id = get_current_company_id()
  AND has_permission('finance.view')
);

CREATE POLICY "Finance users can view journal entries"
ON journal_entries FOR SELECT
USING (
  company_id = get_current_company_id()
  AND has_permission('finance.view')
);

CREATE POLICY "Finance users can manage journal entries"
ON journal_entries FOR INSERT
WITH CHECK (
  company_id = get_current_company_id()
  AND has_permission('finance.view')
);

CREATE POLICY "Finance users can view journal entry lines"
ON journal_entry_lines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = journal_entry_id
    AND je.company_id = get_current_company_id()
  )
);

-- ============================================================
-- 19. SYSTEM TABLES — permission grants
-- ============================================================

CREATE POLICY "Any authenticated user can read roles"
ON roles FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Any authenticated user can read permissions"
ON permissions FOR SELECT
USING (TRUE);

CREATE POLICY "Any authenticated user can read role_permissions"
ON role_permissions FOR SELECT
USING (TRUE);

CREATE POLICY "Users can read departments"
ON departments FOR SELECT
USING (company_id = get_current_company_id());

CREATE POLICY "Users can read branches"
ON branches FOR SELECT
USING (company_id = get_current_company_id());
