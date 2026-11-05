/**
 * Frontend Email Syntax & Disposable Email Validator
 */

const DISPOSABLE_DOMAINS = new Set([
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

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateClientEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Vui lòng nhập địa chỉ email' };
  }

  const clean = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(clean)) {
    return { valid: false, error: 'Định dạng email không hợp lệ (Ví dụ: tenban@gmail.com)' };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Định dạng email không hợp lệ' };
  }

  const domain = parts[1];

  if (COMMON_TYPOS[domain]) {
    return {
      valid: false,
      error: `Có vẻ bạn gõ nhầm tên miền email. Ý bạn là "@${COMMON_TYPOS[domain]}"?`,
    };
  }

  if (
    DISPOSABLE_DOMAINS.has(domain) ||
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
      error:
        'Vui lòng không sử dụng email tạm thời/dùng 1 lần. Hãy dùng email thật (Gmail, Outlook, Yahoo...) để đảm bảo bạn có thể khôi phục tài khoản khi cần.',
    };
  }

  return { valid: true };
}
