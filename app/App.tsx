import { BrowserRouter } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function App() {
  return (
    <BrowserRouter>
      <div data-api-base-url={apiBaseUrl}>App Content</div>
    </BrowserRouter>
  );
}

export default App;