import type { User } from './types.js';
import { readUsers, writeUsers } from './dataManager.js';

const DEFAULT_BRANCH = "default";

function readUsersForBranch(branchId: string) {
  const all = readUsers();
  return all.filter(u => (u.branchId || DEFAULT_BRANCH) === branchId);
}

function writeUsersForBranch(branchId: string, users: User[]) {
  const all = readUsers();
  const filtered = all.filter(u => (u.branchId || DEFAULT_BRANCH) !== branchId);
  const merged = [...filtered, ...users];
  writeUsers(merged);
}

// PIN'in tüm sistemde benzersiz olup olmadığını kontrol et
export function isPinUnique(pin: string): boolean {
  const all = readUsers();
  return !all.some(u => u.pin === pin);
}

// PIN ve branchId ile kullanıcı bul
export function getUserByPin(pin: string, branchId: string): User | null {
  const all = readUsers();
  const user = all.find(u => u.pin === pin);
  // PIN doğru olsa bile branchId eşleşmiyorsa null döndür
  if (user && (user.branchId || DEFAULT_BRANCH) === branchId) {
    return user;
  }
  return null;
}

export function getUserByUsername(username: string, branchId: string): User | null {
  const users = readUsersForBranch(branchId);
  return users.find(u => u.username === username) || null;
}

export function getUserByRole(role: string, branchId: string): User | null {
  const users = readUsersForBranch(branchId);
  return users.find(u => u.role === role) || null;
}

export function getAllUsers(branchId: string): User[] {
  return readUsersForBranch(branchId);
}

export function createUser(username: string, pin: string, role: 'waiter' | 'cashier', branchId: string): User {
  // PIN'in tüm sistemde benzersiz olduğunu kontrol et
  if (!isPinUnique(pin)) {
    throw new Error('PIN already in use');
  }
  
  const users = readUsersForBranch(branchId);
  const newUser: User = {
    id: `${role}_${Date.now()}`,
    username,
    role,
    pin,
    branchId: branchId
  };
  users.push(newUser);
  writeUsersForBranch(branchId, users);
  return newUser;
}

export function createWaiter(username: string, pin: string, branchId: string): User {
  return createUser(username, pin, 'waiter', branchId);
}

export function deleteUser(userId: string, role: 'waiter' | 'cashier', branchId: string): boolean {
  const users = readUsersForBranch(branchId);
  const index = users.findIndex(u => u.id === userId && u.role === role);
  if (index === -1) return false;
  users.splice(index, 1);
  writeUsersForBranch(branchId, users);
  return true;
}

export function deleteWaiter(waiterId: string, branchId: string): boolean {
  return deleteUser(waiterId, 'waiter', branchId);
}
