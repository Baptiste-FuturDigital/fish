import { lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { parseProjectorLocation } from "./projector/projector-route"
import "./index.css"

const ProjectorApp = lazy(() => import("./projector/projector-app").then((module) => ({
  default: module.ProjectorApp,
})))
const projectorRoute = parseProjectorLocation(window.location.pathname, window.location.search)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {projectorRoute.active ? (
      <Suspense fallback={null}>
        <ProjectorApp code={projectorRoute.code} />
      </Suspense>
    ) : <App />}
  </StrictMode>,
)
