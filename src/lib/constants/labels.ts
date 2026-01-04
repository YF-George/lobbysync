/**
 * 派對與副本的標籤定義（常數）
 * 用於統一 UI 顯示，避免重複定義
 */

export const RAID_MODE_LABELS: Record<number, string> = {
	1: '普通',
	2: '百業',
	3: '混合'
};

export const RUN_TYPE_LABELS: Record<number, string> = {
	1: '拓荒',
	2: '速刷',
	3: '教學'
};

export const PARTY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
	recruiting: {
		label: '招募中',
		color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
	},
	ready: {
		label: '準備完成',
		color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
	},
	finished: {
		label: '已完成',
		color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
	},
	canceled: {
		label: '已取消',
		color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
	}
};

/**
 * 取得派對模式標籤
 */
export function getRaidModeLabel(mode: number | string): string {
	const modeNum = Number(mode);
	return RAID_MODE_LABELS[modeNum] || String(mode);
}

/**
 * 取得運行類型標籤
 */
export function getRunTypeLabel(type: number | string): string {
	const typeNum = Number(type);
	return RUN_TYPE_LABELS[typeNum] || String(type);
}

/**
 * 取得派對狀態標籤與顏色
 */
export function getStatusBadge(status: string): { label: string; color: string } {
	return (
		PARTY_STATUS_LABELS[status] || {
			label: status,
			color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
		}
	);
}
