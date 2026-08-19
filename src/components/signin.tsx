import { forwardRef, useCallback, useEffect, useState, isValidElement } from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { SignInModal } from "@/components/SignInModal.tsx";

export interface SignInButtonProps
  extends
    Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  loadingText?: string;
  asChild?: boolean;
}

export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  (
    {
      onClick,
      disabled,
      showIcon = true,
      signInText = "Sign In",
      signOutText = "Sign Out",
      loadingText,
      className,
      variant,
      size,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const { isAuthenticated, removeUser, isLoading, error } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
      if (error) {
        toast.error("Login error", {
          description: error.message,
        });
        console.error("Login error", error);
      }
    }, [error]);

    const handleClick = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        try {
          if (isAuthenticated) {
            await removeUser();
            toast.success("Berhasil keluar dari akun");
            window.location.replace("/");
          } else {
            setModalOpen(true);
          }
        } catch (err) {
          console.error("Authentication error:", err);
          if (isAuthenticated) {
            window.location.replace("/");
          }
        }
      },
      [isAuthenticated, removeUser, onClick],
    );

    const isDisabled = disabled || isLoading;
    const defaultLoadingText = isAuthenticated
      ? "Signing Out..."
      : "Signing In...";
    const currentLoadingText = loadingText || defaultLoadingText;

    const buttonText = isLoading
      ? currentLoadingText
      : isAuthenticated
        ? signOutText
        : signInText;

    const icon = isLoading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : isAuthenticated ? (
      <LogOut className="size-4" />
    ) : (
      <LogIn className="size-4" />
    );

    return (
      <>
        <Button
          ref={ref}
          onClick={handleClick}
          disabled={isDisabled}
          variant={variant}
          size={size}
          className={className}
          asChild={asChild || isValidElement(children)}
          aria-label={
            isAuthenticated
              ? "Sign out of your account"
              : "Sign in to your account"
          }
          aria-describedby={error ? "auth-error" : undefined}
          {...props}
        >
          {children ? (
            children
          ) : (
            <>
              {showIcon && icon}
              {buttonText}
            </>
          )}
        </Button>
        <SignInModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  },
);

SignInButton.displayName = "SignInButton";
