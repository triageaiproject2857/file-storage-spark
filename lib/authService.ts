export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string; // Storing password for mock purpose only
}

const USERS_KEY = 'cloudvault_users';
const CURRENT_USER_KEY = 'cloudvault_current_user';

// Helper to get users from localStorage
const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    // Initialize with a default admin user and standard user for testing
    const defaultUsers: User[] = [
      { id: '1', email: 'admin@cloudvault.com', role: 'admin', isActive: true, password: 'password' },
      { id: '2', email: 'jordan@acme.co', role: 'user', isActive: true, password: 'password' },
    ];
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
    return defaultUsers;
  }
  return JSON.parse(stored);
};

// Helper to save users
const saveUsers = (users: User[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const authService = {
  signUp: async (email: string, password: string, role: UserRole = 'user'): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      role,
      isActive: true,
      password // Mock only
    };

    users.push(newUser);
    saveUsers(users);

    // Automatically log in
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    }

    return newUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    return user;
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  resetPassword: async (email: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex].password = newPassword;
    saveUsers(users);
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};
