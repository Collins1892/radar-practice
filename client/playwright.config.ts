import { defineConfig, devices } from '@playwright/test';

const reuse = !process.env.CI;
const apiTimeout = 120_000;
const viteTimeout = 30_000;
// CI workflow pre-restores and pre-builds Debug; skip MSBuild at probe time.
const dotnetRunFastStart = process.env.CI ? '--no-restore --no-build ' : '';

export default defineConfig({
  testDir: './e2e',
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-junit-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `dotnet run ${dotnetRunFastStart}--configuration Debug --project ../ItemsApi/ItemsApi.csproj --launch-profile http`,
      url: 'http://localhost:5133/items',
      name: 'ItemsApi',
      timeout: apiTimeout,
      reuseExistingServer: reuse,
    },
    {
      command: `dotnet run ${dotnetRunFastStart}--configuration Debug --project ../IncidentsApi/IncidentsApi.csproj --launch-profile http`,
      url: 'http://localhost:5134/incidents',
      name: 'IncidentsApi',
      timeout: apiTimeout,
      reuseExistingServer: reuse,
    },
    {
      command: `dotnet run ${dotnetRunFastStart}--configuration Debug --project ../AuditsApi/AuditsApi.csproj --launch-profile http`,
      url: 'http://localhost:5135/audits',
      name: 'AuditsApi',
      timeout: apiTimeout,
      reuseExistingServer: reuse,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      name: 'Vite',
      timeout: viteTimeout,
      reuseExistingServer: reuse,
      env: {
        VITE_API_URL: '',
        VITE_INCIDENTS_API_URL: 'http://localhost:5134',
        VITE_AUDITS_API_URL: 'http://localhost:5135',
      },
    },
  ],
});