import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import './index.css'
import App from './App.tsx'

// Mount the React application into the #root element declared in index.html.
createRoot(document.getElementById('root')!).render(
  // StrictMode highlights unsafe React patterns during local development.
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
