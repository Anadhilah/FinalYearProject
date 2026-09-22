import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAppUpdate } from "@/hooks/useAppUpdate";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import ChangePassword from "./pages/ChangePassword";

import StudentLayout from "./components/layouts/StudentLayout";
import StudentOnboarding from "./pages/student/Onboarding";
import StudentOverview from "./pages/student/Overview";
import StudentProfile from "./pages/student/Profile";
import BrowseInternships from "./pages/student/BrowseInternships";
import InternshipDetails from "./pages/student/InternshipDetails";
import Apply from "./pages/student/Apply";
import MyApplications from "./pages/student/MyApplications";
import StudentMessages from "./pages/student/Messages";
import StudentLogbook from "./pages/student/Logbook";
import SharedLogbook from "./pages/student/SharedLogbook";

import RecruiterVerifyEmail from "./pages/recruiter/VerifyEmail";
import RecruiterOnboarding from "./pages/recruiter/Onboarding";
import PendingApproval from "./pages/recruiter/PendingApproval";
import RecruiterLayout from "./components/layouts/RecruiterLayout";
import RecruiterOverview from "./pages/recruiter/Overview";
import CompanyProfile from "./pages/recruiter/CompanyProfile";
import PostInternship from "./pages/recruiter/PostInternship";
import ManageInternships from "./pages/recruiter/ManageInternships";
import Applicants from "./pages/recruiter/Applicants";
import RecruiterMessages from "./pages/recruiter/Messages";
import StudentMeetings from "./pages/student/Meetings";
import RecruiterMeetings from "./pages/recruiter/Meetings";
import StudentLogbooks from "./pages/recruiter/StudentLogbooks";

import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageRecruiters from "./pages/admin/ManageRecruiters";
import AdminManageInternships from "./pages/admin/ManageInternships";
import CoordinatorRequests from "./pages/admin/CoordinatorRequests";
import FloatingChat from "./components/chat/FloatingChat";

import SupervisorLayout from "./components/layouts/SupervisorLayout";
import SupervisorOverview from "./pages/supervisor/Overview";
import SupervisorStudents from "./pages/supervisor/MyStudents";
import SupervisorStudentDetails from "./pages/supervisor/StudentDetails";
import SupervisorAssignTasks from "./pages/supervisor/AssignTasks";
import SupervisorLogbooks from "./pages/supervisor/LogbookReview";
import SupervisorMessages from "./pages/supervisor/Messages";
import SupervisorActivate from "./pages/supervisor/Activate";
import ManageSupervisors from "./pages/admin/ManageSupervisors";

import FacultyCoordinatorLayout from "./components/layouts/FacultyCoordinatorLayout";
import FacultyCoordinatorOverview from "./pages/faculty-coordinator/Overview";
import FacultyCoordinatorDepartments from "./pages/faculty-coordinator/Departments";
import FacultyCoordinatorReports from "./pages/faculty-coordinator/Reports";
import FacultyCoordinatorPlacements from "./pages/faculty-coordinator/Placements";
import FacultyCoordinatorMessages from "./pages/faculty-coordinator/Messages";
import FacultyCoordinatorStudents from "./pages/faculty-coordinator/Students";
import FacultyCoordinatorStudentDetails from "./pages/faculty-coordinator/StudentDetails";
import CoordinatorActivate from "./pages/coordinator/Activate";

import DepartmentCoordinatorLayout from "./components/layouts/DepartmentCoordinatorLayout";
import DepartmentCoordinatorOverview from "./pages/department-coordinator/Overview";
import DepartmentCoordinatorApplications from "./pages/department-coordinator/Applications";
import DepartmentCoordinatorStudents from "./pages/department-coordinator/Students";
import DepartmentCoordinatorOrganisations from "./pages/department-coordinator/Organisations";
import DepartmentCoordinatorReports from "./pages/department-coordinator/Reports";
import DepartmentCoordinatorPlacements from "./pages/department-coordinator/Placements";
import DepartmentCoordinatorFacultyCoordinators from "./pages/department-coordinator/FacultyCoordinators";
import DepartmentCoordinatorOnboarding from "./pages/department-coordinator/Onboarding";


const queryClient = new QueryClient();

function App() {
  useAppUpdate();

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <AuthProvider>
            <MessagesProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recruiter/verify-email" element={<RecruiterVerifyEmail />} />
            <Route path="/recruiter/onboarding" element={<RecruiterOnboarding />} />
            <Route path="/recruiter/pending" element={<PendingApproval />} />
            <Route path="/install" element={<Install />} />
            <Route path="/change-password" element={<ProtectedRoute allowedRoles={["student", "recruiter", "admin", "supervisor", "faculty-coordinator", "department-coordinator"]}><ChangePassword /></ProtectedRoute>} />
            <Route path="/logbook/share/:token" element={<SharedLogbook />} />
            <Route path="/supervisor/activate/:token" element={<SupervisorActivate />} />
            <Route path="/coordinator/activate/:token" element={<CoordinatorActivate />} />

            {/* Student Routes */}
            <Route path="/student/onboarding" element={<ProtectedRoute allowedRoles={["student"]}><StudentOnboarding /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentLayout /></ProtectedRoute>}>
              <Route index element={<StudentOverview />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="internships" element={<BrowseInternships />} />
              <Route path="internships/:id" element={<InternshipDetails />} />
              <Route path="internships/:id/apply" element={<Apply />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="messages" element={<StudentMessages />} />
              <Route path="meetings" element={<StudentMeetings />} />
              <Route path="logbook" element={<StudentLogbook />} />
            </Route>

            {/* Recruiter Routes */}
            <Route path="/recruiter" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterLayout /></ProtectedRoute>}>
              <Route index element={<RecruiterOverview />} />
              <Route path="profile" element={<CompanyProfile />} />
              <Route path="post" element={<PostInternship />} />
              <Route path="manage" element={<ManageInternships />} />
              <Route path="applicants" element={<Applicants />} />
              <Route path="messages" element={<RecruiterMessages />} />
              <Route path="meetings" element={<RecruiterMeetings />} />
              <Route path="logbooks" element={<StudentLogbooks />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="recruiters" element={<ManageRecruiters />} />
              <Route path="supervisors" element={<ManageSupervisors />} />
              <Route path="internships" element={<AdminManageInternships />} />
              <Route path="coordinator-requests" element={<CoordinatorRequests />} />
            </Route>

            {/* Supervisor Routes */}
            <Route path="/supervisor" element={<ProtectedRoute allowedRoles={["supervisor"]}><SupervisorLayout /></ProtectedRoute>}>
              <Route index element={<SupervisorOverview />} />
              <Route path="students" element={<SupervisorStudents />} />
              <Route path="students/:studentId" element={<SupervisorStudentDetails />} />
              <Route path="students/:studentId/tasks" element={<SupervisorAssignTasks />} />
              <Route path="logbooks" element={<SupervisorLogbooks />} />
              <Route path="messages" element={<SupervisorMessages />} />
            </Route>

            {/* Faculty Coordinator Routes */}
            <Route path="/faculty-coordinator" element={<ProtectedRoute allowedRoles={["faculty-coordinator"]}><FacultyCoordinatorLayout /></ProtectedRoute>}>
              <Route index element={<FacultyCoordinatorOverview />} />
              <Route path="departments" element={<FacultyCoordinatorDepartments />} />
              <Route path="reports" element={<FacultyCoordinatorReports />} />
              <Route path="messages" element={<FacultyCoordinatorMessages />} />
              <Route path="students" element={<FacultyCoordinatorStudents />} />
              <Route path="students/:studentId" element={<FacultyCoordinatorStudentDetails />} />
              <Route path="placements" element={<FacultyCoordinatorPlacements />} />
            </Route>

            {/* Department Coordinator Routes */}
            <Route path="/department-coordinator/onboarding" element={<ProtectedRoute allowedRoles={["department-coordinator"]}><DepartmentCoordinatorOnboarding /></ProtectedRoute>} />
            <Route path="/department-coordinator" element={<ProtectedRoute allowedRoles={["department-coordinator"]}><DepartmentCoordinatorLayout /></ProtectedRoute>}>
              <Route index element={<DepartmentCoordinatorOverview />} />
              <Route path="internship-approval" element={<DepartmentCoordinatorApplications />} />
              <Route path="students" element={<DepartmentCoordinatorStudents />} />
              <Route path="faculty-coordinators" element={<DepartmentCoordinatorFacultyCoordinators />} />
              <Route path="organisations" element={<DepartmentCoordinatorOrganisations />} />
              <Route path="reports" element={<DepartmentCoordinatorReports />} />
              <Route path="placements" element={<DepartmentCoordinatorPlacements />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingChat />
          </MessagesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
