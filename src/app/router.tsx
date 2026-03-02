import * as React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// IMPORTAÇÕES DIRETAS (Sem esconder erros)
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import LandingPage from "@/pages/LandingPage";
import JourneyPage from "@/pages/JourneyPage";
import DashboardPage from "@/pages/DashboardPage";
import RobotDetailPage from "@/pages/RobotDetailPage";
import RobotChatPage from "@/pages/RobotChatPage";
import CompetitionPage from "@/pages/CompetitionPage";
import ProjectsPage from "@/pages/ProjectsPage";
import MaterialsPage from "@/pages/MaterialsPage";
import VideoPage from "@/pages/VideoPage";
import AuthorityAgentsPage from "@/pages/AuthorityAgentsPage";
import AuthorityAgentRunPage from "@/pages/AuthorityAgentRunPage";
import AuthorityAgentChatPage from "@/pages/AuthorityAgentChatPage";
import AuthorityNucleusPage from "@/pages/AuthorityNucleusPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AccountPage from "@/pages/AccountPage";
import LinkedInCallbackPage from "@/pages/LinkedInCallbackPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  
  // Rota do Callback do LinkedIn
  { path: "/api/linkedin/callback", element: <LinkedInCallbackPage /> },

  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <LandingPage /> },

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