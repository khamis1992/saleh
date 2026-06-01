-- ============================================================
-- Real Estate Development ERP — Phase 1 Seed Data
-- Supabase PostgreSQL
-- ============================================================

-- ============================================================
-- 1. COMPANY
-- ============================================================
INSERT INTO companies (id, name_ar, name_en, cr_number, tax_number, address, phone, email, currency, default_language, fiscal_year_start_month) VALUES
('c0000000-0000-0000-0000-000000000001', 'شركة التطوير العقاري الحديثة', 'Modern Real Estate Development Co.', '1010123456', '300123456789', 'الرياض - طريق الملك فهد - برج الأعمال', '0114567890', 'info@modern-re.com', 'SAR', 'ar', 1);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, company_id, department_name_ar, department_name_en, status) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'الإدارة العليا', 'Executive Management', 'active'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'إدارة المشاريع', 'Project Management', 'active'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'إدارة العقارات والتأجير', 'Property & Leasing', 'active'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'الإدارة المالية', 'Finance', 'active'),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'إدارة الصيانة', 'Maintenance', 'active'),
('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'المشتريات', 'Procurement', 'active');

-- ============================================================
-- 3. ROLES
-- ============================================================
INSERT INTO roles (id, company_id, role_name_ar, role_name_en, description, is_system_role) VALUES
('r0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'مدير النظام', 'Super Admin', 'صلاحيات كاملة على النظام', TRUE),
('r0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'المدير التنفيذي', 'CEO', 'الرئيس التنفيذي', TRUE),
('r0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'مدير مشاريع', 'Project Manager', 'إدارة المشاريع التطويرية', TRUE),
('r0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'مدير عقارات', 'Property Manager', 'إدارة العقارات والوحدات', TRUE),
('r0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'محاسب', 'Accountant', 'إدارة الشؤون المالية', TRUE),
('r0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'مدير صيانة', 'Maintenance Manager', 'إدارة الصيانة والمرافق', TRUE),
('r0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'مستأجر', 'Tenant', 'بوابة المستأجر', TRUE);

-- ============================================================
-- 4. PERMISSIONS
-- ============================================================
INSERT INTO permissions (permission_code, module_name, action_name, description) VALUES
('dashboard.view', 'dashboard', 'view', 'عرض لوحة التحكم'),
('lands.view', 'lands', 'view', 'عرض الأراضي'),
('lands.create', 'lands', 'create', 'إضافة أراضي'),
('lands.edit', 'lands', 'edit', 'تعديل الأراضي'),
('lands.delete', 'lands', 'delete', 'حذف الأراضي'),
('projects.view', 'projects', 'view', 'عرض المشاريع'),
('projects.create', 'projects', 'create', 'إنشاء مشاريع'),
('projects.edit', 'projects', 'edit', 'تعديل المشاريع'),
('contractors.view', 'contractors', 'view', 'عرض المقاولين'),
('contractors.create', 'contractors', 'create', 'إضافة مقاولين'),
('contractors.edit', 'contractors', 'edit', 'تعديل المقاولين'),
('properties.view', 'properties', 'view', 'عرض العقارات'),
('properties.create', 'properties', 'create', 'إضافة عقارات'),
('properties.edit', 'properties', 'edit', 'تعديل العقارات'),
('units.view', 'units', 'view', 'عرض الوحدات'),
('tenants.view', 'tenants', 'view', 'عرض المستأجرين'),
('tenants.create', 'tenants', 'create', 'إضافة مستأجرين'),
('tenants.edit', 'tenants', 'edit', 'تعديل المستأجرين'),
('contracts.view', 'contracts', 'view', 'عرض العقود'),
('contracts.create', 'contracts', 'create', 'إنشاء عقود'),
('contracts.edit', 'contracts', 'edit', 'تعديل العقود'),
('invoices.view', 'invoices', 'view', 'عرض الفواتير'),
('invoices.create', 'invoices', 'create', 'إنشاء فواتير'),
('receipts.create', 'receipts', 'create', 'إنشاء سندات قبض'),
('maintenance.view', 'maintenance', 'view', 'عرض طلبات الصيانة'),
('maintenance.create', 'maintenance', 'create', 'إنشاء طلبات صيانة'),
('maintenance.assign', 'maintenance', 'assign', 'إسناد طلبات الصيانة'),
('finance.view', 'finance', 'view', 'عرض الشؤون المالية'),
('finance.journal_entry', 'finance', 'journal_entry', 'إنشاء قيود يومية'),
('reports.view', 'reports', 'view', 'عرض التقارير'),
('settings.manage', 'settings', 'manage', 'إدارة إعدادات النظام');

-- ============================================================
-- 5. LANDS (3 lands)
-- ============================================================
INSERT INTO lands (id, company_id, land_code, land_name, plot_number, zone, municipality, area_sqm, gps_lat, gps_lng, acquisition_date, acquisition_price, broker_commission, registration_fees, legal_fees, other_costs, total_acquisition_cost, current_estimated_value, title_deed_number, seller_name, status) VALUES
('l0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'LAND-001', 'أرض الخالدية', 'P-2024-001', 'سكني تجاري', 'بلدية العليا', 2500, 24.7136, 46.6753, '2024-01-15', 2000000, 100000, 50000, 25000, 25000, 2200000, 2600000, '142500001', 'شركة الماسة العقارية', 'available'),
('l0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'LAND-002', 'أرض الملقا', 'P-2024-002', 'تجاري', 'بلدية الشمال', 3500, 24.7743, 46.6118, '2024-03-01', 4000000, 200000, 75000, 30000, 35000, 4340000, 5000000, '142560002', 'مؤسسة الأبراج العقارية', 'under_construction'),
('l0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'LAND-003', 'أرض الياسمين', 'P-2024-003', 'سكني', 'بلدية جدة', 1800, 21.5433, 39.1728, '2024-06-15', 1500000, 80000, 40000, 20000, 12000, 1652000, 1872000, '142800003', 'أراضي الحجاز', 'available');

-- ============================================================
-- 6. PROJECTS (3 projects)
-- ============================================================
INSERT INTO projects (id, company_id, project_code, project_name, land_id, project_type, description, planned_start_date, planned_end_date, estimated_budget, approved_budget, completion_percentage, status) VALUES
('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'PRJ-001', 'عمارة النخيل', 'l0000000-0000-0000-0000-000000000001', 'residential_building', 'عمارة سكنية مكونة من 5 طوابق - 20 شقة', '2024-06-01', '2025-06-30', 9500000, 9500000, 78, 'construction'),
('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'PRJ-002', 'أبراج السلام التجارية', 'l0000000-0000-0000-0000-000000000002', 'commercial_building', 'برج تجاري مكون من 12 طابق', '2024-09-01', '2026-12-31', 25000000, 25000000, 45, 'construction'),
('p0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'PRJ-003', 'فلل الياسمين', 'l0000000-0000-0000-0000-000000000003', 'villa_compound', 'مجمع فلل سكنية - 10 فلل', '2025-01-01', '2026-06-30', 7200000, 7200000, 35, 'construction');

-- ============================================================
-- 7. PROJECT PHASES
-- ============================================================
INSERT INTO project_phases (company_id, project_id, phase_name, sequence_number, planned_start, planned_end, progress_percentage, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'التصميم الهندسي', 1, '2024-06-01', '2024-08-31', 100, 'completed'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'أعمال الأساسات', 2, '2024-09-01', '2024-11-30', 100, 'completed'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'الهيكل الخرساني', 3, '2024-12-01', '2025-03-31', 100, 'completed'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'التشطيبات الداخلية', 4, '2025-04-01', '2025-06-30', 60, 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'التصميم والتراخيص', 1, '2024-09-01', '2025-02-28', 100, 'completed'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'الأساسات والهيكل', 2, '2025-03-01', '2026-02-28', 50, 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'التصميم', 1, '2025-01-01', '2025-04-30', 100, 'completed'),
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'الإنشاء', 2, '2025-05-01', '2026-03-31', 35, 'in_progress');

-- ============================================================
-- 8. CONTRACTORS (5 contractors)
-- ============================================================
INSERT INTO contractors (id, company_id, contractor_code, contractor_name, cr_number, specialty, classification, contact_person, phone, email, address, bank_name, iban, rating, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CONT-001', 'شركة البناء المتطور للمقاولات', '1010222333', 'civil', 'درجة أولى', 'أحمد العمري', '0551234567', 'info@binaa.com', 'الرياض - حي المروج', 'الراجحي', 'SA0120000000111222333001', 5, 'active'),
('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'CONT-002', 'مؤسسة الكهرباء الحديثة', '1010444555', 'electrical', 'درجة ثانية', 'محمد القحطاني', '0542345678', 'info@elec.com', 'الرياض - الصناعية القديمة', 'الأهلي', 'SA0210000000222333444001', 4, 'active'),
('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'CONT-003', 'شركة التكييف المركزي', '1010666777', 'hvac', 'درجة ثانية', 'خالد الشمري', '0533456789', 'info@hvac.com', 'جدة - طريق المدينة', 'ساب', 'SA0230000000333444555001', 3, 'active'),
('c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'CONT-004', 'مؤسسة التشطيبات الفاخرة', '1010333444', 'finishing', 'درجة ثانية', 'فهد الدوسري', '0544567890', 'info@finishing.com', 'الدمام - طريق الخليج', 'الرياض', 'SA0330000000555666777001', 4, 'active'),
('c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'CONT-005', 'شركة السباكة الوطنية', '1010555666', 'plumbing', 'درجة ثالثة', 'بندر المطيري', '0535678901', 'info@plumbing.com', 'الرياض - الصناعية', 'الإنماء', 'SA0340000000111222333001', 2, 'inactive');

-- ============================================================
-- 9. PROPERTIES (4 properties)
-- ============================================================
INSERT INTO properties (id, company_id, property_code, property_name, project_id, land_id, property_type, address, land_cost, construction_cost, other_capitalized_cost, total_asset_value, useful_life_years, depreciation_method, annual_depreciation, status) VALUES
('r0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'PROP-001', 'عمارة النخيل', 'p0000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000001', 'residential_building', 'الرياض - حي الخالدية', 2200000, 11200000, 1200000, 14600000, 30, 'straight_line', 486667, 'partially_leased'),
('r0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'PROP-002', 'أبراج السلام التجارية', 'p0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000002', 'commercial_building', 'الرياض - حي الملقا', 4340000, 15800000, 4221000, 24361000, 30, 'straight_line', 812033, 'partially_leased'),
('r0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'PROP-003', 'فلل الياسمين', 'p0000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000003', 'villa_compound', 'جدة - حي الياسمين', 1652000, 7200000, 0, 8852000, 25, 'straight_line', 354080, 'partially_leased'),
('r0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'PROP-004', 'المركز التجاري', 'p0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000002', 'retail_complex', 'الرياض - طريق الملك فهد', 5000000, 23000000, 0, 28000000, 30, 'straight_line', 933333, 'ready_for_leasing');

-- ============================================================
-- 10. UNITS (20 units)
-- ============================================================
INSERT INTO units (company_id, property_id, unit_code, unit_number, unit_type, floor_number, area_sqm, bedrooms, bathrooms, parking_number, electricity_meter, water_meter, furnished_status, expected_monthly_rent, market_monthly_rent, actual_rent, security_deposit_required, condition, status) VALUES
-- عمارة النخيل - 10 شقق
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-001', 'N-101', 'apartment', '1', 120, 2, 2, 'P-001', 'EL-N101', 'WT-N101', 'غير مفروشة', 5000, 5200, 5000, 5000, 'ممتازة', 'leased'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-002', 'N-102', 'apartment', '1', 110, 2, 2, 'P-002', 'EL-N102', 'WT-N102', 'غير مفروشة', 4800, 5000, 4800, 4800, 'جيدة', 'leased'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-003', 'N-201', 'apartment', '2', 130, 3, 2, 'P-003', 'EL-N201', 'WT-N201', 'غير مفروشة', 6500, 6800, 0, 6500, 'ممتازة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-004', 'N-202', 'apartment', '2', 115, 2, 2, 'P-004', 'EL-N202', 'WT-N202', 'غير مفروشة', 5000, 5200, 0, 5000, 'تحتاج صيانة', 'under_maintenance'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-005', 'N-301', 'studio', '3', 65, 0, 1, 'P-005', 'EL-N301', 'WT-N301', 'غير مفروشة', 3000, 3200, 3000, 3000, 'جيدة', 'leased'),
('c0000000-0000-0000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-006', 'N-302', 'studio', '3', 60, 0, 1, 'P-006', 'EL-N302', 'WT-N302', 'غير مفروشة', 2800, 3000, 0, 2800, 'جيدة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-007', 'N-401', 'apartment', '4', 125, 2, 2, 'P-007', 'EL-N401', 'WT-N401', 'غير مفروشة', 5200, 5500, 0, 5200, 'ممتازة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-008', 'N-402', 'apartment', '4', 125, 2, 2, 'P-008', 'EL-N402', 'WT-N402', 'غير مفروشة', 5200, 5500, 5200, 5200, 'ممتازة', 'leased'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-009', 'N-501', 'apartment', '5', 140, 3, 3, 'P-009', 'EL-N501', 'WT-N501', 'غير مفروشة', 7500, 8000, 0, 7500, 'ممتازة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'UNIT-010', 'N-502', 'apartment', '5', 140, 3, 3, 'P-010', 'EL-N502', 'WT-N502', 'غير مفروشة', 7500, 8000, 0, 7500, 'جيدة', 'available'),
-- أبراج السلام - 6 مكاتب
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'UNIT-011', 'S-201', 'office', '2', 85, 0, 1, 'P-101', 'EL-S201', 'WT-S201', 'غير مفروشة', 10000, 11000, 10000, 10000, 'ممتازة', 'leased'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'UNIT-012', 'S-202', 'office', '2', 70, 0, 1, 'P-102', 'EL-S202', 'WT-S202', 'غير مفروشة', 8000, 8500, 0, 8000, 'جيدة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'UNIT-013', 'S-301', 'office', '3', 90, 0, 1, 'P-103', 'EL-S301', 'WT-S301', 'غير مفروشة', 11000, 12000, 0, 11000, 'ممتازة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'UNIT-014', 'S-302', 'office', '3', 75, 0, 1, 'P-104', 'EL-S302', 'WT-S302', 'غير مفروشة', 8500, 9000, 0, 8500, 'جيدة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'UNIT-015', 'S-401', 'office', '4', 95, 0, 1, 'P-105', 'EL-S401', 'WT-S401', 'غير مفروشة', 12000, 13000, 0, 12000, 'ممتازة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'UNIT-016', 'S-402', 'office', '4', 80, 0, 1, 'P-106', 'EL-S402', 'WT-S402', 'غير مفروشة', 9000, 9500, 9000, 9000, 'جيدة', 'leased'),
-- فلل الياسمين - 4 فلل
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000003', 'UNIT-017', 'Y-V01', 'villa', '1', 280, 4, 4, 'P-Y01', 'EL-Y01', 'WT-Y01', 'غير مفروشة', 15000, 16000, 15000, 15000, 'ممتازة', 'leased'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000003', 'UNIT-018', 'Y-V02', 'villa', '1', 250, 3, 3, 'P-Y02', 'EL-Y02', 'WT-Y02', 'غير مفروشة', 13000, 14000, 0, 13000, 'جيدة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000003', 'UNIT-019', 'Y-V03', 'villa', '1', 260, 3, 3, 'P-Y03', 'EL-Y03', 'WT-Y03', 'غير مفروشة', 13500, 14000, 0, 13500, 'ممتازة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000003', 'UNIT-020', 'Y-V04', 'villa', '1', 240, 3, 3, 'P-Y04', 'EL-Y04', 'WT-Y04', 'غير مفروشة', 12500, 13000, 0, 12500, 'ممتازة', 'available');

-- ============================================================
-- 11. TENANTS (10 tenants)
-- ============================================================
INSERT INTO tenants (company_id, tenant_code, tenant_type, full_name, company_name, national_id, phone, email, employer, address, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'TNT-001', 'individual', 'عبدالله محمد العتيبي', NULL, '1001234567', '0501111111', 'abdullah@email.com', 'شركة أرامكو', 'الرياض - حي الياسمين', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-002', 'individual', 'نورة سعد القحطاني', NULL, '1002345678', '0502222222', 'noura@email.com', 'وزارة التعليم', 'الرياض - حي النخيل', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-003', 'individual', 'فيصل خالد الدوسري', NULL, '1003456789', '0503333333', 'faisal@email.com', 'شركة الاتصالات', 'الرياض - حي الملقا', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-004', 'individual', 'سارة عبدالرحمن الشمري', NULL, '1004567890', '0504444444', 'sara@email.com', 'مستشفى الملك فيصل', 'الرياض - حي الخالدية', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-005', 'company', NULL, 'شركة التقنية المتقدمة', '1010777888', '0112345678', 'info@tech.com', NULL, 'الرياض - طريق الملك فهد', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-006', 'individual', 'خالد فهد المطيري', NULL, '1005678901', '0505555555', 'khaled@email.com', 'البنك الأهلي', 'جدة - حي الروضة', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-007', 'individual', 'منيرة تركي العتيبي', NULL, '1006789012', '0506666666', 'moneera@email.com', 'طبيبة أسنان', 'الرياض - حي الصحافة', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-008', 'company', NULL, 'مكتب المحاماة القانوني', '1010888999', '0113456789', 'info@law.com', NULL, 'الرياض - حي الورود', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-009', 'individual', 'بندر محمد السبيعي', NULL, '1007890123', '0507777777', 'bandar@email.com', 'طيار', 'الرياض - حي المغرزات', 'active'),
('c0000000-0000-0000-0000-000000000001', 'TNT-010', 'individual', 'هند فهد الرشيد', NULL, '1008901234', '0508888888', 'hind@email.com', 'مهندسة', 'جدة - حي السلامة', 'active');

-- ============================================================
-- 12. LEASE CONTRACTS (8 contracts)
-- ============================================================
INSERT INTO lease_contracts (company_id, contract_number, tenant_id, property_id, unit_id, start_date, end_date, rent_amount, payment_frequency, security_deposit, admin_fees, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'LSE-001', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-01-01', '2025-12-31', 5000, 'monthly', 5000, 500, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-002', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-002'), '2025-02-01', '2026-01-31', 4800, 'monthly', 4800, 500, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-003', (SELECT id FROM tenants WHERE tenant_code='TNT-003'), 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-005'), '2025-03-01', '2026-02-28', 3000, 'monthly', 3000, 300, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-004', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), 'r0000000-0000-0000-0000-000000000002', (SELECT id FROM units WHERE unit_code='UNIT-011'), '2025-01-15', '2025-12-31', 10000, 'monthly', 10000, 1000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-005', (SELECT id FROM tenants WHERE tenant_code='TNT-008'), 'r0000000-0000-0000-0000-000000000002', (SELECT id FROM units WHERE unit_code='UNIT-016'), '2025-04-01', '2026-03-31', 9000, 'quarterly', 9000, 1000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-006', (SELECT id FROM tenants WHERE tenant_code='TNT-006'), 'r0000000-0000-0000-0000-000000000003', (SELECT id FROM units WHERE unit_code='UNIT-017'), '2025-03-01', '2026-02-28', 15000, 'monthly', 15000, 1500, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-007', (SELECT id FROM tenants WHERE tenant_code='TNT-004'), 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-008'), '2025-05-01', '2026-04-30', 5200, 'monthly', 5200, 500, 'active'),
('c0000000-0000-0000-0000-000000000001', 'LSE-008', (SELECT id FROM tenants WHERE tenant_code='TNT-007'), 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-06-01', '2026-05-31', 5000, 'quarterly', 5000, 500, 'pending_approval');

-- ============================================================
-- 13. RENTAL INVOICES (20 invoices)
-- ============================================================
INSERT INTO rental_invoices (company_id, invoice_number, tenant_id, contract_id, unit_id, invoice_date, due_date, rent_amount, service_charges, total, paid_amount, balance, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'INV-001', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-01-01', '2025-01-15', 5000, 200, 5200, 5200, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-002', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-02-01', '2025-02-15', 5000, 200, 5200, 5200, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-003', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-03-01', '2025-03-15', 5000, 200, 5200, 5200, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-004', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-04-01', '2025-04-15', 5000, 200, 5200, 5200, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-005', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), '2025-02-01', '2025-02-15', 4800, 200, 5000, 5000, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-006', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), '2025-03-01', '2025-03-15', 4800, 200, 5000, 5000, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-007', (SELECT id FROM tenants WHERE tenant_code='TNT-003'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-003'), (SELECT id FROM units WHERE unit_code='UNIT-005'), '2025-03-01', '2025-03-15', 3000, 100, 3100, 3100, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-008', (SELECT id FROM tenants WHERE tenant_code='TNT-003'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-003'), (SELECT id FROM units WHERE unit_code='UNIT-005'), '2025-04-01', '2025-04-15', 3000, 100, 3100, 3100, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-009', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), (SELECT id FROM units WHERE unit_code='UNIT-011'), '2025-01-15', '2025-02-01', 10000, 500, 10500, 10500, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-010', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), (SELECT id FROM units WHERE unit_code='UNIT-011'), '2025-02-15', '2025-03-01', 10000, 500, 10500, 10500, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-011', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), (SELECT id FROM units WHERE unit_code='UNIT-011'), '2025-03-15', '2025-04-01', 10000, 500, 10500, 10500, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-012', (SELECT id FROM tenants WHERE tenant_code='TNT-008'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-005'), (SELECT id FROM units WHERE unit_code='UNIT-016'), '2025-04-01', '2025-04-15', 9000, 300, 9300, 9300, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-013', (SELECT id FROM tenants WHERE tenant_code='TNT-006'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-006'), (SELECT id FROM units WHERE unit_code='UNIT-017'), '2025-03-01', '2025-03-15', 15000, 500, 15500, 15500, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-014', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), (SELECT id FROM units WHERE unit_code='UNIT-001'), '2025-05-01', '2025-05-15', 5000, 200, 5200, 2000, 3200, 'partially_paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-015', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), '2025-04-01', '2025-04-15', 4800, 200, 5000, 0, 5000, 'overdue'),
('c0000000-0000-0000-0000-000000000001', 'INV-016', (SELECT id FROM tenants WHERE tenant_code='TNT-003'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-003'), (SELECT id FROM units WHERE unit_code='UNIT-005'), '2025-05-01', '2025-05-15', 3000, 100, 3100, 0, 3100, 'overdue'),
('c0000000-0000-0000-0000-000000000001', 'INV-017', (SELECT id FROM tenants WHERE tenant_code='TNT-004'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-007'), (SELECT id FROM units WHERE unit_code='UNIT-008'), '2025-05-01', '2025-05-15', 5200, 200, 5400, 5400, 0, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'INV-018', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), (SELECT id FROM units WHERE unit_code='UNIT-011'), '2025-04-15', '2025-05-01', 10000, 500, 10500, 0, 10500, 'issued'),
('c0000000-0000-0000-0000-000000000001', 'INV-019', (SELECT id FROM tenants WHERE tenant_code='TNT-008'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-005'), (SELECT id FROM units WHERE unit_code='UNIT-016'), '2025-07-01', '2025-07-15', 9000, 300, 9300, 0, 9300, 'issued'),
('c0000000-0000-0000-0000-000000000001', 'INV-020', (SELECT id FROM tenants WHERE tenant_code='TNT-006'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-006'), (SELECT id FROM units WHERE unit_code='UNIT-017'), '2025-04-01', '2025-04-15', 15000, 500, 15500, 5000, 10500, 'partially_paid');

-- ============================================================
-- 14. RECEIPTS (10 receipts)
-- ============================================================
INSERT INTO receipts (company_id, receipt_number, tenant_id, invoice_id, contract_id, payment_date, payment_method, amount, reference_number) VALUES
('c0000000-0000-0000-0000-000000000001', 'RCP-001', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-01-10', 'bank_transfer', 5200, 'TRF-20250110-001'),
('c0000000-0000-0000-0000-000000000001', 'RCP-002', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-02-10', 'bank_transfer', 5200, 'TRF-20250210-002'),
('c0000000-0000-0000-0000-000000000001', 'RCP-003', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-003'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-03-12', 'bank_transfer', 5200, 'TRF-20250312-003'),
('c0000000-0000-0000-0000-000000000001', 'RCP-004', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-005'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), '2025-02-08', 'bank_transfer', 5000, 'TRF-20250208-004'),
('c0000000-0000-0000-0000-000000000001', 'RCP-005', (SELECT id FROM tenants WHERE tenant_code='TNT-003'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-007'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-003'), '2025-03-05', 'cash', 3100, NULL),
('c0000000-0000-0000-0000-000000000001', 'RCP-006', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-009'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), '2025-01-20', 'bank_transfer', 10500, 'TRF-20250120-006'),
('c0000000-0000-0000-0000-000000000001', 'RCP-007', (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-010'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), '2025-02-18', 'bank_transfer', 10500, 'TRF-20250218-007'),
('c0000000-0000-0000-0000-000000000001', 'RCP-008', (SELECT id FROM tenants WHERE tenant_code='TNT-006'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-013'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-006'), '2025-03-10', 'cheque', 15500, 'CHQ-500123'),
('c0000000-0000-0000-0000-000000000001', 'RCP-009', (SELECT id FROM tenants WHERE tenant_code='TNT-004'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-017'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-007'), '2025-05-10', 'bank_transfer', 5400, 'TRF-20250510-009'),
('c0000000-0000-0000-0000-000000000001', 'RCP-010', (SELECT id FROM tenants WHERE tenant_code='TNT-006'), (SELECT id FROM rental_invoices WHERE invoice_number='INV-020'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-006'), '2025-04-10', 'bank_transfer', 5000, 'TRF-20250410-010');

-- ============================================================
-- 15. MAINTENANCE REQUESTS (8 requests)
-- ============================================================
INSERT INTO maintenance_requests (company_id, request_number, property_id, unit_id, tenant_id, category, priority, description, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'MNT-001', 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-001'), (SELECT id FROM tenants WHERE tenant_code='TNT-001'), 'ac', 'high', 'المكيف لا يبرد بشكل كافٍ', 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'MNT-002', 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-002'), (SELECT id FROM tenants WHERE tenant_code='TNT-002'), 'plumbing', 'medium', 'تسرب مياه من الحوض', 'submitted'),
('c0000000-0000-0000-0000-000000000001', 'MNT-003', 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-004'), NULL, 'painting', 'low', 'حاجة الجدران للدهان', 'under_review'),
('c0000000-0000-0000-0000-000000000001', 'MNT-004', 'r0000000-0000-0000-0000-000000000002', (SELECT id FROM units WHERE unit_code='UNIT-011'), (SELECT id FROM tenants WHERE tenant_code='TNT-005'), 'electrical', 'emergency', 'انقطاع الكهرباء في المكتب', 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'MNT-005', 'r0000000-0000-0000-0000-000000000002', (SELECT id FROM units WHERE unit_code='UNIT-016'), (SELECT id FROM tenants WHERE tenant_code='TNT-008'), 'door_window', 'medium', 'الباب الرئيسي لا يغلق جيداً', 'completed'),
('c0000000-0000-0000-0000-000000000001', 'MNT-006', 'r0000000-0000-0000-0000-000000000003', (SELECT id FROM units WHERE unit_code='UNIT-017'), (SELECT id FROM tenants WHERE tenant_code='TNT-006'), 'water_leakage', 'high', 'تسرب مياه من السقف', 'assigned'),
('c0000000-0000-0000-0000-000000000001', 'MNT-007', 'r0000000-0000-0000-0000-000000000001', NULL, NULL, 'elevator', 'emergency', 'المصعد متوقف عن العمل', 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'MNT-008', 'r0000000-0000-0000-0000-000000000001', (SELECT id FROM units WHERE unit_code='UNIT-005'), (SELECT id FROM tenants WHERE tenant_code='TNT-003'), 'general', 'low', 'تغيير لمبات الإضاءة', 'closed');

-- ============================================================
-- 16. CHART OF ACCOUNTS
-- ============================================================
INSERT INTO chart_of_accounts (company_id, account_code, account_name_ar, account_name_en, account_type, parent_account_id, level, is_postable) VALUES
-- Level 1: Main groups
('c0000000-0000-0000-0000-000000000001', '1000', 'الأصول', 'Assets', 'asset', NULL, 1, FALSE),
('c0000000-0000-0000-0000-000000000001', '2000', 'الخصوم', 'Liabilities', 'liability', NULL, 1, FALSE),
('c0000000-0000-0000-0000-000000000001', '3000', 'حقوق الملكية', 'Equity', 'equity', NULL, 1, FALSE),
('c0000000-0000-0000-0000-000000000001', '4000', 'الإيرادات', 'Revenue', 'revenue', NULL, 1, FALSE),
('c0000000-0000-0000-0000-000000000001', '5000', 'المصروفات', 'Expenses', 'expense', NULL, 1, FALSE),
-- Level 2: Sub-accounts
('c0000000-0000-0000-0000-000000000001', '1100', 'النقدية والبنوك', 'Cash & Banks', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code='1000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '1200', 'ذمم المستأجرين', 'Tenant Receivables', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code='1000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '1300', 'الأراضي', 'Lands', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code='1000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '1400', 'المباني', 'Buildings', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code='1000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '2100', 'ذمم الموردين', 'Supplier Payables', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code='2000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '2200', 'تأمينات المستأجرين', 'Tenant Deposits', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code='2000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '4100', 'إيرادات الإيجارات', 'Rental Income', 'revenue', (SELECT id FROM chart_of_accounts WHERE account_code='4000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '4200', 'إيرادات الخدمات', 'Service Charge Income', 'revenue', (SELECT id FROM chart_of_accounts WHERE account_code='4000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '5100', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code='5000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '5200', 'مصروفات إدارية', 'Administrative Expenses', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code='5000'), 2, TRUE),
('c0000000-0000-0000-0000-000000000001', '5300', 'الرواتب والأجور', 'Salaries & Wages', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code='5000'), 2, TRUE);
