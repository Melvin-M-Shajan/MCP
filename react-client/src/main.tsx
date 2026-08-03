import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function loadApplication(): Promise<ComponentType> {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const { ProductDemo } = await import('./components/product-demo')
    return ProductDemo
  }

  const { default: App } = await import('./App')
  return App
}

const Application = await loadApplication()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Application />
  </StrictMode>,
)
