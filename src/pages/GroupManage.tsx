import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetails, GroupMember } from "@/hooks/useGroupDetails";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  X, 
  Crown, 
  Shield, 
  User,
  MoreVertical,
  UserMinus,
  Save,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

const GroupManage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    group, 
    members, 
    loading, 
    error, 
    approveMember, 
    rejectMember, 
    promoteMember, 
    removeMember,
    updateGroup
  } = useGroupDetails(id);

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState(group?.name || "");
  const [groupDescription, setGroupDescription] = useState(group?.description || "");
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(group?.avatar_url || null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync group settings when loaded
  useState(() => {
    if (group) {
      setGroupName(group.name);
      setGroupDescription(group.description || "");
      setGroupAvatarUrl(group.avatar_url);
    }
  });

  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  const handleSaveSettings = async () => {
    if (!groupName.trim()) {
      toast({ title: "Errore", description: "Il nome del gruppo è obbligatorio", variant: "destructive" });
      return;
    }

    setSavingSettings(true);
    const { error } = await updateGroup({
      name: groupName.trim(),
      description: groupDescription.trim() || null,
    });
    setSavingSettings(false);

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Impostazioni salvate!" });
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    const { error } = await approveMember(userId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Membro approvato!" });

      // Create notification for approved member
      await createNotification({
        userId: userId,
        type: "group_request_approved",
        title: "Richiesta approvata!",
        message: `Sei stato accettato nel gruppo "${group!.name}"`,
        metadata: {
          group_id: group!.id,
          group_name: group!.name,
        },
      });

      // Send email notification
      try {
        await supabase.functions.invoke("send-group-notification", {
          body: {
            type: "request_approved",
            groupId: group!.id,
            userId: userId,
          },
        });
      } catch (emailError) {
        console.error("Failed to send group email notification:", emailError);
      }
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    const { error } = await rejectMember(userId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Richiesta rifiutata" });

      // Create in-app notification for rejected member
      await createNotification({
        userId: userId,
        type: "group_request_approved", // reuse closest type - no "rejected" enum value exists
        title: "Richiesta non accettata",
        message: `La tua richiesta per il gruppo "${group!.name}" non è stata accettata`,
        metadata: {
          group_id: group!.id,
          group_name: group!.name,
        },
      });

      // Send email notification for rejection
      try {
        await supabase.functions.invoke("send-group-notification", {
          body: {
            type: "request_rejected",
            groupId: group!.id,
            userId: userId,
          },
        });
      } catch (emailError) {
        console.error("Failed to send group rejection email:", emailError);
      }
    }
  };

  const handlePromote = async (userId: string, role: 'owner' | 'admin' | 'member') => {
    setProcessingIds(prev => new Set(prev).add(userId));
    const { error } = await promoteMember(userId, role);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      const roleLabel = role === 'owner' ? 'proprietario' : role === 'admin' ? 'admin' : 'membro';
      toast({ title: `Ruolo aggiornato a ${roleLabel}` });
    }
  };

  const handleRemove = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    const { error } = await removeMember(userId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Membro rimosso" });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-warning" />;
      case 'admin': return <Shield className="w-4 h-4 text-primary" />;
      default: return <User className="w-4 h-4 text-muted" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietario';
      case 'admin': return 'Admin';
      default: return 'Membro';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center py-12">
          <p className="text-muted">Gruppo non trovato</p>
          <Button variant="outline" onClick={() => navigate("/groups")} className="mt-4">
            Torna ai gruppi
          </Button>
        </div>
      </div>
    );
  }

  if (!group.is_owner) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center py-12">
          <p className="text-muted">Non hai i permessi per gestire questo gruppo</p>
          <Button variant="outline" onClick={() => navigate(`/groups/${id}`)} className="mt-4">
            Torna al gruppo
          </Button>
        </div>
      </div>
    );
  }

  const MemberCard = ({ member, showActions = true }: { member: GroupMember; showActions?: boolean }) => {
    const isProcessing = processingIds.has(member.user_id);
    const isCurrentUser = member.user_id === user?.id;
    const isCreator = member.user_id === group.created_by;
    
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-white/8">
        <Avatar className="w-10 h-10">
          <AvatarImage src={member.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-white/10 text-primary">
            {member.profile?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-card-foreground truncate">
              {member.profile?.name || 'Utente'}
            </span>
            {getRoleIcon(member.role)}
          </div>
          <span className="text-xs text-white/55">{getRoleLabel(member.role)}</span>
        </div>

        {showActions && !isCurrentUser && !isCreator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {member.role !== 'owner' && (
                <DropdownMenuItem onClick={() => handlePromote(member.user_id, 'owner')}>
                  <Crown className="w-4 h-4 mr-2 text-warning" />
                  Rendi proprietario
                </DropdownMenuItem>
              )}
              {member.role !== 'admin' && member.role !== 'owner' && (
                <DropdownMenuItem onClick={() => handlePromote(member.user_id, 'admin')}>
                  <Shield className="w-4 h-4 mr-2 text-primary" />
                  Rendi admin
                </DropdownMenuItem>
              )}
              {member.role !== 'member' && (
                <DropdownMenuItem onClick={() => handlePromote(member.user_id, 'member')}>
                  <User className="w-4 h-4 mr-2" />
                  Rimuovi ruolo
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleRemove(member.user_id)}
                className="text-destructive"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Rimuovi dal gruppo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {isCreator && (
          <span className="text-xs text-white/55 px-2 py-1 bg-white/10 rounded">Creatore</span>
        )}
      </div>
    );
  };

  const PendingCard = ({ member }: { member: GroupMember }) => {
    const isProcessing = processingIds.has(member.user_id);
    
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-warning/30">
        <Avatar className="w-10 h-10">
          <AvatarImage src={member.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-warning/10 text-warning">
            {member.profile?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <span className="font-medium text-card-foreground truncate block">
            {member.profile?.name || 'Utente'}
          </span>
          <span className="text-xs text-white/55">Richiesta in attesa</span>
        </div>

        <div className="flex gap-2">
          <Button 
            size="icon" 
            variant="outline"
            className="h-8 w-8 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => handleReject(member.user_id)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </Button>
          <Button 
            size="icon" 
            className="h-8 w-8"
            onClick={() => handleApprove(member.user_id)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button 
          onClick={() => navigate(`/groups/${id}`)} 
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-semibold text-lg">Gestisci gruppo</h1>
          <p className="text-xs text-muted">{group.name}</p>
        </div>
      </header>

      <div className="px-4 py-4 max-w-[430px] mx-auto">
        <Tabs defaultValue={pendingMembers.length > 0 ? "pending" : "members"}>
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="relative">
              Richieste
              {pendingMembers.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                  {pendingMembers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="members">
              Membri ({approvedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-1" />
              Impostazioni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {pendingMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">Nessuna richiesta in attesa</p>
              </div>
            ) : (
              pendingMembers.map(member => (
                <PendingCard key={member.id} member={member} />
              ))
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-3">
            {approvedMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">Nessun membro</p>
              </div>
            ) : (
              approvedMembers
                .sort((a, b) => {
                  // Sort by role: owner > admin > member
                  const roleOrder = { owner: 0, admin: 1, member: 2 };
                  return (roleOrder[a.role as keyof typeof roleOrder] || 2) - 
                         (roleOrder[b.role as keyof typeof roleOrder] || 2);
                })
                .map(member => (
                  <MemberCard key={member.id} member={member} />
                ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="bg-card rounded-xl border border-white/8 p-4">
              {/* Group Avatar Upload */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <AvatarUpload
                  currentUrl={groupAvatarUrl}
                  name={group?.name || "G"}
                  uploadPath={`groups/${id}`}
                  onUpload={async (url) => {
                    setGroupAvatarUrl(url);
                    await updateGroup({ avatar_url: url });
                  }}
                  size="lg"
                />
                <p className="text-xs text-white/55">Tocca per cambiare foto</p>
              </div>

              {/* Group Name */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="groupName">Nome del gruppo</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nome del gruppo"
                />
              </div>

              {/* Group Description */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="groupDesc">Descrizione</Label>
                <Textarea
                  id="groupDesc"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Descrivi il tuo gruppo..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salva impostazioni
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupManage;