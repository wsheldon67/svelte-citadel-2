import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},
	testDir: 'e2e',
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
