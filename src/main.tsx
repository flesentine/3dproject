import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { HistoryScenarioPanelPortal } from './history/HistoryScenarioPanelPortal'
import { ProjectMiniMapPortal } from './orientation/ProjectMiniMapPortal'
import './styles.css'
import './scenario.css'
import './directManipulation.css'
import './navigation.css'
import './hierarchy.css'
import './twin.css'
import './orientation.css'
import './history.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Missing #root application mount')
}

createRoot(root).render(
  <StrictMode>
    <App />
    <ProjectMiniMapPortal />
    <HistoryScenarioPanelPortal />
  </StrictMode>,
)
