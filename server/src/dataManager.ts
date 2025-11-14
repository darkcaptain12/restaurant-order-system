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

export function readMenu(): MenuItem[] {
  try {
    const data = readFileSync(join(dataDir, 'menu.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function readOrders(): Order[] {
  try {
    const data = readFileSync(join(dataDir, 'orders.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
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

export function writeCompletedOrders(orders: Order[]): void {
  writeFileSync(join(dataDir, 'completed-orders.json'), JSON.stringify(orders, null, 2));
}

export function writeMenu(menu: MenuItem[]): void {
  writeFileSync(join(dataDir, 'menu.json'), JSON.stringify(menu, null, 2));
}

