import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-8">inki</h1>
      <div className="space-x-4">
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
        <Link href="/signup" className="btn-secondary">
          Sign Up
        </Link>
      </div>
    </main>
  );
}
