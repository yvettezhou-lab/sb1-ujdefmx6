import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { QuickEntry } from '@/pages/QuickEntry';
import { Transactions } from '@/pages/Transactions';
import { Settings } from '@/pages/Settings';
import { EditTransaction } from '@/pages/EditTransaction';
import { Transfer } from '@/pages/Transfer';
import { TransferDetail } from '@/pages/TransferDetail';
import { Reflection } from '@/pages/Reflection';

export const router = createBrowserRouter([
  { path: '/quick-entry', element: <QuickEntry /> },
  { path: '/transactions/:id/edit', element: <EditTransaction /> },
  { path: '/transfer', element: <Transfer /> },
  { path: '/transfer/:id', element: <TransferDetail /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/reflection', element: <Reflection /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);
