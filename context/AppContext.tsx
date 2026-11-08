import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { User, UserSettings, Company, WorkShift, Expense, IncomeGoal } from '../types';
import { base44 } from '../api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

interface AppContextType {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  refetchSettings: () => void;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // For this demo/app, we'll assume a "current user"
  // In a real app, this would come from an Auth provider
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const users = await (base44.entities.User as any).list({ limit: 1 });
        if (users && users.length > 0) {
          setUser(users[0]);
        } else {
          // Create a default user if none exists
          const newUser = await (base44.entities.User as any).create({
            email: 'user@example.com',
            full_name: 'Alex Doe',
            role: 'user'
          });
          setUser(newUser);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      }
    };
    fetchUser();
  }, []);

  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['userSettings', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const settingsList = await (base44.entities.UserSettings as any).list({
        q: JSON.stringify({ created_by: user.email })
      });
      if (settingsList && settingsList.length > 0) {
        return settingsList[0] as UserSettings;
      }
      // Create default settings if none exist
      return await (base44.entities.UserSettings as any).create({
        theme: 'dark',
        currency: 'GBP',
        date_format: 'DD/MM/YYYY',
        created_by: user.email
      }) as UserSettings;
    },
    enabled: !!user
  });

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!settings?.id) return;
    try {
      await (base44.entities.UserSettings as any).update(settings.id, data);
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    } catch (error) {
      console.error('Failed to update settings', error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user?.id) return;
    try {
      const updatedUser = await (base44.entities.User as any).update(user.id, data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      settings: settings || null, 
      isLoading: !user || settingsLoading,
      refetchSettings,
      updateSettings,
      updateUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
