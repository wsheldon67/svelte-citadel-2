import { page } from '@vitest/browser/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => {
	return { goto: vi.fn() };
});
import { goto } from '$app/navigation';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page);
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('navigates to /[code] on Create game with host params', async () => {
		render(Page);

		// Fill in the host form specifically
		const hostSection = page.getByRole('group', { name: 'Host' });
		const name = hostSection.getByRole('textbox', { name: 'Display name' });
		await name.fill('TestPlayer');

		const create = page.getByRole('button', { name: 'Create game' });
		await create.click();

		expect(goto).toHaveBeenCalledTimes(1);
		const url = /** @type {any} */ (goto).mock.calls[0][0];
		expect(url).toMatch(/^\/[A-Z0-9]{6}$/);
	});

	it('navigates to /[code] on Join game using code', async () => {
		render(Page);

		const joinSection = page.getByRole('region', { name: 'Join a game' });
		const code = joinSection.getByRole('textbox', { name: 'Code' });
		await code.fill('ABC123');

		const join = page.getByRole('button', { name: 'Join game' });
		await join.click();

		expect(goto).toHaveBeenCalledTimes(1);
		const url = /** @type {any} */ (goto).mock.calls[0][0];
		expect(url).toMatch(/^\/ABC123$/);
	});
});
