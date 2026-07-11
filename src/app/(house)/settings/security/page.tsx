import { PasswordForm } from "./PasswordForm";

export default function SettingsSecurityPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account security.</p>
      </div>

      <PasswordForm />
    </div>
  );
}
