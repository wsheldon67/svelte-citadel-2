import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: [
		{
			command: 'npm run build && npm run preview',
			port: 4173,
			reuseExistingServer: !process.env.CI
		},
		{
			command: 'firebase emulators:start --only firestore,auth',
			port: 8080,
			reuseExistingServer: !process.env.CI
		}
	],
	testDir: 'e2e',
	use: {
		// Set environment variable to indicate we're in test mode
		extraHTTPHeaders: {
			'X-Test-Mode': 'true'
		}
	},
	projects: [
		{
			name: 'Microsoft Edge',
			use: {
				channel: 'msedge',
				baseURL: 'http://localhost:4173'
			}
		}
	]
});
