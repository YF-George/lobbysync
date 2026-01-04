import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const theme = writable<boolean>(false);

function applyTheme(dark: boolean) {
	if (!browser) return;
	const root = document.documentElement;
	if (dark) root.classList.add('dark');
	else root.classList.remove('dark');
}

function setTheme(dark: boolean) {
	theme.set(dark);
	if (!browser) return;
	try {
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	} catch {
		// Ignore localStorage errors
	}
	applyTheme(dark);
}

function toggleTheme() {
	theme.update((v) => {
		const nv = !v;
		if (browser) {
			try {
				localStorage.setItem('theme', nv ? 'dark' : 'light');
			} catch {
				// Ignore localStorage errors
			}
		}
		applyTheme(nv);
		return nv;
	});
}

function initTheme() {
	if (!browser) return;
	try {
		const saved = localStorage.getItem('theme');
		if (saved === 'dark') setTheme(true);
		else if (saved === 'light') setTheme(false);
	} catch {
		// Ignore localStorage errors
	}
}

export { theme, setTheme, toggleTheme, initTheme };
