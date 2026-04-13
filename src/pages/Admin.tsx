import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin, AdminGroup } from "@/hooks/useAdmin";
import { AppRole } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import {
  ChevronLeft,
  Shield,
  Users,
  Award,
  Loader2,
  UsersRound,
  BadgeCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const getRoleLabel = (role: AppRole): string => {
  switch (role) {
    case "regular": return t("user");
    case "certified": return t("certifiedFreediverRole");
    case "instructor": return t("instructor");
    case "admin": return "Admin";
  }
};

const getGroupTypeLabel = (type: string): string => {
  switch (type) {
    case "community_spontanea": return t("communityGroupType");
    case "scuola_club": return t("schoolClubGroupType");
    default: return type;
  }
};

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isAdmin,
    allUsers,
    allGroups,
    loading,
    updateUserRole,
    toggleGroupVerification,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [processing, setProcessing] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof allUsers[0] | null>(null);
  const [newUserRole, setNewUserRole] = useState<AppRole>("regular");
  const [togglingGroupId, setTogglingGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: t("accessDenied"),
        description: t("noPermissionForPage"),
        variant: "destructive",
      });
      navigate("/community");
    }
  }, [loading, isAdmin, navigate, toast]);

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    const { error } = await updateUserRole(selectedUser.user_id, newUserRole);
    setProcessing(false);
    
    if (error) {
      toast({
        title: t("error"),
        description: t("cannotUpdateRole"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("roleUpdated"),
        description: `${selectedUser.name} → ${getRoleLabel(newUserRole)}`,
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleVerification = async (group: AdminGroup) => {
    setTogglingGroupId(group.id);
    const { error } = await toggleGroupVerification(group.id, !group.verified);
    setTogglingGroupId(null);
    
    if (error) {
      toast({
        title: t("error"),
        description: t("cannotUpdateVerification"),
        variant: "destructive",
      });
    } else {
      toast({
        title: group.verified ? t("verificationRemoved") : t("groupVerified"),
        description: group.verified 
          ? `${group.name} ${t("noLongerVerified")}` 
          : `${group.name} ${t("nowVerifiedPartner")}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="font-semibold text-lg">Admin Dashboard</h1>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted"
            }`}
          >
            <Users className="w-4 h-4" />
            {t("users")} ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "groups"
                ? "border-primary text-primary"
                : "border-transparent text-muted"
            }`}
          >
            <UsersRound className="w-4 h-4" />
            {t("groups")} ({allGroups.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-[600px] mx-auto">
        {activeTab === "groups" && (
          <div className="space-y-3">
            {allGroups.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("noGroupFound")}</p>
              </div>
            ) : (
              allGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-card rounded-xl border border-white/8 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary">
                      <UsersRound className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-card-foreground truncate">{group.name}</h3>
                        {group.verified && (
                          <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-white/55 truncate">{group.location}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/55">
                        <span>{getGroupTypeLabel(group.group_type)}</span>
                        <span>•</span>
                        <span>{group.member_count} {t("members")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/55">
                        {group.verified ? t("verified") : t("notVerified")}
                      </span>
                      <Switch
                        checked={group.verified}
                        onCheckedChange={() => handleToggleVerification(group)}
                        disabled={togglingGroupId === group.id}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-3">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="bg-card rounded-xl border border-white/8 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-card-foreground truncate">{user.name}</h3>
                  <p className="text-sm text-white/55 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setNewUserRole(user.role);
                    setRoleDialogOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium text-card-foreground hover:bg-white/20 transition-colors"
                >
                  {user.role === "certified" || user.role === "instructor" ? (
                    <Award className="w-3.5 h-3.5 text-primary" />
                  ) : null}
                  {getRoleLabel(user.role)}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Update Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editRole")}</DialogTitle>
            <DialogDescription>
              {t("changeRoleOf")} {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("role")}</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">{t("user")}</SelectItem>
                  <SelectItem value="certified">{t("certifiedFreediverRole")}</SelectItem>
                  <SelectItem value="instructor">{t("instructor")}</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdateRole} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;