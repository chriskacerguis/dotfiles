import { CircleAlert, Clock, Lock, SearchX, WifiOff } from 'lucide-react';

/**
 * What to tell a person about a failed request, by what actually happened. One
 * place, so a 403 reads the same in a panel and on a full page.
 *
 * The API's own message is used whenever it says something specific — it is
 * written for the reader ("This queue is not one your account can see."). The
 * one it never is: the generic sentence the server sends for a 5xx, which says
 * nothing a person can act on, so it is replaced with what they can do.
 */
const GENERIC_SERVER_MESSAGE = 'Internal server error';

export function describeError(error) {
  const status = error?.status ?? 0;
  const message = error?.message && error.message !== GENERIC_SERVER_MESSAGE ? error.message : null;

  if (status === 401) {
    return {
      kind: 'unauthorized',
      icon: Clock,
      title: 'You are signed out',
      description: 'Sign in to see this page. You will be brought back here afterwards.',
    };
  }
  if (status === 403) {
    return {
      kind: 'forbidden',
      icon: Lock,
      title: 'You do not have access to this',
      description:
        message ||
        'Your account is not allowed to see this. If you need it for your work, an administrator can check your access.',
    };
  }
  if (status === 404) {
    return {
      kind: 'notFound',
      icon: SearchX,
      title: 'This could not be found',
      description: message || 'It may have been removed, or the link that brought you here may be out of date.',
    };
  }
  // No status: fetch itself failed, so the request never reached the server.
  if (status === 0) {
    return {
      kind: 'unreachable',
      icon: WifiOff,
      title: 'The server could not be reached',
      description: 'Check your network connection, then try again.',
    };
  }
  return {
    kind: 'failed',
    icon: CircleAlert,
    title: 'This could not be loaded',
    description:
      message ||
      'The server hit a problem it did not expect. Trying again usually works; if it keeps happening, report it so someone can look into it.',
  };
}
