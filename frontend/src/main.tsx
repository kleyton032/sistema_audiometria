import React from 'react'
import ReactDOM from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import App from './App'
import './index.css'

dayjs.locale('pt-br')
dayjs.extend(customParseFormat)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
