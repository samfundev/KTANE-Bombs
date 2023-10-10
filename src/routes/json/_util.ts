export function minimize(obj: any) {
	Object.keys(obj).forEach(k => {
		if (obj[k] == null) delete obj[k];
	});
}