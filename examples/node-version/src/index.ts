interface User {
  roles?: {
    admin?: boolean;
  };
}

export function isAdmin(user?: User): boolean {
  return user?.roles?.admin ?? false;
}
