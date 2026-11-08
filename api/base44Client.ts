/**
 * Local-first client replacement for base44 with zero external network calls.
 * Prevents 403 deprecated account API key errors from Base44 servers.
 */

// Initial seed data for clean first-time experience
const SEED_DATA: Record<string, any[]> = {
  user: [
    {
      id: 'user_1',
      email: 'user@example.com',
      full_name: 'Alex Doe',
      role: 'user',
      phone_number: '+44 7700 900077',
      address: 'London, United Kingdom',
      short_note: 'Freelance & Shift Worker',
      created_date: new Date().toISOString(),
    }
  ],
  usersettings: [
    {
      id: 'settings_1',
      theme: 'dark',
      currency: 'GBP',
      date_format: 'DD/MM/YYYY',
      week_start: 'monday',
      expense_categories: ['Groceries', 'Rent', 'Transportation', 'Utilities', 'Equipment', 'Fuel'],
      created_by: 'user@example.com',
    }
  ],
  company: [
    {
      id: 'comp_1',
      name: 'Apex Logistics',
      hourly_rate: 18.50,
      currency: 'GBP',
      overtime_rate: 27.75,
      overtime_start_hours: 8,
      color: '#8b5cf6',
      is_active: true,
      created_by: 'user@example.com'
    },
    {
      id: 'comp_2',
      name: 'Metro Retail Group',
      hourly_rate: 15.00,
      currency: 'GBP',
      overtime_rate: 22.50,
      overtime_start_hours: 8,
      color: '#3b82f6',
      is_active: true,
      created_by: 'user@example.com'
    },
    {
      id: 'comp_3',
      name: 'Tech Services Co',
      hourly_rate: 35.00,
      currency: 'GBP',
      overtime_rate: 50.00,
      overtime_start_hours: 8,
      color: '#10b981',
      is_active: true,
      created_by: 'user@example.com'
    }
  ],
  workshift: [
    {
      id: 'shift_1',
      company_id: 'comp_1',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      start_time: '08:30',
      end_time: '17:00',
      break_minutes: 30,
      total_hours: 8.0,
      hourly_rate: 18.50,
      total_income: 148.00,
      job_description: 'Warehouse logistics & dispatch supervision',
      visibility: 'shared',
      created_by: 'user@example.com'
    },
    {
      id: 'shift_2',
      company_id: 'comp_1',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '16:30',
      break_minutes: 30,
      total_hours: 8.0,
      hourly_rate: 18.50,
      total_income: 148.00,
      job_description: 'Inventory audit and forklift routing',
      visibility: 'shared',
      created_by: 'user@example.com'
    },
    {
      id: 'shift_3',
      company_id: 'comp_2',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '18:30',
      break_minutes: 45,
      total_hours: 7.75,
      hourly_rate: 15.00,
      total_income: 116.25,
      job_description: 'Floor supervisor & stock reception',
      visibility: 'private',
      created_by: 'user@example.com'
    },
    {
      id: 'shift_4',
      company_id: 'comp_3',
      date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '15:00',
      break_minutes: 30,
      total_hours: 5.5,
      hourly_rate: 35.00,
      total_income: 192.50,
      job_description: 'POS terminal updates and network check',
      visibility: 'private',
      created_by: 'user@example.com'
    },
    {
      id: 'shift_5',
      company_id: 'comp_1',
      date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '17:30',
      break_minutes: 30,
      total_hours: 9.0,
      hourly_rate: 18.50,
      total_income: 171.13,
      job_description: 'Weekend overtime & delivery intake',
      visibility: 'shared',
      created_by: 'user@example.com'
    }
  ],
  expense: [
    {
      id: 'exp_1',
      title: 'Weekly Fuel / Diesel',
      amount: 45.00,
      category: 'transportation',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      company_id: 'comp_1',
      is_deductible: true,
      notes: 'Fuel for site commute',
      created_by: 'user@example.com'
    },
    {
      id: 'exp_2',
      title: 'Work Safety Boots & Gloves',
      amount: 68.50,
      category: 'tools',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      is_deductible: true,
      notes: 'PPE required for warehouse',
      created_by: 'user@example.com'
    },
    {
      id: 'exp_3',
      title: 'Lunch & Coffee',
      amount: 14.20,
      category: 'food',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      is_deductible: false,
      notes: 'Shift meal',
      created_by: 'user@example.com'
    }
  ],
  incomegoal: [
    {
      id: 'goal_1',
      title: 'Emergency Savings Fund',
      target_amount: 3000,
      current_progress: 1850,
      category: 'Savings',
      period: 'Monthly Savings',
      created_by: 'user@example.com'
    },
    {
      id: 'goal_2',
      title: 'Work Equipment & Laptop',
      target_amount: 1200,
      current_progress: 750,
      category: 'Equipment',
      period: 'Quarterly',
      created_by: 'user@example.com'
    }
  ],
  trustedperson: [
    {
      id: 'tp_1',
      email: 'sarah.doe@example.com',
      name: 'Sarah Doe',
      relation: 'Partner',
      access_level: 'read',
      created_by: 'user@example.com'
    }
  ]
};

const createLocalMock = (entityName: string) => {
  const normName = entityName.toLowerCase();
  const storageKey = `base44_mock_${normName}`;

  const getItems = (): any[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      // If no stored data exists, seed if we have seed data
      if (SEED_DATA[normName]) {
        localStorage.setItem(storageKey, JSON.stringify(SEED_DATA[normName]));
        return SEED_DATA[normName];
      }
      return [];
    } catch (e) {
      console.error(`Error reading ${storageKey} from localStorage:`, e);
      return SEED_DATA[normName] || [];
    }
  };

  const setItems = (items: any[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error(`Error saving ${storageKey} to localStorage:`, e);
    }
  };

  return {
    list: async (params?: any) => {
      let items = getItems();

      if (params?.q) {
        try {
          const q = typeof params.q === 'string' ? JSON.parse(params.q) : params.q;
          Object.keys(q).forEach(key => {
            if (key === 'created_by') {
              items = items.filter((i: any) => !i.created_by || i.created_by === q.created_by);
            } else {
              items = items.filter((i: any) => i[key] === q[key]);
            }
          });
        } catch (e) {
          console.error(`Error parsing query in mock ${entityName}.list`, e);
        }
      }

      if (params?.sort_by) {
        const isDesc = params.sort_by.startsWith('-');
        const field = isDesc ? params.sort_by.slice(1) : params.sort_by;
        items.sort((a: any, b: any) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }

      if (params?.limit) {
        items = items.slice(0, params.limit);
      }

      return items;
    },

    filter: async (params?: any) => {
      let items = getItems();
      if (params) {
        Object.keys(params).forEach(key => {
          items = items.filter((i: any) => i[key] === params[key]);
        });
      }
      return items;
    },

    create: async (data: any) => {
      const items = getItems();
      const newItem = {
        ...data,
        id: data.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      items.unshift(newItem);
      setItems(items);
      return newItem;
    },

    update: async (id: string, data: any) => {
      let items = getItems();
      let updatedItem: any = null;
      items = items.map((i: any) => {
        if (i.id === id) {
          updatedItem = { ...i, ...data, updated_at: new Date().toISOString() };
          return updatedItem;
        }
        return i;
      });
      setItems(items);
      return updatedItem || { id, ...data };
    },

    delete: async (id: string) => {
      let items = getItems();
      items = items.filter((i: any) => i.id !== id);
      setItems(items);
      return { success: true };
    },

    get: async (id: string) => {
      const items = getItems();
      return items.find((i: any) => i.id === id) || null;
    }
  };
};

const mockCache: Record<string, any> = {};

export const base44 = {
  entities: new Proxy({}, {
    get(_target, entityProp) {
      const entityName = String(entityProp);
      if (!mockCache[entityName]) {
        mockCache[entityName] = createLocalMock(entityName);
      }
      return mockCache[entityName];
    }
  }),

  auth: {
    logout: () => {
      try {
        localStorage.removeItem('base44_auth_token');
      } catch (e) {}
      window.location.reload();
    },
    me: async () => ({
      id: 'user_1',
      email: 'user@example.com',
      full_name: 'Alex Doe',
      role: 'user'
    }),
    setToken: (_token: string) => {},
    getToken: () => 'mock-token-local',
    loginViaEmailPassword: async () => ({ success: true })
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }) => {
        return new Promise<{ file_url: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ file_url: reader.result as string });
          };
          reader.onerror = () => {
            // fallback
            resolve({ file_url: URL.createObjectURL(file) });
          };
          reader.readAsDataURL(file);
        });
      }
    }
  }
} as any;
