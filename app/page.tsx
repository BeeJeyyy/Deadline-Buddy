
"use client";

import Image from "next/image";
import Google from "@/components/assets/google_logo.png";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const signInWithGoogle = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign-in failed:", error.message);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white min-[900px]:flex-row">

      {/* LEFT / TOP SECTION - BLACK */}
      <section className="flex w-full flex-col justify-center bg-black px-6 py-14 text-white sm:px-10 md:px-16 min-[900px]:min-h-screen min-[900px]:w-1/2 min-[900px]:px-12 min-[1200px]:px-20">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <Check size={20} strokeWidth={3} />
          <p className="text-xl font-bold sm:text-2xl">
            Deadline Buddy
          </p>
        </div>

        {/* Hero Heading */}
        <div className="mt-10 sm:mt-12">
          <h1 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Group projects, finally under control.
          </h1>
        </div>

        {/* Features */}
        <div className="mt-8 flex flex-col gap-5 text-sm text-gray-300 sm:text-base">

          <div className="flex items-start gap-3">
            <Check size={19} className="mt-0.5 shrink-0" />
            <span>
              Split work into clear tasks with owners and due dates.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Check size={19} className="mt-0.5 shrink-0" />
            <span>
              See every deadline across all your groups.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Check size={19} className="mt-0.5 shrink-0" />
            <span>
              Invite groupmates with a single link.
            </span>
          </div>

        </div>
      </section>

      {/* RIGHT / BOTTOM SECTION - WHITE */}
      <section className="flex w-full flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-black sm:px-10 min-[900px]:min-h-screen min-[900px]:w-1/2 min-[900px]:flex-none min-[900px]:px-12">

        <div className="flex w-full max-w-sm flex-col items-center">

          {/* Welcome Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black">
            <Check color="white" size={26} strokeWidth={2.5} />
          </div>

          {/* Welcome Heading */}
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back
          </h1>

          {/* Description */}
          <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-gray-500 sm:text-base">
            Sign in with your Google account to open your groups.
          </p>

          {/* Google Sign In */}
          <Button
            className="mt-8 h-14 w-full gap-3 text-sm font-semibold sm:text-base"
            onClick={signInWithGoogle}
          >
            <Image
              src={Google}
              alt="Google logo"
              width={22}
              height={22}
            />
            Continue with Google
          </Button>

          {/* Footer */}
          <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-gray-500 sm:text-sm">
            No passwords to remember. We only use your name and email to set up your workspace.
          </p>

        </div>
      </section>

    </main>
  );
}
