import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApprovalBanner from '../common/ApprovalBanner';

const ApprovedBusinessRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'BUSINESS') {
    return <Navigate to="/login" replace />;
  }

  // Feature 2: business task publishing requires an APPROVED business account.
  if (user.approvalStatus !== 'APPROVED') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <ApprovalBanner status={user.approvalStatus} className="text-left" />
        <div className="p-5 mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600">
          This area is reserved for approved business accounts. Your request has been
          noted and a TaskHub admin will review your company shortly.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApprovedBusinessRoute;