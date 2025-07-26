
import { useAuth } from '@/lib/auth';
import AdminCashDrawer from '@/components/admin-cash-drawer';
import HouseBankManager from '@/components/house-bank-manager';

export default function FinancialManagement() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          $ Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage cash flow, deposits, and operational budget.
        </p>
      </div>

      {/* Admin Cash Drawer Management */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Cash Drawer Management</h2>
        <AdminCashDrawer />
      </div>

      {/* HouseBank Management */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">HouseBank - Operational Budget</h2>
        <HouseBankManager />
      </div>
    </div>
  );
}
