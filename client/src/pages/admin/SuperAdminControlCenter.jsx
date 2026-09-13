import React, { useState, useEffect, useCallback } from 'react';
import { Key, Plus, RefreshCw } from 'lucide-react';

import api from '../../services/api';
import PasswordResetModal from '../../components/superadmin/PasswordResetModal';
import RegisterRestaurantModal from '../../components/superadmin/RegisterRestaurantModal';
import EditCredentialsModal from '../../components/superadmin/EditCredentialsModal';
import AdminMasterControlView from '../../components/superadmin/AdminMasterControlView';
import TenantWorkspaceView from '../../components/superadmin/TenantWorkspaceView';

export default function SuperAdminControlCenter() {
  const [treeData, setTreeData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation & Control Mode State
  const [activeTab, setActiveTab] = useState('global-dashboard');
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [controlData, setControlData] = useState(null);
  const [controlLoading, setControlLoading] = useState(false);

  // Modal States
  const [resetModalRestaurant, setResetModalRestaurant] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editCredentialsTarget, setEditCredentialsTarget] = useState(null);
  const [editCredentialsType, setEditCredentialsType] = useState('owner');


  // ── Fetch Platform Data ──────────────────────────────────────────────────────
  const fetchPlatformData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, treeRes] = await Promise.all([
        api.get('/platform/dashboard'),
        api.get('/platform/tree')
      ]);
      if (dashRes.data.success) setStats(dashRes.data.stats);
      if (treeRes.data.success) setTreeData(treeRes.data.tree);
    } catch (err) {
      console.error('Error fetching platform data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  // ── Log Admin Click Events ───────────────────────────────────────────────────
  const logAdminAction = async (action, page, entity, entityId, restaurantId) => {
    try {
      await api.post('/platform/click-log', { action, page, entity, entityId, restaurantId });
    } catch (e) { /* silent */ }
  };

  // ── Enter Control Mode ───────────────────────────────────────────────────────
  const handleEnterControlMode = async (restaurant, targetSubTab = 'dashboard') => {
    setActiveRestaurant(restaurant);
    setActiveTab(targetSubTab);
    setControlLoading(true);
    logAdminAction(`ENTER_CONTROL_MODE`, targetSubTab, 'Restaurant', restaurant._id, restaurant._id);
    try {
      const res = await api.get(`/platform/restaurants/${restaurant._id}/control-data`);
      if (res.data.success) setControlData(res.data);
    } catch (err) {
      console.error('Error loading restaurant workspace:', err);
    } finally {
      setControlLoading(false);
    }
  };

  const handleExitControlMode = () => {
    logAdminAction('EXIT_CONTROL_MODE', 'global-dashboard', 'Restaurant', activeRestaurant?._id);
    setActiveRestaurant(null);
    setControlData(null);
    setActiveTab('global-dashboard');
  };

  // ── Status & Plan Updates ────────────────────────────────────────────────────
  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      const res = await api.patch(`/platform/restaurants/${restaurantId}/status`, { status: newStatus });
      if (res.data.success) {
        await fetchPlatformData();
        if (activeRestaurant && activeRestaurant._id === restaurantId) {
          setActiveRestaurant(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handlePlanChange = async (restaurantId, newPlan, newSubStatus) => {
    try {
      const payload = {};
      if (newPlan) payload.plan = newPlan;
      if (newSubStatus) payload.subscriptionStatus = newSubStatus;
      const res = await api.patch(`/platform/restaurants/${restaurantId}/plan`, payload);
      if (res.data.success) {
        await fetchPlatformData();
        if (activeRestaurant && activeRestaurant._id === restaurantId) {
          setActiveRestaurant(prev => ({ ...prev, plan: newPlan || prev.plan }));
        }
      }
    } catch (err) {
      alert(err.message || 'Plan update failed');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col">

      <div className="flex-1 overflow-hidden flex flex-col">

        {activeRestaurant ? (
          /* ── TENANT WORKSPACE VIEW ── */
          controlLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold animate-pulse">Loading {activeRestaurant.name} workspace…</p>
            </div>
          ) : controlData ? (
            <TenantWorkspaceView
              controlData={controlData}
              activeRestaurant={activeRestaurant}
              onBack={handleExitControlMode}
              onEditCredentials={(targetObj, type) => {
                setEditCredentialsTarget(targetObj);
                setEditCredentialsType(type || 'owner');
              }}
              onResetPassword={(rest) => setResetModalRestaurant(rest)}
              onStatusChange={handleStatusChange}
              onPlanChange={handlePlanChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <p className="text-sm font-bold">Could not load workspace data.</p>
              <button
                onClick={() => handleEnterControlMode(activeRestaurant, 'dashboard')}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                Retry
              </button>
            </div>
          )
        ) : (
          /* ── GLOBAL ADMIN MASTER CONTROL ── */
          <AdminMasterControlView
            treeData={treeData}
            stats={stats}
            loading={loading}
            onRefresh={fetchPlatformData}
            onRegister={() => setIsRegisterModalOpen(true)}
            onEnterControlMode={handleEnterControlMode}
            onEditCredentials={(targetObj, type) => {
              setEditCredentialsTarget(targetObj);
              setEditCredentialsType(type || 'owner');
            }}
            onResetPassword={(rest) => setResetModalRestaurant(rest)}
          />
        )}
      </div>

      {/* ── MODALS ── */}
      {resetModalRestaurant && (
        <PasswordResetModal
          restaurant={resetModalRestaurant}
          onClose={() => setResetModalRestaurant(null)}
        />
      )}

      <RegisterRestaurantModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => fetchPlatformData()}
      />

      <EditCredentialsModal
        isOpen={!!editCredentialsTarget}
        target={editCredentialsTarget}
        type={editCredentialsType}
        onClose={() => setEditCredentialsTarget(null)}
        onSuccess={() => {
          fetchPlatformData();
          if (activeRestaurant) handleEnterControlMode(activeRestaurant, activeTab);
        }}
      />
    </div>
  );
}
