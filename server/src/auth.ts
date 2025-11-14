import type { User } from './types.js';
import { readUsers, writeUsers } from './dataManager.js';

export function getUserByPin(pin: string): User | null {
  const users = readUsers();
  const user = users.find(u => u.pin === pin);
  return user || null;
}

export function getUserByUsername(username: string): User | null {
  const users = readUsers();
  return users.find(u => u.username === username) || null;
}

export function getUserByRole(role: string): User | null {
  const users = readUsers();
  return users.find(u => u.role === role) || null;
}

export function getAllUsers(): User[] {
  return readUsers();
}

export function createUser(username: string, pin: string, role: 'waiter' | 'cashier'): User {
  const users = readUsers();
  const newUser: User = {
    id: `${role}_${Date.now()}`,
    username,
    role,
    pin
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export function createWaiter(username: string, pin: string): User {
  return createUser(username, pin, 'waiter');
}

export function deleteUser(userId: string, role: 'waiter' | 'cashier'): boolean {
  const users = readUsers();
  const index = users.findIndex(u => u.id === userId && u.role === role);
  if (index === -1) return false;
  users.splice(index, 1);
  writeUsers(users);
  return true;
}

export function deleteWaiter(waiterId: string): boolean {
  return deleteUser(waiterId, 'waiter');
}
