import DragDropFiles from "./components/DragDropFiles"
import './index.css';
import './styles.css'; 
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <>
    <div className="App">
      <DragDropFiles/>
      <Analytics/>
    </div>
    </>
  );
}

export default App;
