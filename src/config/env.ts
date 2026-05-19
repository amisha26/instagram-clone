const getEnvVariable = (key: string): string => {
	const value = Bun.env[key];

	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}

	return value;
};

const NODE_ENV = Bun.env.NODE_ENV || "dev";

export const config = {
	dev: {
		PORT: Number(Bun.env.PORT) || 3000,
		DATABASE_URL: getEnvVariable("DATABASE_URL"),

		POSTGRES_PASSWORD: getEnvVariable("POSTGRES_PASSWORD"),

		POSTGRES_USER: getEnvVariable("POSTGRES_USER"),

		POSTGRES_DB: getEnvVariable("POSTGRES_DB"),
	},

	test: {
		PORT: 3001,
		DATABASE_URL: "",
		POSTGRES_PASSWORD: "",
		POSTGRES_USER: "",
		POSTGRES_DB: "",
	},

	prod: {
		PORT: Number(Bun.env.PORT) || 8080,

		DATABASE_URL: getEnvVariable("DATABASE_URL"),

		POSTGRES_PASSWORD: getEnvVariable("POSTGRES_PASSWORD"),

		POSTGRES_USER: getEnvVariable("POSTGRES_USER"),

		POSTGRES_DB: getEnvVariable("POSTGRES_DB"),
	},
};

export const env = config[NODE_ENV as keyof typeof config] || config.dev;
