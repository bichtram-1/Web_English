interface OtpEntry {
  otp: string;
  expiresAt: number;
}

export class OtpService {
  private static otpStore: Map<string, OtpEntry> = new Map();

  static generateOtp(email: string, expiresInMinutes = 10): string {
    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

    this.otpStore.set(cleanEmail, { otp, expiresAt });
    return otp;
  }

  static verifyOtp(email: string, otp: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const entry = this.otpStore.get(cleanEmail);

    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(cleanEmail);
      return false;
    }

    return entry.otp === otp.trim();
  }

  static consumeOtp(email: string, otp: string): boolean {
    const isValid = this.verifyOtp(email, otp);
    if (isValid) {
      this.otpStore.delete(email.trim().toLowerCase());
    }
    return isValid;
  }
}
