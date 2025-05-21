
import { Outlet } from 'react-router-dom';
import { AppLayout } from "@/components/layout/app-layout";

const DashboardLayout = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default DashboardLayout;
