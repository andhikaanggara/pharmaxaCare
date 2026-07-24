"use client";

import { useState, useTransition } from "react";
import { loginAction, guestLoginAction } from "./action";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Component
export default function LoginClient() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (formData: FormData) => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      }
    });
  };

  const handleGuestLogin = async () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await guestLoginAction();
      if (result?.error) {
        setErrorMsg(result.error);
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Pharmaxa Care Login
        </CardTitle>
        <CardDescription>
          Enter your clinical credentials to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 text-sm font-medium text-destructive bg-destructive/10 p-2 rounded text-center">
            {errorMsg}
          </div>
        )}

        <form action={handleLogin} className="grid gap-4">
          <Input
            name="email"
            type="email"
            placeholder="email@example.com"
            required
            disabled={isPending}
          />
          <Input
            name="password"
            type="password"
            placeholder="password"
            required
            disabled={isPending}
          />
          <Button
            type="submit"
            className="cursor-pointer w-full"
            disabled={isPending}
          >
            {isPending ? "Authenticating..." : "Login"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer hover:bg-secondary"
          onClick={handleGuestLogin}
          disabled={isPending}
        >
          {isPending ? "Connecting..." : "Login as Guest"}
        </Button>
      </CardContent>
    </Card>
  );
}
