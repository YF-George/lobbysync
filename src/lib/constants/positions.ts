/**
 * 職位與位置配置（常數）
 * 用於統一 UI 顯示與樣式
 */

export interface PositionConfig {
	label: string;
	bg: string;
	border: string;
	text: string;
	color?: string; // 用於簡化版本
}

export const POSITION_CONFIG: Record<string, PositionConfig> = {
	tank: {
		label: '坦克',
		bg: 'bg-[#78541a]',
		border: 'border-amber-600/50',
		text: 'text-amber-100',
		color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
	},
	heal: {
		label: '補師',
		bg: 'bg-[#1a5d3a]',
		border: 'border-emerald-600/50',
		text: 'text-emerald-100',
		color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
	},
	dps: {
		label: '輸出',
		bg: 'bg-[#6d1a24]',
		border: 'border-rose-600/50',
		text: 'text-rose-100',
		color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
	}
};

/**
 * 取得職位配置
 */
export function getPositionConfig(position: string): PositionConfig {
	return (
		POSITION_CONFIG[position] || {
			label: position,
			bg: 'bg-slate-700',
			border: 'border-slate-600',
			text: 'text-white',
			color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
		}
	);
}

/**
 * 取得職位顏色（簡化版本，用於列表卡片）
 */
export function getPositionColor(position: string): string {
	return getPositionConfig(position).color || '';
}

/**
 * 取得職位標籤
 */
export function getPositionLabel(position: string): string {
	return getPositionConfig(position).label;
}

/**
 * 所有職位列表
 */
export const POSITIONS = ['tank', 'heal', 'dps'] as const;
export type Position = (typeof POSITIONS)[number];
