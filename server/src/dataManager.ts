import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { User, MenuItem, Order } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '../data');

export function readUsers(): User[] {
  try {
    const data = readFileSync(join(dataDir, 'users.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function readUsersByBranch(branchId: string): User[] {
  const users = readUsers();
  return users.filter(user => user.branchId === branchId);
}

export function writeUsersByBranch(branchId: string, updatedUsers: User[]): void {
  const allUsers = readUsers();
  const filtered = allUsers.filter(user => user.branchId !== branchId);
  const merged = [...filtered, ...updatedUsers];
  writeUsers(merged);
}

export function readMenu(): MenuItem[] {
  try {
    const data = readFileSync(join(dataDir, 'menu.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function readMenuByBranch(branchId: string): MenuItem[] {
  const menu = readMenu();
  return menu.filter(item => item.branchId === branchId);
}

export function writeMenuByBranch(branchId: string, updatedMenu: MenuItem[]): void {
  const allMenu = readMenu();
  const filtered = allMenu.filter(item => item.branchId !== branchId);
  const merged = [...filtered, ...updatedMenu];
  writeMenu(merged);
}

export function readOrders(): Order[] {
  try {
    const data = readFileSync(join(dataDir, 'orders.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function readOrdersByBranch(branchId: string): Order[] {
  const orders = readOrders();
  return orders.filter(order => order.branchId === branchId);
}

export function writeOrdersByBranch(branchId: string, updatedOrders: Order[]): void {
  const allOrders = readOrders();
  const filtered = allOrders.filter(order => order.branchId !== branchId);
  const merged = [...filtered, ...updatedOrders];
  writeOrders(merged);
}

export function writeOrders(orders: Order[]): void {
  writeFileSync(join(dataDir, 'orders.json'), JSON.stringify(orders, null, 2));
}

export function writeUsers(users: User[]): void {
  writeFileSync(join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
}

export function readCompletedOrders(): Order[] {
  try {
    const data = readFileSync(join(dataDir, 'completed-orders.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function readCompletedOrdersByBranch(branchId: string): Order[] {
  const orders = readCompletedOrders();
  return orders.filter(order => order.branchId === branchId);
}

export function writeCompletedOrdersByBranch(branchId: string, updatedOrders: Order[]): void {
  const allOrders = readCompletedOrders();
  const filtered = allOrders.filter(order => order.branchId !== branchId);
  const merged = [...filtered, ...updatedOrders];
  writeCompletedOrders(merged);
}

export function writeCompletedOrders(orders: Order[]): void {
  writeFileSync(join(dataDir, 'completed-orders.json'), JSON.stringify(orders, null, 2));
}

export function writeMenu(menu: MenuItem[]): void {
  writeFileSync(join(dataDir, 'menu.json'), JSON.stringify(menu, null, 2));
}

export interface Branch {
  id: string;
  name: string;
}

export function readBranches(): Branch[] {
  try {
    const data = readFileSync(join(dataDir, 'branches.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

