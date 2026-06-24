import { useState, type SyntheticEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { refreshUser, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await loginUser({ email, password });
      const token = res?.token;

      if (!token) {
        setError("Login failed. Missing auth token.");
        return;
      }

      localStorage.setItem("token", token);
      // refresh auth context
      try {
        await refreshUser();
      } catch {}
      navigate("/map");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect authenticated users via effect to avoid conditional hook returns
  useEffect(() => {
    if (isAuthenticated) navigate("/map");
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-start sm:items-center justify-center min-h-[calc(100vh-6rem)] py-6 sm:py-0">
      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-2xl shadow-xl mx-0 sm:mx-4">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Login</h2>

        {error && (
          <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {password.length > 0 && password.length < 6 && (
              <p className="text-xs text-amber-400/80 mt-1.5 ml-1">Password is usually at least 6 characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-emerald-500 text-slate-950 py-3 rounded-xl hover:bg-emerald-400 font-bold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Login
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-400">
          {"Don't have an account? "}
          <Link to="/register" className="text-emerald-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
