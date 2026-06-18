import React, { createContext, useContext, useState, useEffect } from 'react';

export const HospitalContext = createContext({});

export const HospitalProvider = ({ children }) => {
  const [hospitalDetailsData, setHospitalDetailsData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hospitalDetailsData')) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('hospitalDetailsData', JSON.stringify(hospitalDetailsData));
  }, [hospitalDetailsData]);

  return (
    <HospitalContext.Provider value={{ hospitalDetailsData, setHospitalDetailsData }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospitalContext = () => useContext(HospitalContext);

export default HospitalContext;
