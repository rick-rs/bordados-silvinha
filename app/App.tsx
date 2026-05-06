import { BrowserRouter } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_URL is required');
}

function App() {
  return (
    <BrowserRouter>
      <div data-api-base-url={apiBaseUrl}>App Content</div>
    </BrowserRouter>
  );
}

export default App;