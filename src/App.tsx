import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useAuth } from '@/providers/AuthContext';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ExecutiveDashboardPage from '@/pages/dashboard/ExecutiveDashboardPage';

// Module pages
import LandListPage from '@/pages/lands/LandListPage';
import LandCreatePage from '@/pages/lands/LandCreatePage';

import ProjectListPage from '@/pages/projects/ProjectListPage';
import ConstructionProjectsPage from '@/components/projects/ConstructionProjectsPage';
import ProjectCreatePage from '@/pages/projects/ProjectCreatePage';
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage';

import ContractorListPage from '@/pages/contractors/ContractorListPage';
import ConstructionContractorsPage from '@/components/projects/ConstructionContractorsPage';
import ContractorCreatePage from '@/pages/contractors/ContractorCreatePage';
import ContractorDetailPage from '@/pages/contractors/ContractorDetailPage';

import PropertyListPage from '@/pages/properties/PropertyListPage';
import LeasingPropertiesPage from '@/components/projects/LeasingPropertiesPage';
import PropertyCreatePage from '@/pages/properties/PropertyCreatePage';
import PropertyDetailPage from '@/pages/properties/PropertyDetailPage';

import UnitListPage from '@/pages/units/UnitListPage';
import LeasingUnitsPage from '@/components/projects/LeasingUnitsPage';
import UnitCreatePage from '@/pages/units/UnitCreatePage';
import UnitDetailPage from '@/pages/units/UnitDetailPage';

import TenantListPage from '@/pages/tenants/TenantListPage';
import LeasingTenantsPage from '@/components/projects/LeasingTenantsPage';
import TenantCreatePage from '@/pages/tenants/TenantCreatePage';
import TenantDetailPage from '@/pages/tenants/TenantDetailPage';

import LeaseListPage from '@/pages/leases/LeaseListPage';
import LeasingLeasesPage from '@/components/projects/LeasingLeasesPage';
import LeaseCreatePage from '@/pages/leases/LeaseCreatePage';
import LeaseDetailPage from '@/pages/leases/LeaseDetailPage';
import ContractRenewalPage from '@/pages/leases/ContractRenewalPage';
import ContractTerminationPage from '@/pages/leases/ContractTerminationPage';
import LeasingPipelinePage from '@/pages/leases/LeasingPipelinePage';

import RentInvoicesPage from '@/pages/rent-collection/RentInvoicesPage';
import LeasingCollectionsPage from '@/components/projects/LeasingCollectionsPage';
import RentInvoiceCreatePage from '@/pages/rent-collection/RentInvoiceCreatePage';
import RentReceiptsPage from '@/pages/rent-collection/RentReceiptsPage';

import MaintenanceRequestListPage from '@/pages/maintenance/MaintenanceRequestListPage';
import MaintenanceRequestsPage from '@/components/projects/MaintenanceRequestsPage';
import MaintenanceRequestDetailPage from '@/pages/maintenance/MaintenanceRequestDetailPage';

import FinanceAccountsPageOld from '@/pages/finance/FinanceAccountsPage';
import FinanceAccountsPage from '@/components/projects/FinanceAccountsPage';
import FinanceJournalEntriesPage from '@/pages/finance/FinanceJournalEntriesPage';
import PeriodClosingPage from '@/pages/finance/PeriodClosingPage';
import ThreeWayMatchPage from '@/pages/finance/ThreeWayMatchPage';

import SettingsPage from '@/pages/settings/SettingsPage';
import RolesPage from '@/pages/settings/RolesPage';
import UsersPage from '@/pages/users/UsersPage';
import DocumentsPageOld from '@/pages/documents/DocumentsPage';
import DocumentsPage from '@/components/projects/DocumentsPage';
import ReportsPageOld from '@/pages/reports/ReportsPage';
import ReportsPage from '@/components/projects/ReportsPage';
import LandReportsPage from '@/pages/reports/LandReportsPage';
import ProjectProgressReport from '@/pages/reports/ProjectProgressReport';
import OccupancyReport from '@/pages/reports/OccupancyReport';
import RentRollReport from '@/pages/reports/RentRollReport';
import OverdueReport from '@/pages/reports/OverdueReport';
import ReceivablesAgingReport from '@/pages/reports/ReceivablesAgingReport';
import StockBalanceReport from '@/pages/reports/StockBalanceReport';
import ContractorPerformanceReport from '@/pages/reports/ContractorPerformanceReport';
import MaintenanceReport from '@/pages/reports/MaintenanceReport';
import PayrollSummaryReport from '@/pages/reports/PayrollSummaryReport';
import TrialBalancePage from '@/pages/reports/TrialBalancePage';
import ProfitLossPage from '@/pages/reports/ProfitLossPage';
import BalanceSheetPage from '@/pages/reports/BalanceSheetPage';
import CashFlowPage from '@/pages/reports/CashFlowPage';
import ComingSoonPage from '@/components/shared/ComingSoonPage';
import { PermissionGuard } from '@/components/shared/Phase3Components';

// Work Centers, Tasks, Queues, Wizards — Phase 1-3
import ExecutiveCenterPage from '@/pages/centers/ExecutiveCenterPage';
import ConstructionCenterPage from '@/pages/centers/ConstructionCenterPage';
import PropertyCenterPage from '@/pages/centers/PropertyCenterPage';
import FinanceCenterPage from '@/pages/centers/FinanceCenterPage';
import MaintenanceCenterPage from '@/pages/centers/MaintenanceCenterPage';
import ProcurementCenterPage from '@/pages/centers/ProcurementCenterPage';
import MyTasksPage from '@/pages/tasks/MyTasksPage';
import ApprovalsQueuePage from '@/pages/queues/ApprovalsQueuePage';
import CollectionQueuePage from '@/pages/queues/CollectionQueuePage';
import MaintenanceQueuePage from '@/pages/queues/MaintenanceQueuePage';
import ConstructionQueuePage from '@/pages/queues/ConstructionQueuePage';
import ProcurementQueuePage from '@/pages/queues/ProcurementQueuePage';
import ProjectWizardPage from '@/pages/wizards/ProjectWizardPage';
import ConversionWizardPage from '@/pages/wizards/ConversionWizardPage';
import LeaseWizardPage from '@/pages/wizards/LeaseWizardPage';
import PaymentWizardPage from '@/pages/wizards/PaymentWizardPage';
import ClaimWizardPage from '@/pages/wizards/ClaimWizardPage';
import MaintenanceWizardPage from '@/pages/wizards/MaintenanceWizardPage';
import PurchaseRequestWizardPage from '@/pages/wizards/PurchaseRequestWizardPage';
import ContractorContractsPage from '@/pages/construction/ContractorContractsPage';
import ContractorClaimsPage from '@/pages/construction/ContractorClaimsPage';
import DailyReportsPageOld from '@/pages/construction/DailyReportsPage';
import DailyReportsPage from '@/components/projects/DailyReportsPage';
import ProgressUpdatesPageOld from '@/pages/construction/ProgressUpdatesPage';
import ProgressUpdatesPage from '@/components/projects/ProgressUpdatesPage';

// Merged mega-pages — now replaced by ModuleLayout sub-navigation
import MyWorkPage from '@/pages/MyWorkPage';
import FinanceMergedPage from '@/pages/FinanceMergedPage';
import MaintenanceMergedPage from '@/pages/MaintenanceMergedPage';
import QueuesMergedPageOld from '@/pages/QueuesMergedPage';
import QueuesMergedPage from '@/components/projects/QueuesMergedPage';
import WarehousesPage from '@/pages/inventory/WarehousesPage';
import InventoryPage from '@/components/projects/InventoryItemsPage';
import StockTransactionsPage from '@/pages/inventory/StockTransactionsPage';
import ProjectBudgetsPageOld from '@/pages/budgets/ProjectBudgetsPage';
import ProjectBudgetsPage from '@/components/projects/ProjectBudgetsPage';
import QuotationComparisonPage from '@/pages/procurement/QuotationComparisonPage';
import RFQListPage from '@/pages/procurement/RFQListPage';
import ProcurementRFQsPage from '@/components/projects/ProcurementRFQsPage';
import VendorScorecardPage from '@/pages/procurement/VendorScorecardPage';

// Phase 3 pages
import EmployeesPageOld from '@/pages/hr/EmployeesPage';
import EmployeesPage from '@/components/projects/EmployeesPage';
import AttendancePageOld from '@/pages/hr/AttendancePage';
import AttendancePage from '@/components/projects/AttendancePage';
import PayrollPageOld from '@/pages/hr/PayrollPage';
import PayrollPage from '@/components/projects/PayrollPage';
import LeaveManagementPageOld from '@/pages/hr/LeaveManagementPage';
import LeaveManagementPage from '@/components/projects/LeaveManagementPage';
import CostCentersPage from '@/pages/finance/CostCentersPage';
import BankAccountsPage from '@/pages/finance/BankAccountsPage';

// Phase 4 pages
import ProjectTasksPage from '@/pages/projects/ProjectTasksPage';
import InspectionsPage from '@/pages/maintenance/InspectionsPage';
import AssetRegistryPage from '@/pages/maintenance/AssetRegistryPage';
import ChangeOrdersPage from '@/pages/construction/ChangeOrdersPage';
import RiskRegisterPage from '@/pages/construction/RiskRegisterPage';
import MaintenanceDashboardPage from '@/pages/maintenance/MaintenanceDashboardPage';
import InspectionBuilderPage from '@/pages/maintenance/InspectionBuilderPage';
import NumberingSettingsPage from '@/pages/settings/NumberingSettingsPage';

// Missing imports — pages exist but weren't registered
import VendorsPage from '@/pages/procurement/VendorsPage';
import ProcurementVendorsPage from '@/components/projects/ProcurementVendorsPage';
import PurchaseRequestsPage from '@/pages/procurement/PurchaseRequestsPage';
import ProcurementRequestsPage from '@/components/projects/ProcurementRequestsPage';
import PurchaseOrdersPage from '@/pages/procurement/PurchaseOrdersPage';
import ProcurementOrdersPage from '@/components/projects/ProcurementOrdersPage';
import GoodsReceiptsPage from '@/pages/procurement/GoodsReceiptsPage';
import ProcurementReceiptsPage from '@/components/projects/ProcurementReceiptsPage';
import RentSchedulesPage from '@/pages/rent-collection/RentSchedulesPage';
import ChequesPage from '@/pages/finance/ChequesPage';
import FinanceDashboardPage from '@/pages/finance/FinanceDashboardPage';
import PropertyValuationPage from '@/pages/finance/PropertyValuationPage';
import CalendarPageOld from '@/pages/calendar/CalendarPage';
import CalendarPage from '@/components/projects/CalendarPage';
import CashFlowForecastPage from '@/pages/finance/CashFlowForecastPage';
import WorkOrdersPage from '@/pages/maintenance/WorkOrdersPage';
import PreventiveMaintenancePage from '@/pages/maintenance/PreventiveMaintenancePage';
import LegalCasesPage from '@/pages/legal/LegalCasesPage';
import AuditLogPage from '@/pages/system/AuditLogPage';
import ProjectConversionPage from '@/pages/projects/ProjectConversionPage';
import BuildingsPage from '@/pages/properties/BuildingsPage';
import EquipmentPage from '@/pages/equipment/EquipmentPage';
import EquipmentPageNew from '@/components/projects/EquipmentPage';
import LegalNoticesPageOld from '@/pages/legal/LegalNoticesPage';
import LegalNoticesPage from '@/components/projects/LegalNoticesPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return <PermissionGuard permission="dashboard.view">{children}</PermissionGuard>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="executive-dashboard" element={<ExecutiveDashboardPage />} />

        {/* Work Centers (Phase 1) */}
        <Route path="centers/executive" element={<ExecutiveCenterPage />} />
        <Route path="centers/construction" element={<ConstructionCenterPage />} />
        <Route path="centers/property" element={<PropertyCenterPage />} />
        <Route path="centers/finance" element={<FinanceCenterPage />} />
        <Route path="centers/maintenance" element={<MaintenanceCenterPage />} />
        <Route path="centers/procurement" element={<ProcurementCenterPage />} />

        {/* My Tasks + Queues (Phase 2) */}
        <Route path="tasks" element={<MyTasksPage />} />
        <Route path="queues/approvals" element={<ApprovalsQueuePage />} />
        <Route path="queues/collection" element={<CollectionQueuePage />} />
        <Route path="queues/maintenance" element={<MaintenanceQueuePage />} />
        <Route path="queues/construction" element={<ConstructionQueuePage />} />

        {/* Wizards (Phase 3) */}
        <Route path="wizards/project" element={<ProjectWizardPage />} />
        <Route path="wizards/conversion" element={<ConversionWizardPage />} />
        <Route path="wizards/lease" element={<LeaseWizardPage />} />
        <Route path="wizards/payment" element={<PaymentWizardPage />} />
        <Route path="wizards/claim" element={<ClaimWizardPage />} />
        <Route path="wizards/maintenance" element={<MaintenanceWizardPage />} />
        <Route path="wizards/purchase-request" element={<PurchaseRequestWizardPage />} />

        {/* Queues (Phase 2) */}
        <Route path="queues/procurement" element={<ProcurementQueuePage />} />

        {/* Lands */}
        <Route path="lands" element={<LandListPage />} />
        <Route path="lands/create" element={<LandCreatePage />} />
        <Route path="lands/:id" element={<LandCreatePage />} />
        <Route path="lands/:id/edit" element={<LandCreatePage />} />

        {/* Projects */}
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/create" element={<ProjectCreatePage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="projects/:id/edit" element={<ProjectCreatePage />} />

        {/* Contractors */}
        <Route path="contractors" element={<ContractorListPage />} />
        <Route path="contractors/create" element={<ContractorCreatePage />} />
        <Route path="contractors/:id" element={<ContractorDetailPage />} />
        <Route path="contractors/:id/edit" element={<ContractorCreatePage />} />

        {/* Properties */}
        <Route path="properties" element={<PropertyListPage />} />
        <Route path="properties/create" element={<PropertyCreatePage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/:id/edit" element={<PropertyCreatePage />} />

        {/* Units */}
        <Route path="units" element={<UnitListPage />} />
        <Route path="units/create" element={<UnitCreatePage />} />
        <Route path="units/:id" element={<UnitDetailPage />} />
        <Route path="units/:id/edit" element={<UnitCreatePage />} />

        {/* Tenants */}
        <Route path="tenants" element={<TenantListPage />} />
        <Route path="tenants/create" element={<TenantCreatePage />} />
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="tenants/:id/edit" element={<TenantCreatePage />} />

        {/* Leases */}
        <Route path="leases" element={<LeaseListPage />} />
        <Route path="leases/create" element={<LeaseCreatePage />} />
        <Route path="leases/:id" element={<LeaseDetailPage />} />
        <Route path="leases/:id/edit" element={<LeaseCreatePage />} />
        <Route path="leases/:id/renew" element={<ContractRenewalPage />} />
        <Route path="leases/:id/terminate" element={<ContractTerminationPage />} />
        <Route path="leases/terminate" element={<ContractTerminationPage />} />
        <Route path="leases/renew" element={<ContractRenewalPage />} />
        <Route path="leases/pipeline" element={<LeasingPipelinePage />} />

        {/* Rent Collection */}
        <Route path="rent-collection" element={<RentInvoicesPage />} />
        <Route path="rent-collection/invoices" element={<RentInvoicesPage />} />
        <Route path="rent-collection/invoices/create" element={<RentInvoiceCreatePage />} />
        <Route path="rent-collection/invoices/:id/edit" element={<RentInvoiceCreatePage />} />
        <Route path="rent-collection/receipts" element={<RentReceiptsPage />} />

        {/* Maintenance — sub-navigation */}
        <Route path="maintenance" element={<ModuleLayout subNav={[
          { title: 'طلبات الصيانة', href: '/maintenance/requests' },
          { title: 'أوامر العمل', href: '/maintenance/work-orders' },
          { title: 'الصيانة الوقائية', href: '/maintenance/preventive' },
          { title: 'المعاينات', href: '/maintenance/inspections' },
          { title: 'الأصول', href: '/maintenance/assets' },
        ]} />}>
          <Route index element={<Navigate to="/maintenance/requests" replace />} />
          <Route path="requests" element={<MaintenanceRequestsPage />} />
          <Route path="requests/:id" element={<MaintenanceRequestDetailPage />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="preventive" element={<PreventiveMaintenancePage />} />
          <Route path="inspections" element={<InspectionsPage />} />
          <Route path="assets" element={<AssetRegistryPage />} />
          <Route path="inspection-builder" element={<InspectionBuilderPage />} />
          <Route path="dashboard" element={<MaintenanceDashboardPage />} />
        </Route>

        {/* Finance — sub-navigation */}
        <Route path="finance" element={<ModuleLayout subNav={[
          { title: 'الحسابات', href: '/finance/accounts' },
          { title: 'قيود اليومية', href: '/finance/journal-entries' },
          { title: 'مراكز التكلفة', href: '/finance/cost-centers' },
          { title: 'حسابات بنكية', href: '/finance/bank-accounts' },
          { title: 'شيكات', href: '/finance/cheques' },
          { title: 'لوحة مالية', href: '/finance/dashboard' },
        ]} />}>
          <Route index element={<Navigate to="/finance/accounts" replace />} />
          <Route path="accounts" element={<FinanceAccountsPage />} />
          <Route path="journal-entries" element={<FinanceJournalEntriesPage />} />
          <Route path="cost-centers" element={<CostCentersPage />} />
          <Route path="bank-accounts" element={<BankAccountsPage />} />
          <Route path="cheques" element={<ChequesPage />} />
          <Route path="dashboard" element={<FinanceDashboardPage />} />
          <Route path="period-closing" element={<PeriodClosingPage />} />
          <Route path="three-way-match" element={<ThreeWayMatchPage />} />
          <Route path="cash-flow-forecast" element={<CashFlowForecastPage />} />
          <Route path="valuation" element={<PropertyValuationPage />} />
        </Route>

        {/* Settings & Users */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/roles" element={<RolesPage />} />
        <Route path="users" element={<UsersPage />} />

        {/* Documents & Reports */}
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/lands" element={<LandReportsPage />} />
        <Route path="reports/project-progress" element={<ProjectProgressReport />} />
        <Route path="reports/occupancy" element={<OccupancyReport />} />
        <Route path="reports/rent-roll" element={<RentRollReport />} />
        <Route path="reports/overdue" element={<OverdueReport />} />
        <Route path="reports/receivables-aging" element={<ReceivablesAgingReport />} />
        <Route path="reports/stock-balance" element={<StockBalanceReport />} />
        <Route path="reports/contractor-performance" element={<ContractorPerformanceReport />} />
        <Route path="reports/maintenance" element={<MaintenanceReport />} />
        <Route path="reports/payroll-summary" element={<PayrollSummaryReport />} />
        <Route path="reports/trial-balance" element={<TrialBalancePage />} />
        <Route path="reports/profit-loss" element={<ProfitLossPage />} />
        <Route path="reports/balance-sheet" element={<BalanceSheetPage />} />
        <Route path="reports/cash-flow" element={<CashFlowPage />} />

        {/* Construction (Phase 2) */}
        <Route path="construction" element={<Navigate to="/construction/contracts" />} />
        <Route path="construction/contracts" element={<ContractorContractsPage />} />
        <Route path="construction/claims" element={<ContractorClaimsPage />} />
        <Route path="construction/daily-reports" element={<DailyReportsPage />} />
        <Route path="construction/progress" element={<ProgressUpdatesPage />} />

        {/* Procurement & Inventory — sub-navigation */}
        <Route path="procurement" element={<ModuleLayout subNav={[
          { title: 'طلبات الشراء', href: '/procurement/requests' },
          { title: 'عروض الأسعار', href: '/procurement/rfqs' },
          { title: 'أوامر الشراء', href: '/procurement/orders' },
          { title: 'استلام البضائع', href: '/procurement/receipts' },
          { title: 'الموردون', href: '/procurement/vendors' },
        ]} />}>
          <Route index element={<Navigate to="/procurement/requests" replace />} />
          <Route path="requests" element={<ProcurementRequestsPage />} />
          <Route path="rfqs" element={<ProcurementRFQsPage />} />
          <Route path="orders" element={<ProcurementOrdersPage />} />
          <Route path="receipts" element={<ProcurementReceiptsPage />} />
          <Route path="vendors" element={<ProcurementVendorsPage />} />
        </Route>
        {/* Keep old procurement routes for backward compatibility */}
        <Route path="procurement/purchase-requests" element={<Navigate to="/procurement/requests" replace />} />
        <Route path="procurement/purchase-orders" element={<Navigate to="/procurement/orders" replace />} />
        <Route path="procurement/goods-receipts" element={<Navigate to="/procurement/receipts" replace />} />
        <Route path="procurement/quotation-comparison" element={<QuotationComparisonPage />} />
        <Route path="procurement/vendor-scorecard" element={<VendorScorecardPage />} />
        <Route path="inventory" element={<Navigate to="/inventory/warehouses" />} />
        <Route path="inventory/warehouses" element={<WarehousesPage />} />
        <Route path="inventory/items" element={<InventoryPage />} />
        <Route path="inventory/transactions" element={<StockTransactionsPage />} />

        {/* Equipment */}
        <Route path="equipment" element={<EquipmentPageNew />} />

        {/* Budgets (Phase 2) */}
        <Route path="budgets" element={<ProjectBudgetsPage />} />

        {/* Rent Collection extended */}
        <Route path="rent-collection/schedules" element={<RentSchedulesPage />} />

        {/* Finance extended */}
        {/* Calendar */}
        <Route path="calendar" element={<CalendarPage />} />

        {/* Legal */}
        <Route path="legal/notices" element={<LegalNoticesPage />} />
        <Route path="legal/cases" element={<LegalCasesPage />} />

        {/* Properties extended */}
        <Route path="properties/buildings" element={<BuildingsPage />} />

        {/* Projects extended */}
        <Route path="projects/tasks" element={<ProjectTasksPage />} />
        <Route path="projects/conversion" element={<ProjectConversionPage />} />

        {/* Construction extended */}
        <Route path="construction/change-orders" element={<ChangeOrdersPage />} />
        <Route path="construction/risk-register" element={<RiskRegisterPage />} />

        {/* System */}
        <Route path="system/audit-log" element={<AuditLogPage />} />

        {/* Merged mega-pages (standalone routes, no conflicts) */}
        {/* ── LEASING MODULE — separate pages (no sub-nav) ── */}
        <Route path="leasing" element={<Navigate to="/leasing/properties" replace />} />
        <Route path="leasing/properties" element={<LeasingPropertiesPage />} />
        <Route path="leasing/units" element={<LeasingUnitsPage />} />
        <Route path="leasing/tenants" element={<LeasingTenantsPage />} />
        <Route path="leasing/leases" element={<LeasingLeasesPage />} />
        <Route path="leasing/collections" element={<LeasingCollectionsPage />} />

        {/* ── CONSTRUCTION MODULE — sub-navigation ── */}
        <Route path="construction-all" element={<ModuleLayout subNav={[
          { title: 'المشاريع', href: '/construction-all/projects' },
          { title: 'المقاولون', href: '/construction-all/contractors' },
          { title: 'المطالبات', href: '/construction-all/claims' },
          { title: 'التقدم', href: '/construction-all/progress' },
          { title: 'التقارير', href: '/construction-all/reports' },
        ]} />}>
          <Route index element={<Navigate to="/construction-all/projects" replace />} />
          <Route path="projects" element={<ConstructionProjectsPage />} />
          <Route path="contractors" element={<ConstructionContractorsPage />} />
          <Route path="claims" element={<ContractorClaimsPage />} />
          <Route path="progress" element={<ProgressUpdatesPage />} />
          <Route path="reports" element={<DailyReportsPage />} />
        </Route>

        {/* Redirect old merged-page paths */}
        <Route path="properties-units" element={<Navigate to="/leasing/properties" replace />} />
        <Route path="tenants-leases" element={<Navigate to="/leasing/tenants" replace />} />
        <Route path="collections" element={<Navigate to="/leasing/collections" replace />} />
        <Route path="my-work" element={<MyWorkPage />} />
        <Route path="queues" element={<QueuesMergedPage />} />

        {/* HR — sub-navigation */}
        <Route path="hr" element={<ModuleLayout subNav={[
          { title: 'الموظفون', href: '/hr/employees' },
          { title: 'الحضور', href: '/hr/attendance' },
          { title: 'الرواتب', href: '/hr/payroll' },
          { title: 'الإجازات', href: '/hr/leaves' },
        ]} />}>
          <Route index element={<Navigate to="/hr/employees" replace />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="leaves" element={<LeaveManagementPage />} />
        </Route>

        {/* Settings extended */}
        <Route path="settings/numbering" element={<NumberingSettingsPage />} />
      </Route>
    </Routes>
  );
}
