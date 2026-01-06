"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { User, Mail, Lock, UserPlus, CheckCircle2, Eye, EyeOff, BarChart3, Loader2 } from "lucide-react";

export default function SignupPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error: signupError } = await (supabase.auth as any).signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      if (signupError) throw signupError;
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Signup failed");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 items-center justify-center p-8">
        <div className="w-full max-w-[480px] text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-transform hover:scale-110">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Verify your identity</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed px-4">
              Access request received. We've sent a secure verification link to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>.
              Please authorize your account to proceed.
            </p>
          </div>
          <Button asChild className="w-full h-14 text-base font-bold bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-white dark:hover:bg-zinc-200 dark:active:bg-zinc-300 text-white dark:text-zinc-900 rounded-2xl shadow-xl shadow-black/10 dark:shadow-white/5 hover:scale-[1.01] active:scale-95 transition-all">
            <Link href="/login">Return to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-[500px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-14 w-14 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black rounded-2xl shadow-xl">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Create account</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Initialize your agent profile to begin.</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 lg:p-10">
            <form onSubmit={handleSignup} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl font-semibold border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                  Full Name
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <Input
                    id="name"
                    placeholder="Name"
                    className="pl-11 h-14 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                  Email Id
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@agency.com"
                    className="pl-11 h-14 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Password
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-14 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Confirm
                  </Label>
                  <div className="relative group">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-14 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base font-bold bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-white dark:hover:bg-zinc-200 dark:active:bg-zinc-300 text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all duration-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Initializing Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create Agent Account
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-500 font-medium">
          Already verified?{" "}
          <Link href="/login" className="text-zinc-900 dark:text-white font-bold hover:underline">
            Login to your account
          </Link>
        </p>
      </div>
    </div>
  );
}