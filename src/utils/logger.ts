export const logger = {
	error: (payload: unknown, message = "Error") => {
		const meta =
			payload && typeof payload === "object" && !Array.isArray(payload)
				? payload
				: { payload };
		console.error(JSON.stringify({ level: "error", message, ...meta }));
	},
	info: (payload: unknown, message = "Info") => {
		const meta =
			payload && typeof payload === "object" && !Array.isArray(payload)
				? payload
				: { payload };
		console.info(JSON.stringify({ level: "info", message, ...meta }));
	},
};
