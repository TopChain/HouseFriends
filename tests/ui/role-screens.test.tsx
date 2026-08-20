import { cleanup, render, waitFor } from '@testing-library/react-native';
import DiscoveryScreen from '@/app/(tabs)/index';
import ShareScreen from '@/app/(tabs)/share';
import AdminScreen from '@/app/admin';
import CompanyDashboard from '@/app/company-dashboard';
import ProviderDashboard from '@/app/provider-dashboard';
import OnboardingScreen from '@/app/onboarding';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
}));

jest.mock('@/components/map/DiscoveryMap', () => ({
  DiscoveryMap: () => null,
}));

jest.mock('@/providers/AppProvider', () => ({
  useApp: () => ({ session: null, setDemoRole: jest.fn(), refreshProfile: jest.fn() }),
}));

afterEach(cleanup);

describe('role-specific release smoke screens', () => {
  it('requires explicit community-rules consent during onboarding', async () => {
    const view = await render(<OnboardingScreen />);
    expect(view.getByText(/I accept the Terms and Community Rules/)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Create HouseFriends profile' }).props.accessibilityState.disabled).toBe(true);
  });

  it('renders the service-searcher discovery flow with real demo results', async () => {
    const view = await render(<DiscoveryScreen />);
    expect(view.getByText('Find trusted home service')).toBeTruthy();
    await waitFor(() => expect(view.getByText('AlexFixes')).toBeTruthy());
    expect(view.getByText(/safe public place/i)).toBeTruthy();
  });

  it('renders the experience-sharer flow with all five rating questions', async () => {
    const view = await render(<ShareScreen />);
    expect(view.getByText('Real job. Real cost. Real experience.')).toBeTruthy();
    await waitFor(() => expect(view.getByText('Quality of work')).toBeTruthy());
    expect(view.getByText('Would you recommend?')).toBeTruthy();
  });

  it('renders the individual Service Friend dashboard', async () => {
    const view = await render(<ProviderDashboard />);
    expect(view.getByText('Alex Home Repair')).toBeTruthy();
    expect(view.getByText('2 / 100')).toBeTruthy();
  });

  it('renders the company branch and team dashboard', async () => {
    const view = await render(<CompanyDashboard />);
    expect(view.getByText('BlueWater Plumbing')).toBeTruthy();
    expect(view.getByText('3 / 1,000')).toBeTruthy();
  });

  it('renders the admin moderation and country-gate console', async () => {
    const view = await render(<AdminScreen />);
    expect(view.getByText('Safety and control center')).toBeTruthy();
    expect(view.getByText('United States sponsored promotion')).toBeTruthy();
  });
});
