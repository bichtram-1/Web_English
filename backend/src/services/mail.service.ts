import nodemailer from 'nodemailer';

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return this.transporter;
    }

    return null;
  }

  static async sendOtpEmail(email: string, otp: string, recipientName?: string): Promise<boolean> {
    const transporter = this.getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"LinguaLeap Support" <no-reply@lingualeap.edu.vn>';
    const name = recipientName || 'Học viên';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">LinguaLeap</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Nền tảng học tiếng Anh thông minh</p>
        </div>
        <div style="padding: 32px 28px; color: #334155;">
          <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Xin chào ${name},</h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản LinguaLeap của bạn. Vui lòng sử dụng mã OTP xác thực bên dưới:
          </p>
          <div style="background-color: #f1f5f9; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">${otp}</span>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Mã OTP có hiệu lực trong vòng 10 phút</p>
          </div>
          <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ nếu bạn có bất kỳ thắc mắc nào.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center;">
            © ${new Date().getFullYear()} LinguaLeap Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: `[LinguaLeap] Mã OTP khôi phục mật khẩu: ${otp}`,
          html: htmlContent,
          text: `Mã OTP khôi phục mật khẩu LinguaLeap của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`,
        });
        console.log(`[MailService] Email sent successfully to ${email}`);
        return true;
      } catch (err) {
        console.error('[MailService] Failed to send email via SMTP:', err);
      }
    }

    // Dev/Fallback Logger
    console.log(`\n======================================================`);
    console.log(`🔑 [MÃ OTP KHÔI PHỤC MẬT KHẨU CHO ${email}]`);
    console.log(`👉 MÃ OTP: [ ${otp} ] (Hiệu lực: 10 phút)`);
    console.log(`======================================================\n`);

    return true;
  }
}
