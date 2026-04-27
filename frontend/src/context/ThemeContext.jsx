import { createContext, useState, useEffect, useContext } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('isDarkMode');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      console.error('Error reading dark mode state:', e);
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    
    const applyTheme = async () => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        if (Capacitor.isNativePlatform()) {
          try {
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.setStyle({ style: Style.Default });
            await StatusBar.setBackgroundColor({ color: '#0f172a' }); // slate-950
          } catch (e) { console.log(e); }
        }
      } else {
        document.documentElement.classList.remove('dark');
        if (Capacitor.isNativePlatform()) {
          try {
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.setStyle({ style: Style.Default });
            await StatusBar.setBackgroundColor({ color: '#ffffff' }); // white
          } catch (e) { console.log(e); }
        }
      }
    };
    
    applyTheme();
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
