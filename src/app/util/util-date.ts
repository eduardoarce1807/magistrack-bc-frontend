export class UtilDate {
	public static toPeruIsoString(date: Date) {
		const pad = (n: number) => n.toString().padStart(2, '0');
		const year = date.getFullYear();
		const month = pad(date.getMonth() + 1);
		const day = pad(date.getDate());
		const hour = pad(date.getHours());
		const min = pad(date.getMinutes());
		const sec = pad(date.getSeconds());
		// Retorna en formato: YYYY-MM-DDTHH:mm:ss-05:00
		return `${year}-${month}-${day}T${hour}:${min}:${sec}-05:00`;
	}
}
