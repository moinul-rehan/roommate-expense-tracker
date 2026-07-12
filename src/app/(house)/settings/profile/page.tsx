import { getCurrentProfile } from "@/lib/data/dal";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal info.</p>
      </div>

      <ProfileForm
        key={[profile.first_name, profile.last_name, profile.gender, profile.hometown, profile.mobile_number, profile.address].join("|")}
        profile={profile}
      />
    </div>
  );
}
