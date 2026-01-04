import { writable, derived, get } from 'svelte/store';

export type Locale = 'zh' | 'en';
export const locale = writable<Locale>('zh');

const MESSAGES: Record<Locale, Record<string, string>> = {
	zh: {
		party_name: '副本名稱',
		date_time: '日期時間',
		date_format_hint: 'yyyy/MM/dd -- --:--',
		team_status: '團隊狀態',
		recruiting: '招募中',
		raid_mode: '副本模式',
		normal: '普通',
		gear_limit: '裝分限制',
		run_type: '種類',
		pioneering: '拓荒',
		level: '等級',
		player_nickname: '玩家暱稱',
		leader: '隊長',
		helper: '幫打',
		refresh_teams: '🔄 刷新團隊',
		refreshing: '⏳ 重置中…',
		teams_empty: '目前沒有派對',
		empty_text: '目前沒有可加入的派對。',
		members_label: '隊員',
		difficulty_label: '難度',
		type_label: '類型',
		players_label: '人數'
	},
	en: {
		party_name: 'Party Name',
		date_time: 'Date & Time',
		date_format_hint: 'yyyy/MM/dd -- --:--',
		team_status: 'Team Status',
		recruiting: 'Recruiting',
		raid_mode: 'Raid Mode',
		normal: 'Normal',
		gear_limit: 'Gear Limit',
		run_type: 'Type',
		pioneering: 'Pioneering',
		level: 'Level',
		player_nickname: 'Nickname',
		leader: 'Leader',
		helper: 'Helper',
		refresh_teams: '🔄 Refresh Teams',
		refreshing: '⏳ Resetting…',
		teams_empty: 'No parties',
		empty_text: 'There are no available parties.',
		members_label: 'Members',
		difficulty_label: 'Difficulty',
		type_label: 'Type',
		players_label: 'Players'
	}
};

export const messages = derived(locale, ($l) => MESSAGES[$l]);

export function t(key: string) {
	const m = get(messages);
	return m[key] ?? key;
}

export function toggleLocale() {
	locale.update((l) => (l === 'zh' ? 'en' : 'zh'));
}

export default { locale, messages, t, toggleLocale };
