import { useState } from 'react';

export function usePostHistory() {
  const [history, setHistory] = useState([]);

  const addToHistory = (post) => {
    setHistory((prev) => {
      const newHistory = [post, ...prev].slice(0, 10);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addToHistory, clearHistory };
}
