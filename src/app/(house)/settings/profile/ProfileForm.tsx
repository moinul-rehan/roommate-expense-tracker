"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { updateProfile, updateAvatarUrl } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFullName } from "@/lib/data/display-name";

type ProfileInfo = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  gender: "male" | "female" | "other" | null;
  hometown: string | null;
  mobile_number: string | null;
  address: string | null;
};

export function ProfileForm({ profile }: { profile: ProfileInfo }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUploadTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploadError("Could not upload image.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    startUploadTransition(() => updateAvatarUrl(publicUrl));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-16">
            <AvatarImage src={avatarUrl ?? undefined} alt={getFullName(profile)} />
            <AvatarFallback className="text-base">
              {profile.first_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{getFullName(profile)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" defaultValue={profile.first_name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" defaultValue={profile.last_name ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email ?? ""} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Gender</Label>
              <Select name="gender" defaultValue={profile.gender ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hometown">Hometown</Label>
              <Input id="hometown" name="hometown" defaultValue={profile.hometown ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mobile_number">Mobile number (BD)</Label>
              <Input
                id="mobile_number"
                name="mobile_number"
                placeholder="01712345678"
                defaultValue={profile.mobile_number ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" defaultValue={profile.address ?? ""} placeholder="Optional" />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
