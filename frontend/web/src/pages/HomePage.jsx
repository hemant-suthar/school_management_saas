import { API_BASE_URL } from '../api/config';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">School Management SaaS</h1>
      <p className="text-muted-foreground">Web client</p>
      <p className="text-sm text-muted-foreground">API: {API_BASE_URL}</p>
    </main>
  );
}
