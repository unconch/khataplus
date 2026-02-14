

// Auth functions
export { isGuestMode, getCurrentUser, getCurrentOrgId } from "./data/auth";

// Inventory functions
export { getInventory, addInventoryItem, updateInventoryStock, getLowStockItems } from "./data/inventory";

// Sales functions
export { getSales, recordSale, recordBatchSales, processReturn, updateSale, getSalesByDate } from "./data/sales";

// Profile functions
export { getProfiles, getPendingApprovalsCount, upsertProfile, getProfile, ensureProfile, updateProfileBiometricStatus, updateUserStatus, updateUserRole } from "./data/profiles";

// Analytics functions
export { getDailyPulse, getExecutiveAnalytics } from "./data/analytics";

// Report functions
export { getDailyReports, addDailyReport, deleteDailyReport, syncDailyReport } from "./data/reports";

// Customer/Khata functions
export { getCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer, getKhataTransactions, addKhataTransaction, getCustomerBalance } from "./data/customers";

// Organization functions
export {
    createOrganization,
    getUserOrganizations,
    updateOrganization,
    getOrganizationBySlug,
    getOrganization,
    getOrganizationMembers,
    createInvite,
    getInviteByToken,
    acceptInvite,
    updateMemberRole,
    removeMember,
    getSystemSettings,
    updateSystemSettings
} from "./data/organizations";

// Supplier functions
export { getSuppliers, getSupplier, addSupplier, getSupplierTransactions, addSupplierTransaction, getSupplierBalance } from "./data/suppliers";

// Expense functions
export { getExpenseCategories, addExpenseCategory, getExpenses, addExpense, deleteExpense } from "./data/expenses";

// Audit functions
export { createAuditLog, getAuditLogs } from "./data/audit";

// Types
export type * from "./types";
