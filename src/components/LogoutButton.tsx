import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LogoutButtonProps extends ButtonProps {
  children?: ReactNode;
  onCompleted?: () => void;
}

export function LogoutButton({ children = "Logout", onCompleted, ...buttonProps }: LogoutButtonProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    try {
      await logout();
      toast({ title: "Logged out successfully" });
      onCompleted?.();
    } catch {
      toast({ title: "Logged out locally", description: "Your session could not be fully closed with the server.", variant: "destructive" });
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...buttonProps}>{children}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out of InternshipConnect?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm Logout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
