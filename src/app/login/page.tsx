"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, Eye, EyeOff, BarChart3, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, loading: authLoading, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || e?.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-14 w-14 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black rounded-2xl shadow-xl">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Welcome back</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Please enter your details to sign in.</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 lg:p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl font-semibold border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                  Email-ID
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

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        setError("Please enter your email address first.");
                        return;
                      }
                      setLoading(true);
                      try {
                        await resetPassword(email);
                        setError(null);
                        alert("Password reset email sent!");
                      } catch (e: any) {
                        setError(e.message || "Failed to send reset email.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-xs font-bold text-zinc-900 dark:text-white hover:underline"
                  >
                    Forgot key?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-11 pr-12 h-14 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-medium focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base font-bold bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-white dark:hover:bg-zinc-200 dark:active:bg-zinc-300 text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging-in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Login to SuperLeads
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-500 font-medium">
          Don't have a account?{" "}
          <Link href="/signup" className="text-zinc-900 dark:text-white font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}