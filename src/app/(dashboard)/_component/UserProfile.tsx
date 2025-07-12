import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserEditProfile from "./UserEditProfile";
import { currentUser } from "@/lib/auth";
import { getUserById } from "@/components/auth/user";


export default async function UserProfile() {
  const user = await currentUser();
  const extendedUser = user ? await getUserById(user.id) : null;
  
  return (
    <Dialog>
      <DialogTrigger className="w-full text-left px-2 py-1 cursor-pointer hover:bg-muted-foreground/5">
        Profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Edit your profile details here.</DialogDescription>
        </DialogHeader>

        {/**user profile display and editor */}
        <UserEditProfile
          firstName={extendedUser?.firstName || undefined}
          lastName={extendedUser?.lastName || undefined}
          currency={extendedUser?.currency || undefined}
          email={user?.email || undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
