import { useClerk, useUser } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, Folder, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const clerk = useClerk();
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-12 items-center gap-3 rounded-md border border-sidebar-border bg-sidebar px-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Button asChild className="w-full" variant="outline">
        <Link params={{ _splat: "" }} to="/sign-in/$">
          Sign in
        </Link>
      </Button>
    );
  }

  const username = user.username ?? "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-12 w-full justify-start gap-3 px-3"
          type="button"
          variant="outline"
        >
          <Avatar>
            <AvatarImage alt={username} src={user.imageUrl} />
            <AvatarFallback>{initialsFor(username)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">
              {username}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Account
            </span>
          </span>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" side="top">
        <DropdownMenuLabel className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarImage alt={username} src={user.imageUrl} />
            <AvatarFallback>{initialsFor(username)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {username}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/user/account">
            <User />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/user/collections">
            <Folder />
            Collections
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void clerk.signOut({ redirectUrl: "/" });
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initialsFor(value: string | null | undefined) {
  const first = value?.trim().charAt(0).toUpperCase();
  return first || "U";
}
