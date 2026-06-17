export const getOtpTemplate = (otp: string, username = "there"): string => {
	return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
      .container { max-width: 480px; margin: 20px auto; background: #ffffff; border: 1px solid #e1e1e1; border-radius: 8px; padding: 40px; text-align: center; }
      .logo { font-size: 24px; font-weight: bold; letter-spacing: -0.5px; margin-bottom: 30px; color: #000000; }
      .greeting { font-size: 18px; color: #262626; margin-bottom: 12px; font-weight: 600; text-align: left; }
      .text { font-size: 14px; color: #737373; margin-bottom: 30px; line-height: 20px; text-align: left; }
      .otp-box { background-color: #fafafa; border: 1px dashed #dbdbdb; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 16px; margin: 20px 0; border-radius: 6px; color: #000000; text-align: center; }
      .footer { font-size: 12px; color: #c7c7c7; margin-top: 40px; border-top: 1px solid #efefef; padding-top: 20px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">Instagram</div>
      <div class="greeting">Hi ${username},</div>
      <div class="text">Help us secure your account by verifying your email address. Use the 5-digit verification code below to complete your verification loop. This code is valid for 5 minutes.</div>
      <div class="otp-box">${otp}</div>
      <div class="text" style="margin-bottom: 0;">If you did not request this code, please ignore this email safely.</div>
      <div class="footer">© ${new Date().getFullYear()} Instagram Clone. All rights reserved.</div>
    </div>
  </body>
  </html>
  `;
};
