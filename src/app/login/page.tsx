import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">House Expenses</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sign in with the account your admin created for you.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
