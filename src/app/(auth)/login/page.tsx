"use client";

import { useState, useEffect, Suspense } from "react";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle, Loader2 } from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    urlError === "OAuthSignin" || urlError === "OAuthCallback"
      ? "Google SSO authentication failed. Please try again or sign in with credentials."
      : urlError
        ? "Authentication failed. Please verify your credentials."
        : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);

  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setIsGoogleLoading(true);
    setError("");
    try {
      const res = await signIn("google-token", {
        credential: response.credential,
        redirect: false,
      });

      if (res?.error) {
        setError("Google authentication failed. Please verify your account access.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during Google sign in.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const initGoogleGsi = () => {
    if (typeof window === "undefined" || !(window as any).google?.accounts?.id) return;
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "140409062196-nrqjm53c68gjcrl496gp8lmui1jjaldf.apps.googleusercontent.com";

    try {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      const container = document.getElementById("google-gsi-btn");
      if (container) {
        container.innerHTML = "";
        (window as any).google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 384,
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
        setGsiReady(true);
      }
    } catch {
      // GSI initialization fallback
    }
  };

  useEffect(() => {
    initGoogleGsi();
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
      } else {
        await signIn("google", { callbackUrl: "/dashboard" });
      }
    } catch {
      setError("Unable to initiate Google sign in. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid username/email or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGsi}
      />
      <Card className="w-full max-w-md border-border bg-card/95 shadow-xl backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Zprofile Sign In
          </CardTitle>
          <CardDescription>
            Sign in with your enterprise Google account or credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Credentials Form First */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                required
                placeholder="firstname.lastname@zymr.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <Button
              className="h-11 w-full rounded-xl font-semibold shadow-xs"
              type="submit"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In with Password
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-[11px] font-semibold tracking-wider text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          {/* Google SSO Container (GSI JavaScript Origin Authentication) */}
          <div className="relative flex min-h-[44px] w-full flex-col items-center justify-center">
            {isGoogleLoading && (
              <div className="backdrop-blur-xs absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/80">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            <div
              id="google-gsi-btn"
              className="flex w-full justify-center overflow-hidden rounded-xl"
            />
            {/* Fallback button if GSI has not yet finished rendering */}
            {!gsiReady && (
              <Button
                type="button"
                variant="outline"
                className="relative flex h-11 w-full items-center justify-center gap-3 rounded-xl border-border bg-card font-semibold text-foreground shadow-xs transition-all hover:bg-muted/80"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                <GoogleIcon />
                <span>Sign in with Google</span>
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/40 py-4 text-xs text-muted-foreground">
          Zprofile Enterprise Talent Management Platform
        </CardFooter>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="ambient-bg flex min-h-screen items-center justify-center p-4">
      <PageTitle title="Sign In" />
      <Suspense
        fallback={
          <div className="flex h-96 w-full max-w-md items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
