import React, { createContext, useState, useContext } from 'react';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [allRoutes, setAllRoutes] = useState([
    { id: 1, title: '2024 대전 여행', location: '대한민국 대전광역시', date: '2024.01.05', category: '국내', isFavorite: false },
    { id: 2, title: '2022 제주도 여행', location: '대한민국 제주특별자치도', date: '2024.08.12', category: '국내', isFavorite: false },
    { id: 3, title: '2022 강릉 여행', location: '대한민국 강릉시', date: '2022.03.05', category: '국내', isFavorite: false },
    { id: 4, title: '2018 경주 여행', location: '대한민국 경주시', date: '2018.07.12', category: '국내', isFavorite: false },
    { id: 5, title: '2026 일본 여행', location: '일본 도쿄/오사카', date: '2026.05.20', category: '해외', isFavorite: false },
  ]);

  const toggleFavorite = (id) => {
    setAllRoutes(prev => prev.map(route => 
      route.id === id ? { ...route, isFavorite: !route.isFavorite } : route
    ));
  };

  return (
    <RouteContext.Provider value={{ allRoutes, setAllRoutes, toggleFavorite }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = () => useContext(RouteContext);
