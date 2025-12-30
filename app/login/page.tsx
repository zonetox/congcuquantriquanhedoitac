import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In | Networking Dashboard",
  description: "Sign in to Networking Dashboard",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <LoginForm />
    </div>
  );
}

