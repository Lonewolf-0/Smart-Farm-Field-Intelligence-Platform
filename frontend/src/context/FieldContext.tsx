import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import type { Field } from "../types";

interface FieldContextType {
  fields: Field[];
  isLoadingFields: boolean;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  refreshFields: () => Promise<void>;
}

const FieldContext = createContext<FieldContextType | undefined>(undefined);

export const FieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState<boolean>(true);
  
  // Read initial selection from localStorage
  const [selectedFieldId, setSelectedFieldIdState] = useState<string | null>(() => {
    return localStorage.getItem("selectedFieldId") || null;
  });

  const setSelectedFieldId = useCallback((id: string | null) => {
    setSelectedFieldIdState(id);
    if (id) {
      localStorage.setItem("selectedFieldId", id);
    } else {
      localStorage.removeItem("selectedFieldId");
    }
  }, []);

  const refreshFields = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingFields(true);
      const res = await api.get("/fields");
      if (res.data?.success) {
        const fetchedFields = res.data.data;
        setFields(fetchedFields);
        
        // Auto-select if currently selected field is invalid, or if null but we have fields
        const savedId = localStorage.getItem("selectedFieldId");
        if (savedId && fetchedFields.some((f: Field) => f.id === savedId)) {
          setSelectedFieldId(savedId);
        } else if (fetchedFields.length > 0) {
          setSelectedFieldId(fetchedFields[0].id);
        } else {
          setSelectedFieldId(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch fields:", err);
    } finally {
      setIsLoadingFields(false);
    }
  }, [isAuthenticated, setSelectedFieldId]);

  useEffect(() => {
    void refreshFields();
  }, [refreshFields]);

  return (
    <FieldContext.Provider
      value={{
        fields,
        isLoadingFields,
        selectedFieldId,
        setSelectedFieldId,
        refreshFields,
      }}
    >
      {children}
    </FieldContext.Provider>
  );
};

export const useField = (): FieldContextType => {
  const context = useContext(FieldContext);
  if (context === undefined) {
    throw new Error("useField must be used within a FieldProvider");
  }
  return context;
};
