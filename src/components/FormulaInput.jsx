import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from 'react-query';
import { create } from 'zustand';
import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: 'https://652f91320b8d8ddac0b2b62b.mockapi.io',
  timeout: 5000,
});

// Zustand store for variables
const useStore = create((set) => ({
  variables: {
    revenue: 1000,
    expenses: 500,
    users: 100,
  },
  setVariable: (name, value) =>
    set((state) => ({ variables: { ...state.variables, [name]: value } })),
}));

const FormulaInput = () => {
  const { variables, setVariable } = useStore();
  const [formula, setFormula] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTagIndex, setActiveTagIndex] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [formula]);

  // Fetch suggestions
  const { data: suggestions, isFetching } = useQuery(
    ['suggestions', inputValue],
    async () => {
      const response = await api.get('/autocomplete');
      return response.data.filter(item =>
        item.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        item.category.toLowerCase().includes(inputValue.toLowerCase())
      );
    },
    {
      enabled: inputValue.length > 0 && showSuggestions,
      staleTime: 300000
    }
  );

  const calculateFormula = () => {
    try {
      const expression = formula.map(item => {
        if (item.type === 'variable') return variables[item.id] || 0;
        if (item.type === 'number') return item.value;
        return item.value;
      }).join('');

      // eslint-disable-next-line no-eval
      return eval(expression);
    } catch {
      return 'Invalid formula';
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Show suggestions when typing
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    // Handle backspace properly
    if (e.key === 'Backspace') {
      if (inputValue === '' && formula.length > 0 && cursorPosition > 0) {
        const newFormula = [...formula];
        newFormula.splice(cursorPosition - 1, 1);
        setFormula(newFormula);
        setCursorPosition(cursorPosition - 1);
        e.preventDefault();
      }
      return;
    }
    
    // Handle arrow keys for navigation
    if (e.key === 'ArrowLeft') {
      setCursorPosition(Math.max(0, cursorPosition - 1));
      e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
      setCursorPosition(Math.min(formula.length, cursorPosition + 1));
      e.preventDefault();
    }
    
    // Handle enter to select suggestion
    if (e.key === 'Enter' && showSuggestions && suggestions?.length) {
      insertTag(suggestions[activeSuggestionIndex]);
      e.preventDefault();
    }
    
    // Handle up/down arrows for suggestion navigation
    if (e.key === 'ArrowUp' && showSuggestions) {
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' && showSuggestions) {
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
      e.preventDefault();
    }
    
    // Handle number input
    if (/[0-9]/.test(e.key) && !showSuggestions) {
      const newFormula = [...formula];
      newFormula.splice(cursorPosition, 0, {
        type: 'number',
        value: e.key
      });
      setFormula(newFormula);
      setCursorPosition(cursorPosition + 1);
      e.preventDefault();
    }
    
    // Handle symbol input
    if (['+', '-', '*', '/', '^', '(', ')'].includes(e.key) && !showSuggestions) {
      insertOperand(e.key);
      e.preventDefault();
    }
  };

  const insertTag = (tag) => {
    const newFormula = [...formula];
    newFormula.splice(cursorPosition, 0, {
      type: 'variable',
      id: tag.id,
      name: tag.name,
      value: tag.value || 0,
      category: tag.category
    });
    
    if (!variables[tag.id]) {
      setVariable(tag.id, tag.value || 0);
    }
    
    setFormula(newFormula);
    setCursorPosition(cursorPosition + 1);
    setShowSuggestions(false);
    setInputValue('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const insertOperand = (operand) => {
    const newFormula = [...formula];
    newFormula.splice(cursorPosition, 0, {
      type: 'operand',
      value: operand
    });
    
    setFormula(newFormula);
    setCursorPosition(cursorPosition + 1);
  };

  const handleTagClick = (index) => {
    setActiveTagIndex(index === activeTagIndex ? null : index);
    setCursorPosition(index + 1);
  };

  const updateVariable = (id, value) => {
    setVariable(id, Number(value));
    setActiveTagIndex(null);
    setFormula(prev => prev.map(item => 
      item.id === id ? { ...item, value: Number(value) } : item
    ));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Formula Editor
          </h1>
          
          <div className="relative mb-6">
            {/* Formula display area */}
            <div 
              className="min-h-[60px] flex flex-wrap items-center gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              {formula.map((item, index) => (
                <React.Fragment key={index}>
                  {item.type === 'variable' ? (
                    <Tag 
                      item={item}
                      isSelected={cursorPosition === index}
                      isActive={activeTagIndex === index}
                      onClick={() => handleTagClick(index)}
                      onUpdate={updateVariable}
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded ${cursorPosition === index ? 'bg-blue-100' : ''}`}>
                      {item.value}
                    </span>
                  )}
                </React.Fragment>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-[40px] outline-none bg-transparent text-gray-700"
                placeholder={formula.length === 0 ? "Type your formula..." : ""}
              />
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {isFetching ? (
                  <div className="px-4 py-3 text-gray-500">Loading suggestions...</div>
                ) : suggestions?.length ? (
                  suggestions.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center ${
                        index === activeSuggestionIndex ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => insertTag(item)}
                    >
                      <div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{item.category}</span>
                      </div>
                      <span className="text-sm text-gray-400">{item.value || '0'}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500">No suggestions found</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Result:</span>
              <span className="text-xl font-bold text-blue-600">
                {calculateFormula()}
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Tip: Use keyboard to type numbers (0-9) and operators (+, -, *, /, ^)</p>
            <p>Press ↑/↓ to navigate suggestions, Enter to select</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tag = ({ item, isSelected, isActive, onClick, onUpdate }) => {
  const [editValue, setEditValue] = useState(item.value);
  
  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-lg cursor-pointer relative transition-all
        ${isActive ? 'bg-blue-100 border border-blue-300 shadow-sm' : 'bg-white border border-gray-200'}
        ${isSelected ? 'ring-2 ring-blue-400' : ''}
        hover:bg-blue-50 hover:border-blue-200
      `}
      onClick={onClick}
    >
      <span className="font-medium text-blue-700">{item.name}</span>
      <span className="ml-2 text-xs text-gray-500">{item.category}</span>
      
      {isActive && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-72 p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800">{item.name}</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
              {item.category}
            </span>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Value</label>
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => onUpdate(item.id, editValue)}
              onKeyPress={(e) => e.key === 'Enter' && onUpdate(item.id, editValue)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => onUpdate(item.id, editValue)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </span>
  );
};

export default FormulaInput;