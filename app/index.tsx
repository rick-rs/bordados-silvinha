import { applyPreferences, cachedPreferences } from './src/services/accessibility';
import { getSession } from './src/services/auth';
import ReactDOM from 'react-dom/client';
import App from './App';

applyPreferences(cachedPreferences(getSession()?.id));
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);