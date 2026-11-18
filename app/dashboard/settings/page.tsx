import { AccountCard } from "@/components/settings/account-card";
import { AppearanceCard } from "@/components/settings/appearance-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { PreferencesCard } from "@/components/settings/preferences-card";
import { ProfileCard } from "@/components/settings/profile-card";
import { PageHeader } from "@/components/shared/page-header";
import { getSettingsData } from "@/lib/data/settings";

export default async function SettingsPage() {
  const { user, preferences, avatarUrl, provider } = await getSettingsData();

  return (
    <>
      <PageHeader title="Settings" />

      {/* One column on phones and tablets, two on wide screens so the page uses the full width */}
      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-4 px-4 py-5 sm:gap-6 sm:p-6 lg:p-7 xl:grid-cols-2">
        <div className="space-y-4 sm:space-y-6">
          <ProfileCard user={user} avatarUrl={avatarUrl} provider={provider} />
          <NotificationsCard initial={preferences} />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <AppearanceCard />
          <PreferencesCard initial={preferences} />
          <AccountCard provider={provider} />
        </div>
      </div>
    </>
  );
}