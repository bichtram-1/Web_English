/**
 * Email validation and Disposable/Temporary Email Domain Blocker
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'burnermail.io',
  'crazymailing.com',
  'dispostable.com',
  'dropmail.me',
  'emailfake.com',
  'emailondeck.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'generator.email',
  'getairmail.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'inboxbear.com',
  'inboxkitten.com',
  'mailinator.com',
  'minuteinbox.com',
  'mohmal.com',
  'mytemp.email',
  'mytempmail.com',
  'nada.ltd',
  'pokemail.net',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

// Common typos for major providers
const COMMON_TYPOS: Record<string, string> = {
  'gmailcom': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
};

// RFC 5322 compliant regex for standard email syntax
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email: string): {
  valid: boolean;
  cleanEmail: string;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, cleanEmail: '', error: 'Vui lòng nhập địa chỉ email.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Strict regex syntax check (e.g. catches bichphan@gmailcom missing '.')
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return {
      valid: false,
      cleanEmail,
      error: 'Định dạng email không hợp lệ (Ví dụ đúng: tenban@gmail.com).',
    };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, cleanEmail, error: 'Định dạng email không hợp lệ.' };
  }

  const [, domain] = parts;

  // 2. Check common domain typos
  if (COMMON_TYPOS[domain]) {
    return {
      valid: false,
      cleanEmail,
      error: `Có vẻ bạn gõ nhầm tên miền email. Ý bạn là "@${COMMON_TYPOS[domain]}"?`,
    };
  }

  // 3. Check disposable / temporary email domains
  if (
    DISPOSABLE_EMAIL_DOMAINS.has(domain) ||
    domain.includes('tempmail') ||
    domain.includes('10minute') ||
    domain.includes('throwaway') ||
    domain.includes('fakemail') ||
    domain.includes('trashmail') ||
    domain.includes('mailinator') ||
    domain.includes('guerrillamail')
  ) {
    return {
      valid: false,
      cleanEmail,
      error:
        'Vui lòng không sử dụng email tạm thời/dùng 1 lần. Hãy dùng email thật (Gmail, Outlook, Yahoo...) để đảm bảo bạn có thể khôi phục tài khoản khi cần.',
    };
  }

  return { valid: true, cleanEmail };
}
