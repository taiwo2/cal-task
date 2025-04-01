import React from 'react';
import FormulaInput from './components/FormulaInput';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-6">
        <FormulaInput />
      </div>
    </div>
  );
}

export default App;