/* global jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@neondatabase/neon-js', () => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    limit: jest.fn(() => query),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
    insert: jest.fn(async () => ({ data: null, error: null })),
    upsert: jest.fn(async () => ({ data: null, error: null })),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    SupabaseAuthAdapter: jest.fn(() => ({})),
    createClient: jest.fn(() => ({
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        signOut: jest.fn(async () => ({ error: null })),
      },
      from: jest.fn(() => query),
      rpc: jest.fn(async () => ({ data: null, error: null })),
    })),
  };
});
