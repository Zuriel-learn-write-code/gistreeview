import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/AuthPages/Login";
import Register from "./pages/AuthPages/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import OfficerDashboard from "./pages/Officer/OfficerDashboard";
import DataInputAdmin from "./pages/Admin/DataInputAdmin";
import DataUser from "./pages/Admin/DataUser";
import DataTree from "./pages/Admin/DataTree";
import DataRoad from "./pages/Admin/DataRoad";
// import DataReport from "./pages/View/DataReport";
import DataReport from "./pages/Admin/DataReport";
import EditProfile from "./pages/User/EditProfile";
import ViewProfile from "./pages/View/ViewProfile";
import ViewTree from "./pages/View/Viewtree";
import ViewRoad from "./pages/View/ViewRoad";
import ViewReport from "./pages/View/Viewreport";
import UserMapPage from "./pages/User/UserMap";

import ExampleComponent from "./pages/ExampleComponent";
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* NotFound route di luar AppLayout agar fullscreen */}
        <Route path="/404" element={<NotFound />} />

        <Route element={<AppLayout />}>
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/datainput" element={<DataInputAdmin />} />
            <Route path="/admin/datauser" element={<DataUser />} />
            <Route path="/admin/datatree" element={<DataTree />} />
            <Route path="/admin/dataroad" element={<DataRoad />} />
            {/* <Route path="/admin/datareport" element={<AdminDataReport />} /> */}
          {/* Main Report Route - all roles */}
          <Route path="/report" element={<DataReport />} />
          </Route>

          {/* Officer Routes */}
          <Route element={<ProtectedRoute allowedRoles={["officer"]} />}>
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          </Route>

          {/* User Routes */}

          <Route
            element={
              <ProtectedRoute allowedRoles={["user", "admin", "officer"]} />
            }
          >
            <Route path="/user/editprofile" element={<EditProfile />} />
            <Route path="/user/map" element={<UserMapPage />} />
            <Route path="/user/example" element={<ExampleComponent />} />
          </Route>

          {/* Common Routes (accessible by all authenticated users) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["user", "admin", "officer"]} />
            }
          >
            
            
            {/* <Route path="/view/datareport" element={<DataReport />} /> */}
            <Route path="/view/profile/:id" element={<ViewProfile />} />
            <Route path="/view/tree/:id" element={<ViewTree />} />
            <Route path="/view/road/:id" element={<ViewRoad />} />
            <Route path="/view/report/:id" element={<ViewReport />} />
          </Route>
        </Route>
        {/* Redirect semua route tak dikenal ke /404 agar fullscreen */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
