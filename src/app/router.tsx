import * as React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import { withSuspense } from "@/app/Lazy";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

const LoginPage = withSuspense(React.lazy(() => import("@/pages/LoginPage")));
const RegisterPage = withSuspense(React.lazy(() => import("@/pages/RegisterPage")));
const LandingPage = withSuspense(React.lazy(() => import("@/pages/LandingPage")));
const JourneyPage = withSuspense(React.lazy(() => import("@/pages/JourneyPage")));
const DashboardPage = withSuspense(React.lazy(() => import("@/pages/DashboardPage")));
const RobotDetailPage = withSuspense(React.lazy(() => import("@/pages/RobotDetailPage")));
const RobotChatPage = withSuspense(React.lazy(() => import("@/pages/RobotChatPage")));
const CompetitionPage = withSuspense(React.lazy(() => import("@/pages/CompetitionPage")));
const ProjectsPage = withSuspense(React.lazy(() => import("@/pages/ProjectsPage")));
const MaterialsPage = withSuspense(React.lazy(() => import("@/pages/MaterialsPage")));
const VideoPage = withSuspense(React.lazy(() => import("@/pages/VideoPage")));
const AuthorityAgentsPage = withSuspense(React.lazy(() => import("@/pages/AuthorityAgentsPage")));
const AuthorityAgentRunPage = withSuspense(React.lazy(() => import("@/pages/AuthorityAgentRunPage")));
const AuthorityAgentChatPage = withSuspense(React.lazy(() => import("@/pages/AuthorityAgentChatPage")));
const AuthorityNucleusPage = withSuspense(React.lazy(() => import("@/pages/AuthorityNucleusPage")));
const NotFoundPage = withSuspense(React.lazy(() => import("@/pages/NotFoundPage")));
const AccountPage = withSuspense(React.lazy(() => import("@/pages/AccountPage")));

// NOVO: Importação da página de callback do LinkedIn
const LinkedInCallbackPage = withSuspense(React.lazy(() => import("@/pages/LinkedInCallbackPage")));

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  
  // NOVO: Rota do Callback fora do AppShell para não mostrar menu lateral enquanto carrega
  { path: "/api/linkedin/callback", element: <LinkedInCallbackPage /> },

  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // 🟢 ROTA LIVRE (Qualquer um acessa)
      { index: true, element: <LandingPage /> },

      // 🔴 ROTAS PROTEGIDAS (O Guardião bloqueia se não tiver token)
      {
        element: <ProtectedRoute />, 
        children: [
          { path: "journey", element: <JourneyPage /> }, 
          { path: "dashboard", element: <DashboardPage /> },
          { path: "conta", element: <AccountPage /> }, 
          { path: "robots/:publicId", element: <RobotDetailPage /> },
          { path: "robots/:publicId/chat", element: <RobotChatPage /> },
          { path: "competition", element: <CompetitionPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "materials", element: <MaterialsPage /> },
          { path: "video", element: <VideoPage /> },
          { path: "authority-agents", element: <AuthorityAgentsPage /> },
          { path: "authority-agents/nucleus", element: <AuthorityNucleusPage /> },
          { path: "authority-agents/chat/:agentKey", element: <AuthorityAgentChatPage /> },
          { path: "authority-agents/run/:agentKey", element: <AuthorityAgentRunPage /> },
        ]
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);