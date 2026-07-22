const djangoInternalUrl = (process.env.DJANGO_INTERNAL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface AuthenticatedUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
  employeeId: string;
  department: string;
  section: string;
  team: string;
  jobTitle: string;
  organizationLabel: string;
  accessScope: string;
  mustChangePassword: boolean;
  permissions: string[];
}

interface DjangoSessionResponse {
  authenticated?: boolean;
  user?: AuthenticatedUser;
}

export type AuthenticationResult =
  | { status: 'authenticated'; user: AuthenticatedUser }
  | { status: 'anonymous' | 'unavailable'; user: null };

export async function getAuthentication(request: Request): Promise<AuthenticationResult> {
  const cookie = request.headers.get('cookie');
  if (!cookie) return { status: 'anonymous', user: null };

  try {
    const response = await fetch(`${djangoInternalUrl}/api/auth/session/`, {
      headers: { cookie },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (response.status === 401) return { status: 'anonymous', user: null };
    if (!response.ok) return { status: 'unavailable', user: null };
    const data = await response.json() as DjangoSessionResponse;
    return data.authenticated && data.user
      ? { status: 'authenticated', user: data.user }
      : { status: 'anonymous', user: null };
  } catch {
    return { status: 'unavailable', user: null };
  }
}
