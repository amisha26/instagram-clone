import { randomInt } from "node:crypto";
import { env } from "../../config/env";

class OTPService {
	private otpLength: number;
	private otpExpiryMinutes: number;

	constructor() {
		this.otpLength = env.OTP_LENGTH;
		this.otpExpiryMinutes = env.OTP_EXPIRATION_MINUTES;
	}

	generateOTP = async () => {
		const min = 10 ** (this.otpLength - 1);
		const max = 10 ** this.otpLength;

		const otp = randomInt(min, max).toString();

		const hashedOTP = await this.hashOTP(otp);

		const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

		return {
			otp,
			hashedOTP,
			expiresAt,
		};
	};

	hashOTP = async (otp: string) => {
		return await Bun.password.hash(otp);
	};

	verifyOTP = async (plainOTP: string, hashedOTP: string) => {
		return await Bun.password.verify(plainOTP, hashedOTP);
	};
}

export default new OTPService();
