import * as React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import { withSuspense } from "@/app/Lazy";

const LandingPage = withSuspense(
  React.lazy(() => import("@/pages/LandingPage"))
);
const JourneyPage = withSuspense(
  React.lazy(() => import("@/pages/JourneyPage"))
);
const DashboardPage = withSuspense(
  React.lazy(() => import("@/pages/DashboardPage"))
);
const RobotDetailPage = withSuspense(
  React.lazy(() => import("@/pages/RobotDetailPage"))
);
const RobotChatPage = withSuspense(
  React.lazy(() => import("@/pages/RobotChatPage"))
);

const CompetitionPage = withSuspense(
  React.lazy(() => import("@/pages/CompetitionPage"))
);
const ProjectsPage = withSuspense(
  React.lazy(() => import("@/pages/ProjectsPage"))
);
const MaterialsPage = withSuspense(
  React.lazy(() => import("@/pages/MaterialsPage"))
);
const VideoPage = withSuspense(
  React.lazy(() => import("@/pages/VideoPage"))
);


const AuthorityAgentsPage = withSuspense(
  React.lazy(() => import("@/pages/AuthorityAgentsPage"))
);
const AuthorityAgentRunPage = withSuspense(
  React.lazy(() => import("@/pages/AuthorityAgentRunPage"))
);
const AuthorityAgentChatPage = withSuspense(
  React.lazy(() => import("@/pages/AuthorityAgentChatPage"))
);

const AuthorityNucleusPage = withSuspense(
  React.lazy(() => import("@/pages/AuthorityNucleusPage"))
);

const NotFoundPage = withSuspense(
  React.lazy(() => import("@/pages/NotFoundPage"))
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "journey", element: <JourneyPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "robots/:publicId", element: <RobotDetailPage /> },
      { path: "robots/:publicId/chat", element: <RobotChatPage /> },

      { path: "competition", element: <CompetitionPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "materials", element: <MaterialsPage /> },
      { path: "video", element: <VideoPage /> },


      { path: "authority-agents", element: <AuthorityAgentsPage /> },
      { path: "authority-agents/nucleus", element: <AuthorityNucleusPage /> }, // <-- NOVA ROTA AQUI
      { path: "authority-agents/chat/:agentKey", element: <AuthorityAgentChatPage /> },
      { path: "authority-agents/run/:agentKey", element: <AuthorityAgentRunPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
