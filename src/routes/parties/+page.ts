import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/parties');
		if (!res.ok) {
			throw error(res.status, '無法載入派對列表');
		}
		const data = await res.json();
		return { parties: data.parties || [] };
	} catch (err) {
		throw error(500, '載入派對列表時出錯');
	}
};
