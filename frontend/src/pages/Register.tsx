import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { refreshUser, isAuthenticated } = useAuth();

  // Form state (declare hooks before any early returns)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  // Password strength calculator
  const getPasswordStrength = (
    pass: string,
  ): { level: string; color: string; width: string } => {
    if (pass.length === 0) return { level: "", color: "", width: "0%" };

    let score = 0;

    // Length checks
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { level: "Weak", color: "bg-red-500", width: "25%" };
    if (score <= 4)
      return { level: "Fair", color: "bg-yellow-500", width: "50%" };
    if (score <= 5)
      return { level: "Good", color: "bg-blue-500", width: "75%" };
    return { level: "Strong", color: "bg-green-500", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(password);

  // Redirect authenticated users via effect to avoid conditional hook returns
  useEffect(() => {
    if (isAuthenticated) navigate("/map");
  }, [isAuthenticated, navigate]);

  // Inline validation
  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };

    switch (field) {
      case "name":
        if (!value.trim()) {
          errors.name = "Name is required.";
        } else if (value.trim().length < 2) {
          errors.name = "Name must be at least 2 characters.";
        } else {
          delete errors.name;
        }
        break;

      case "email":
        if (!value) {
          errors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address.";
        } else {
          delete errors.email;
        }
        break;

      case "password":
        if (!value) {
          errors.password = "Password is required.";
        } else if (value.length < 6) {
          errors.password = "Password must be at least 6 characters.";
        } else {
          delete errors.password;
        }
        // Also re-validate confirm password if it has a value
        if (confirmPassword && value !== confirmPassword) {
          errors.confirmPassword = "Passwords do not match.";
        } else if (confirmPassword) {
          delete errors.confirmPassword;
        }
        break;

      case "confirmPassword":
        if (!value) {
          errors.confirmPassword = "Please confirm your password.";
        } else if (value !== password) {
          errors.confirmPassword = "Passwords do not match.";
        } else {
          delete errors.confirmPassword;
        }
        break;
    }

    setFieldErrors(errors);
  };

  // Full form validation before submit
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = "Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const token = res?.token;
      if (!token) {
        setError("Registration failed. Missing auth token.");
        return;
      }

      localStorage.setItem("token", token);
      try {
        await refreshUser();
      } catch {}
      navigate("/map");
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow text-gray-800">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        {/* Server Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 bg-white ${
                fieldErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateField("name", e.target.value);
              }}
              onBlur={(e) => validateField("name", e.target.value)}
              placeholder="John Doe"
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Email
            </label>
            <input
              type="email"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 bg-white ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateField("email", e.target.value);
              }}
              onBlur={(e) => validateField("email", e.target.value)}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 bg-white ${
                fieldErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField("password", e.target.value);
              }}
              onBlur={(e) => validateField("password", e.target.value)}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.password}
              </p>
            )}

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>
                <p
                  className={`text-xs mt-1 ${
                    passwordStrength.level === "Weak"
                      ? "text-red-500"
                      : passwordStrength.level === "Fair"
                        ? "text-yellow-600"
                        : passwordStrength.level === "Good"
                          ? "text-blue-500"
                          : "text-green-500"
                  }`}
                >
                  Password strength: {passwordStrength.level}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 bg-white ${
                fieldErrors.confirmPassword
                  ? "border-red-500"
                  : confirmPassword && password === confirmPassword
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateField("confirmPassword", e.target.value);
              }}
              onBlur={(e) => validateField("confirmPassword", e.target.value)}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
            {confirmPassword &&
              password === confirmPassword &&
              !fieldErrors.confirmPassword && (
                <p className="text-green-500 text-xs mt-1">Passwords match ✓</p>
              )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-green-600 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
