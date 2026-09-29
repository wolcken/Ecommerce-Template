import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { storeConfig } from './config/store.config'
import './styles/globals.css'

document.documentElement.lang = storeConfig.locale.split('-')[0]
document.title = storeConfig.name
for (const [key, value] of Object.entries(storeConfig.theme)) {
  document.documentElement.style.setProperty(`--${key}`, value)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
