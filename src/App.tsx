import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthContext';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Module pages
import LandListPage from '@/pages/lands/LandListPage';
import LandCreatePage from '@/pages/lands/LandCreatePage';

import ProjectListPage from '@/pages/projects/ProjectListPage';
import ProjectCreatePage from '@/pages/projects/ProjectCreatePage';
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage';

import ContractorListPage from '@/pages/contractors/ContractorListPage';
import ContractorCreatePage from '@/pages/contractors/ContractorCreatePage';
import ContractorDetailPage from '@/pages/contractors/ContractorDetailPage';

import PropertyListPage from '@/pages/properties/PropertyListPage';
import PropertyCreatePage from '@/pages/properties/PropertyCreatePage';
import PropertyDetailPage from '@/pages/properties/PropertyDetailPage';

import UnitListPage from '@/pages/units/UnitListPage';
import UnitCreatePage from '@/pages/units/UnitCreatePage';
import UnitDetailPage from '@/pages/units/UnitDetailPage';

import TenantListPage from '@/pages/tenants/TenantListPage';
import TenantCreatePage from '@/pages/tenants/TenantCreatePage';
import TenantDetailPage from '@/pages/tenants/TenantDetailPage';

import LeaseListPage from '@/pages/leases/LeaseListPage';
import LeaseCreatePage from '@/pages/leases/LeaseCreatePage';
import LeaseDetailPage from '@/pages/leases/LeaseDetailPage';
import ContractRenewalPage from '@/pages/leases/ContractRenewalPage';
import ContractTerminationPage from '@/pages/leases/ContractTerminationPage';
import LeasingPipelinePage from '@/pages/leases/LeasingPipelinePage';

import RentInvoicesPage from '@/pages/rent-collection/RentInvoicesPage';
import RentInvoiceCreatePage from '@/pages/rent-collection/RentInvoiceCreatePage';
import RentReceiptsPage from '@/pages/rent-collection/RentReceiptsPage';

import MaintenanceRequestListPage from '@/pages/maintenance/MaintenanceRequestListPage';
import MaintenanceRequestDetailPage from '@/pages/maintenance/MaintenanceRequestDetailPage';

import FinanceAccountsPage from '@/pages/finance/FinanceAccountsPage';
import FinanceJournalEntriesPage from '@/pages/finance/FinanceJournalEntriesPage';
import PeriodClosingPage from '@/pages/finance/PeriodClosingPage';
import ThreeWayMatchPage from '@/pages/finance/ThreeWayMatchPage';

import SettingsPage from '@/pages/settings/SettingsPage';
import RolesPage from '@/pages/settings/RolesPage';
import UsersPage from '@/pages/users/UsersPage';
import DocumentsPage from '@/pages/documents/DocumentsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
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
import DailyReportsPage from '@/pages/construction/DailyReportsPage';
import ProgressUpdatesPage from '@/pages/construction/ProgressUpdatesPage';
import WarehousesPage from '@/pages/inventory/WarehousesPage';
import InventoryItemsPage from '@/pages/inventory/InventoryItemsPage';
import StockTransactionsPage from '@/pages/inventory/StockTransactionsPage';
import ProjectBudgetsPage from '@/pages/budgets/ProjectBudgetsPage';
import QuotationComparisonPage from '@/pages/procurement/QuotationComparisonPage';
import VendorScorecardPage from '@/pages/procurement/VendorScorecardPage';

// Phase 3 pages
import EmployeesPage from '@/pages/hr/EmployeesPage';
import AttendancePage from '@/pages/hr/AttendancePage';
import PayrollPage from '@/pages/hr/PayrollPage';
import LeaveManagementPage from '@/pages/hr/LeaveManagementPage';
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
import PurchaseRequestsPage from '@/pages/procurement/PurchaseRequestsPage';
import PurchaseOrdersPage from '@/pages/procurement/PurchaseOrdersPage';
import GoodsReceiptsPage from '@/pages/procurement/GoodsReceiptsPage';
import RentSchedulesPage from '@/pages/rent-collection/RentSchedulesPage';
import ChequesPage from '@/pages/finance/ChequesPage';
import FinanceDashboardPage from '@/pages/finance/FinanceDashboardPage';
import PropertyValuationPage from '@/pages/finance/PropertyValuationPage';
import CalendarPage from '@/pages/calendar/CalendarPage';
import CashFlowForecastPage from '@/pages/finance/CashFlowForecastPage';
import WorkOrdersPage from '@/pages/maintenance/WorkOrdersPage';
import PreventiveMaintenancePage from '@/pages/maintenance/PreventiveMaintenancePage';
import LegalCasesPage from '@/pages/legal/LegalCasesPage';
import AuditLogPage from '@/pages/system/AuditLogPage';
import ProjectConversionPage from '@/pages/projects/ProjectConversionPage';
import BuildingsPage from '@/pages/properties/BuildingsPage';
import EquipmentPage from '@/pages/equipment/EquipmentPage';
import LegalNoticesPage from '@/pages/legal/LegalNoticesPage';

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

        {/* Maintenance */}
        <Route path="maintenance" element={<Navigate to="/maintenance/requests" />} />
        <Route path="maintenance/requests" element={<MaintenanceRequestListPage />} />
        <Route path="maintenance/requests/:id" element={<MaintenanceRequestDetailPage />} />

        {/* Finance */}
        <Route path="finance" element={<FinanceAccountsPage />} />
        <Route path="finance/accounts" element={<FinanceAccountsPage />} />
        <Route path="finance/journal-entries" element={<FinanceJournalEntriesPage />} />
        <Route path="finance/period-closing" element={<PeriodClosingPage />} />
        <Route path="finance/three-way-match" element={<ThreeWayMatchPage />} />

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

        {/* Procurement & Inventory (Phase 2) */}
        <Route path="procurement/vendors" element={<VendorsPage />} />
        <Route path="procurement/purchase-requests" element={<PurchaseRequestsPage />} />
        <Route path="procurement/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="procurement/goods-receipts" element={<GoodsReceiptsPage />} />
        <Route path="procurement/quotation-comparison" element={<QuotationComparisonPage />} />
        <Route path="procurement/vendor-scorecard" element={<VendorScorecardPage />} />
        <Route path="inventory" element={<Navigate to="/inventory/warehouses" />} />
        <Route path="inventory/warehouses" element={<WarehousesPage />} />
        <Route path="inventory/items" element={<InventoryItemsPage />} />
        <Route path="inventory/transactions" element={<StockTransactionsPage />} />

        {/* Equipment */}
        <Route path="equipment" element={<EquipmentPage />} />

        {/* Budgets (Phase 2) */}
        <Route path="budgets" element={<ProjectBudgetsPage />} />

        {/* Rent Collection extended */}
        <Route path="rent-collection/schedules" element={<RentSchedulesPage />} />

        {/* Finance extended */}
        <Route path="finance/dashboard" element={<FinanceDashboardPage />} />
        <Route path="finance/valuation" element={<PropertyValuationPage />} />
        <Route path="finance/cash-flow-forecast" element={<CashFlowForecastPage />} />
        <Route path="finance/cost-centers" element={<CostCentersPage />} />
        <Route path="finance/bank-accounts" element={<BankAccountsPage />} />
        <Route path="finance/cheques" element={<ChequesPage />} />

        {/* Maintenance extended */}
        <Route path="maintenance/work-orders" element={<WorkOrdersPage />} />
        <Route path="maintenance/preventive" element={<PreventiveMaintenancePage />} />
        <Route path="maintenance/inspections" element={<InspectionsPage />} />
        <Route path="maintenance/assets" element={<AssetRegistryPage />} />
        <Route path="maintenance/inspection-builder" element={<InspectionBuilderPage />} />
        <Route path="maintenance/dashboard" element={<MaintenanceDashboardPage />} />

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

        {/* HR (Phase 3) */}
        <Route path="hr" element={<Navigate to="/hr/employees" />} />
        <Route path="hr/employees" element={<EmployeesPage />} />
        <Route path="hr/attendance" element={<AttendancePage />} />
        <Route path="hr/payroll" element={<PayrollPage />} />
        <Route path="hr/leaves" element={<LeaveManagementPage />} />

        {/* Settings extended */}
        <Route path="settings/numbering" element={<NumberingSettingsPage />} />
      </Route>
    </Routes>
  );
}
