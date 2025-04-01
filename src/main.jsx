import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { QueryClient, QueryClientProvider } from 'react-query';
// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(

<QueryClientProvider client={queryClient}>
    <App />
</QueryClientProvider>
);
