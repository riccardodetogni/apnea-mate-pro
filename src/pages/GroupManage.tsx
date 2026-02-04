import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetails, GroupMember } from "@/hooks/useGroupDetails";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  X, 
  Crown, 
  Shield, 
  User,
  MoreVertical,
  UserMinus
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
    removeMember 
  } = useGroupDetails(id);

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

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
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
        <Avatar className="w-10 h-10">
          <AvatarImage src={member.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {member.profile?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {member.profile?.name || 'Utente'}
            </span>
            {getRoleIcon(member.role)}
          </div>
          <span className="text-xs text-muted">{getRoleLabel(member.role)}</span>
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
          <span className="text-xs text-muted px-2 py-1 bg-muted/30 rounded">Creatore</span>
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
          <span className="font-medium text-foreground truncate block">
            {member.profile?.name || 'Utente'}
          </span>
          <span className="text-xs text-muted">Richiesta in attesa</span>
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
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold text-lg">Gestisci gruppo</h1>
          <p className="text-xs text-muted">{group.name}</p>
        </div>
      </header>

      <div className="px-4 py-4 max-w-[430px] mx-auto">
        <Tabs defaultValue={pendingMembers.length > 0 ? "pending" : "members"}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
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
        </Tabs>
      </div>
    </div>
  );
};

export default GroupManage;