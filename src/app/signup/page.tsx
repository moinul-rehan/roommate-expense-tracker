import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <div className="flex w-full flex-col items-center justify-center gap-8 px-6 py-12 lg:w-[45%] lg:px-16">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="text-2xl font-bold tracking-tight text-foreground">Cottage</div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Start a Cottage</h1>
            <p className="text-sm text-muted-foreground">
              Sign up for a new Cottage — you&apos;ll be its admin.
            </p>
          </div>
          <SignupForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in as a Cottage member
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[55%] lg:flex-col lg:justify-end lg:p-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 20% 10%, #4A82E0 0%, #1358D0 45%, #0A2C68 100%)",
          }}
        />
        <div className="relative flex flex-col gap-6 text-white">
          <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.5 0L3 5.5V17H0V4.5L8.5 0ZM19 0L13.5 5.5V17H10.5V4.5L19 0Z"
              fill="white"
              fillOpacity="0.9"
            />
          </svg>
          <p className="max-w-md text-3xl font-semibold tracking-tight">
            Set it up once — meals, utilities and settle-ups take care of themselves after that.
          </p>
          <div className="flex w-fit items-center justify-center rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md">
            Cottage — Shared-house expense manager
          </div>
        </div>
      </div>
    </div>
  );
}
