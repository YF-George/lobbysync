export const theme = {
    current: 'light',
    init() {
        try {
            const stored = localStorage.getItem('theme');
            if (stored) this.current = stored;
            document.documentElement.classList.toggle('dark', this.current === 'dark');
        } catch (e) {}
    },
    toggle() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        try { localStorage.setItem('theme', this.current); } catch(e){}
        document.documentElement.classList.toggle('dark', this.current === 'dark');
    }
};
