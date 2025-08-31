import '@testing-library/jest-dom';
import * as React from 'react';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills para Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage globalmente
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      const value = store[key] || null;
      console.log(`🧪 [LOCALSTORAGE_MOCK] getItem(${key}) = ${value}`);
      return value;
    }),
    setItem: jest.fn((key: string, value: string) => {
      console.log(`🧪 [LOCALSTORAGE_MOCK] setItem(${key}, ${value})`);
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      console.log(`🧪 [LOCALSTORAGE_MOCK] removeItem(${key})`);
      delete store[key];
    }),
    clear: jest.fn(() => {
      console.log(`🧪 [LOCALSTORAGE_MOCK] clear()`);
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: any }) => children,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Navigate: ({ to }: { to: string }) => `Navigate to ${to}`,
}));

// Mock de Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
  getUserProfile: jest.fn(() => Promise.resolve(null)),
  getCurrentUserProfile: jest.fn(() => Promise.resolve(null)),
  signIn: jest.fn(() => Promise.resolve({ user: null, error: null })),
  signOut: jest.fn(() => Promise.resolve(null)),
}));

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;