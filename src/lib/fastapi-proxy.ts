import { createHmac } from 'node:crypto';
import { type AuthenticatedUser } from '@/lib/server-auth';

const apiInternalUrl = (process.env.ECCP_API_INTERNAL_URL || 'http://127.0.0.1:8100').replace(/\/$/, '');
const internalAuthSecret = process.env.ECCP_INTERNAL_AUTH_SECRET || 'eccp-local-internal-auth-only';

function encodedUser(user: AuthenticatedUser) {
  const payload = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    employeeId: user.employeeId,
    department: user.department,
    accessScope: user.accessScope,
    isSuperuser: user.isSuperuser,
    permissions: user.permissions,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function createFastApiHeaders(user: AuthenticatedUser, contentType: string | null) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const userHeader = encodedUser(user);
  const signature = createHmac('sha256', internalAuthSecret)
    .update(`${timestamp}.${userHeader}`)
    .digest('hex');
  const headers = new Headers({
    Accept: 'application/json',
    'X-ECCP-User': userHeader,
    'X-ECCP-Timestamp': timestamp,
    'X-ECCP-Signature': signature,
  });
  if (contentType) headers.set('Content-Type', contentType);
  return headers;
}

export function fastApiUrl(path: string[]) {
  return `${apiInternalUrl}/${path.map(segment => encodeURIComponent(segment)).join('/')}`;
}
