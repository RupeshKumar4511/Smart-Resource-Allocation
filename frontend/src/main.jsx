import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import App from './App';
import './index.css';

const toastConfig = {
  style: { 
    background: '#1e293b', 
    color: '#f8fafc', 
    border: '1px solid #334155' 
  }
};
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster position="top-right" toastOptions={toastConfig}/>
    </Provider>
  </StrictMode>
);
