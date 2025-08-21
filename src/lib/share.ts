export function baseUrl() {
  return import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
}

export function testJoinLink(code: string) {
  const url = new URL("/join", baseUrl());
  url.searchParams.set("code", code);
  return url.toString();
}
