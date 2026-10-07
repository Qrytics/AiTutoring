/** One app-wide toast. `Toast.svelte` (rendered once in the layout) displays it. */
export const toastState = $state({ message: '', visible: false });

let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string, ms = 2400): void {
	toastState.message = message;
	toastState.visible = true;
	clearTimeout(timer);
	timer = setTimeout(() => (toastState.visible = false), ms);
}
