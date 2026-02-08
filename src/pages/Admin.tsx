import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin, CertificationRequest, AdminGroup } from "@/hooks/useAdmin";
import { AppRole } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import {
  ChevronLeft,
  Shield,
  Clock,
  Users,
  Check,
  X,
  FileText,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<AppRole, string> = {
  regular: "Utente",
  certified: "Certificato",
  instructor: "Istruttore",
  admin: "Admin",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "In attesa", color: "text-warning" },
  approved: { label: "Approvato", color: "text-success" },
  rejected: { label: "Rifiutato", color: "text-destructive" },
};

const groupTypeLabels: Record<string, string> = {
  community_spontanea: "Gruppo spontaneo",
  scuola_club: "Scuola/Club",
};

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isAdmin,
    pendingCertifications,
    allUsers,
    allGroups,
    loading,
    approveCertification,
    rejectCertification,
    updateUserRole,
    toggleGroupVerification,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<"pending" | "users" | "groups">("pending");
  const [selectedCert, setSelectedCert] = useState<CertificationRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"certified" | "instructor">("certified");
  const [rejectReason, setRejectReason] = useState("");
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
        title: "Accesso negato",
        description: "Non hai i permessi per accedere a questa pagina",
        variant: "destructive",
      });
      navigate("/community");
    }
  }, [loading, isAdmin, navigate, toast]);

  const handleApprove = async () => {
    if (!selectedCert) return;
    setProcessing(true);
    const { error } = await approveCertification(selectedCert.id, selectedRole);
    setProcessing(false);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile approvare la certificazione",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Certificazione approvata",
        description: `L'utente è stato promosso a ${roleLabels[selectedRole]}`,
      });
      setApproveDialogOpen(false);
      setSelectedCert(null);
    }
  };

  const handleReject = async () => {
    if (!selectedCert) return;
    setProcessing(true);
    const { error } = await rejectCertification(selectedCert.id, rejectReason);
    setProcessing(false);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile rifiutare la certificazione",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Certificazione rifiutata",
        description: "L'utente è stato notificato",
      });
      setRejectDialogOpen(false);
      setSelectedCert(null);
      setRejectReason("");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    const { error } = await updateUserRole(selectedUser.user_id, newUserRole);
    setProcessing(false);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il ruolo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ruolo aggiornato",
        description: `${selectedUser.name} è ora ${roleLabels[newUserRole]}`,
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const getSignedUrl = async (url: string) => {
    if (!url) return null;
    // Extract path from URL
    const path = url.split("/").slice(-2).join("/");
    const { data } = await supabase.storage
      .from("certifications")
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const handleToggleVerification = async (group: AdminGroup) => {
    setTogglingGroupId(group.id);
    const { error } = await toggleGroupVerification(group.id, !group.verified);
    setTogglingGroupId(null);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato di verifica",
        variant: "destructive",
      });
    } else {
      toast({
        title: group.verified ? "Verifica rimossa" : "Gruppo verificato",
        description: group.verified 
          ? `${group.name} non è più verificato` 
          : `${group.name} è ora un partner verificato`,
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
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-muted"
            }`}
          >
            <Clock className="w-4 h-4" />
            In attesa ({pendingCertifications.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted"
            }`}
          >
            <Users className="w-4 h-4" />
            Utenti ({allUsers.length})
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
            Gruppi ({allGroups.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-[600px] mx-auto">
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingCertifications.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessuna certificazione in attesa</p>
              </div>
            ) : (
              pendingCertifications.map((cert) => (
                <div key={cert.id} className="bg-card rounded-2xl border border-white/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary font-bold">
                      {cert.profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">{cert.profile.name}</h3>
                      <p className="text-sm text-white/55">{cert.profile.email}</p>
                    </div>
                    <span className={`text-xs font-medium ${statusLabels.pending.color}`}>
                      {statusLabels.pending.label}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-white/10 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/55">Agenzia:</span>
                      <span className="font-medium text-card-foreground">{cert.agency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/55">Livello:</span>
                      <span className="font-medium text-card-foreground">{cert.level}</span>
                    </div>
                    {cert.certification_id && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/55">ID:</span>
                        <span className="font-medium text-card-foreground">{cert.certification_id}</span>
                      </div>
                    )}
                    {cert.document_url && (
                      <button
                        onClick={async () => {
                          const signedUrl = await getSignedUrl(cert.document_url!);
                          if (signedUrl) window.open(signedUrl, "_blank");
                        }}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        Visualizza documento
                      </button>
                    )}
                    <div className="text-xs text-white/55 pt-1">
                      Inviato: {new Date(cert.submitted_at).toLocaleDateString("it-IT")}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCert(cert);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <X className="w-4 h-4" />
                      Rifiuta
                    </Button>
                    <Button
                      variant="primaryGradient"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCert(cert);
                        setApproveDialogOpen(true);
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Approva
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "groups" && (
          <div className="space-y-3">
            {allGroups.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun gruppo trovato</p>
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
                        <span>{groupTypeLabels[group.group_type] || group.group_type}</span>
                        <span>•</span>
                        <span>{group.member_count} membri</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/55">
                        {group.verified ? "Verificato" : "Non verificato"}
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
                  {roleLabels[user.role]}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approva certificazione</DialogTitle>
            <DialogDescription>
              Seleziona il ruolo da assegnare all'utente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certified">Apneista Certificato</SelectItem>
                  <SelectItem value="instructor">Istruttore</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta certificazione</DialogTitle>
            <DialogDescription>
              Indica il motivo del rifiuto (opzionale). L'utente potrà inviare nuovamente la richiesta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo (opzionale)</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="es. Documento non leggibile"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rifiuta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Update Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica ruolo</DialogTitle>
            <DialogDescription>
              Cambia il ruolo di {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Utente</SelectItem>
                  <SelectItem value="certified">Apneista Certificato</SelectItem>
                  <SelectItem value="instructor">Istruttore</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateRole} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
