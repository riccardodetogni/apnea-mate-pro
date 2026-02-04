// Internationalization support for Apnea Mate
// Primary: Italian, Secondary: English

type TranslationKey = keyof typeof translations.it;

const translations = {
  it: {
    // App
    appName: "Apnea Mate",
    
    // Navigation
    navCommunity: "Community",
    navSpot: "Spot",
    navCreate: "Crea",
    navGroups: "Gruppi",
    navTraining: "Training",
    
    // Community page
    community: "Community",
    newSession: "+ Nuova sessione",
    searchPlaceholder: "Cerca spot, sessioni, persone, gruppi",
    nearYou: "Vicino a te",
    sessionsNearYou: "Sessioni vicino a te",
    fromPeopleYouFollow: "Dalle persone che segui",
    groupsNearYou: "Gruppi vicino a te",
    viewAll: "Vedi tutte",
    viewAllGroups: "Vedi tutti",
    join: "Unisciti",
    joinGroup: "Unisciti al gruppo",
    details: "Dettagli",
    bookSpot: "Prenota posto",
    spots: "posti",
    members: "membri",
    instructor: "Istruttore",
    instructorF: "Istruttrice",
    user: "Utente",
    noMoreSessions: "Nessuna altra sessione creata da chi segui.",
    exploreFreedivers: "Esplora altri apneisti →",
    distanceAway: "a",
    km: "km",
    tomorrow: "Domani",
    
    // Environment types
    sea: "Mare",
    lake: "Lago",
    pool: "Piscina",
    deepPool: "Deep pool",
    
    // Session types
    seaTrip: "Uscita mare",
    deepPoolSession: "Piscina profonda",
    
    // Levels
    beginner: "Base",
    intermediate: "Intermedio",
    advanced: "Avanzato",
    allLevels: "Tutti i livelli",
    
    // Auth
    login: "Accedi",
    register: "Registrati",
    email: "Email",
    password: "Password",
    confirmPassword: "Conferma password",
    forgotPassword: "Password dimenticata?",
    noAccount: "Non hai un account?",
    hasAccount: "Hai già un account?",
    continueWithApple: "Continua con Apple",
    continueWithGoogle: "Continua con Google",
    orContinueWith: "oppure",
    welcomeBack: "Bentornato",
    createAccount: "Crea il tuo account",
    loginSubtitle: "Accedi per trovare buddy e sessioni",
    registerSubtitle: "Unisciti alla community di apneisti",
    resetPassword: "Reimposta password",
    resetPasswordSubtitle: "Inserisci la tua email per ricevere il link di reset",
    sendResetLink: "Invia link di reset",
    resetLinkSent: "Link inviato!",
    resetLinkSentDesc: "Controlla la tua email per reimpostare la password",
    backToLogin: "Torna al login",
    newPassword: "Nuova password",
    confirmNewPassword: "Conferma nuova password",
    updatePassword: "Aggiorna password",
    passwordUpdated: "Password aggiornata!",
    passwordUpdatedDesc: "Ora puoi accedere con la nuova password",
    
    // Onboarding
    onboardingTitle: "Completa il tuo profilo",
    onboardingStep1: "Informazioni base",
    onboardingStep2: "Esperienza",
    onboardingStep3: "Certificazione",
    onboardingStep4: "Sicurezza",
    yourName: "Il tuo nome",
    profilePicture: "Foto profilo (opzionale)",
    location: "Città o regione",
    areCertified: "Sei un apneista certificato?",
    yes: "Sì",
    no: "No",
    certificationAgency: "Ente di certificazione",
    certificationLevel: "Livello di certificazione",
    certificationId: "ID certificazione (opzionale)",
    uploadCertificate: "Carica certificato (opzionale)",
    next: "Avanti",
    back: "Indietro",
    complete: "Completa",
    skip: "Salta",
    
    // Safety
    safetyTitle: "La tua sicurezza è importante",
    safetyMessage: "L'apnea comporta rischi. Alcune sessioni potrebbero richiedere certificazione. Ti consigliamo di allenarti sempre con un buddy o un istruttore.",
    safetyDisclaimer: "Partecipando, accetti di rispettare le norme di sicurezza e di informare l'organizzatore del tuo livello di esperienza.",
    iUnderstand: "Ho capito",
    
    // Profile
    certifiedFreediver: "Apneista certificato",
    profile: "Profilo",
    settings: "Impostazioni",
    logout: "Esci",
    editProfile: "Modifica profilo",
    certification: "Certificazione",
    submitCertification: "Invia certificazione",
    adminDashboard: "Dashboard Admin",
    
    // Roles
    roleRegular: "Utente",
    roleCertified: "Certificato",
    roleInstructor: "Istruttore",
    roleAdmin: "Admin",
    
    // Certification status
    certStatusNotSubmitted: "Non inviata",
    certStatusPending: "In attesa",
    certStatusApproved: "Approvata",
    certStatusRejected: "Rifiutata",
    
    // Spots
    discoverSpots: "Scopri spot",
    filterByType: "Filtra per tipo",
    
    // Groups
    weeklyTraining: "Allenamenti settimanali",
    basicCourses: "Corsi base",
    weekendTrips: "Uscite weekend",
    mixedLevel: "Livello misto",
    createGroupTitle: "Crea un gruppo",
    groupTypeLabel: "Tipo di gruppo",
    groupTypeCommunity: "Community spontanea",
    groupTypeSchool: "Scuola / club",
    groupFocusLabel: "Focus del gruppo",
    focusDepth: "Profondità",
    focusDynamic: "Dinamica",
    focusStatic: "Statica",
    focusDryTraining: "Allenamento a secco",
    focusRecreational: "Ricreativo",
    groupVisibility: "Visibilità",
    visibilityOpen: "Gruppo aperto",
    visibilityApproval: "Accesso su richiesta",
    groupDescription: "Descrizione",
    verifiedClub: "Club verificato",
    schoolPartner: "Scuola partner",
    spontaneousGroup: "Gruppo spontaneo",
    youAreAdmin: "Sei admin",
    manageGroup: "Gestisci gruppo",
    viewMembers: "Vedi membri",
    followGroup: "Segui gruppo",
    goToProfile: "Vai al profilo",
    upcomingSessions: "Prossime sessioni",
    activeCourses: "Corsi attivi",
    membersSection: "Membri",
    allMembers: "Vedi tutti i membri",
    groupMainZone: "Zona principale",
    groupNamePlaceholder: "Es. Lago Lovers – Nord Italia",
    groupLocationPlaceholder: "Es. Lago di Garda · Nord Italia",
    groupDescPlaceholder: "Racconta in poche righe cosa fate...",
    schoolClubCertified: "Scuole & Club Certificati",
    yourGroups: "I tuoi gruppi",
    popularGroups: "Gruppi popolari",
    searchGroupsPlaceholder: "Cerca scuola o gruppo",
    filterAll: "Tutti",
    filterSchools: "Scuole & club",
    filterYourGroups: "I tuoi gruppi",
    filterNearby: "Gruppi vicino a te",
    
    // Training
    myTraining: "Il mio training",
    privateLog: "Log privato",
    addEntry: "Aggiungi allenamento",
    
    // Create
    createSession: "Crea sessione",
    createGroup: "Crea gruppo",
    createTraining: "Aggiungi training",
    whatCreate: "Cosa vuoi creare?",
    
    // Common
    loading: "Caricamento...",
    error: "Errore",
    retry: "Riprova",
    save: "Salva",
    cancel: "Annulla",
    confirm: "Conferma",
    delete: "Elimina",
    edit: "Modifica",
  },
  en: {
    // App
    appName: "Apnea Mate",
    
    // Navigation
    navCommunity: "Community",
    navSpot: "Spot",
    navCreate: "Create",
    navGroups: "Groups",
    navTraining: "Training",
    
    // Community page
    community: "Community",
    newSession: "+ New session",
    searchPlaceholder: "Search spots, sessions, people, groups",
    nearYou: "Near you",
    sessionsNearYou: "Sessions near you",
    fromPeopleYouFollow: "From people you follow",
    groupsNearYou: "Groups near you",
    viewAll: "View all",
    viewAllGroups: "View all",
    join: "Join",
    joinGroup: "Join group",
    details: "Details",
    bookSpot: "Book spot",
    spots: "spots",
    members: "members",
    instructor: "Instructor",
    instructorF: "Instructor",
    user: "User",
    noMoreSessions: "No more sessions from people you follow.",
    exploreFreedivers: "Explore more freedivers →",
    distanceAway: "",
    km: "km away",
    tomorrow: "Tomorrow",
    
    // Environment types
    sea: "Sea",
    lake: "Lake",
    pool: "Pool",
    deepPool: "Deep pool",
    
    // Session types
    seaTrip: "Sea trip",
    deepPoolSession: "Deep pool",
    
    // Levels
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    allLevels: "All levels",
    
    // Auth
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    continueWithApple: "Continue with Apple",
    continueWithGoogle: "Continue with Google",
    orContinueWith: "or",
    welcomeBack: "Welcome back",
    createAccount: "Create your account",
    loginSubtitle: "Sign in to find buddies and sessions",
    registerSubtitle: "Join the freediving community",
    resetPassword: "Reset password",
    resetPasswordSubtitle: "Enter your email to receive the reset link",
    sendResetLink: "Send reset link",
    resetLinkSent: "Link sent!",
    resetLinkSentDesc: "Check your email to reset your password",
    backToLogin: "Back to login",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    updatePassword: "Update password",
    passwordUpdated: "Password updated!",
    passwordUpdatedDesc: "You can now login with your new password",
    
    // Onboarding
    onboardingTitle: "Complete your profile",
    onboardingStep1: "Basic info",
    onboardingStep2: "Experience",
    onboardingStep3: "Certification",
    onboardingStep4: "Safety",
    yourName: "Your name",
    profilePicture: "Profile picture (optional)",
    location: "City or region",
    areCertified: "Are you a certified freediver?",
    yes: "Yes",
    no: "No",
    certificationAgency: "Certification agency",
    certificationLevel: "Certification level",
    certificationId: "Certification ID (optional)",
    uploadCertificate: "Upload certificate (optional)",
    next: "Next",
    back: "Back",
    complete: "Complete",
    skip: "Skip",
    
    // Safety
    safetyTitle: "Your safety matters",
    safetyMessage: "Freediving involves risks. Some sessions may require certification. We recommend always training with a buddy or instructor.",
    safetyDisclaimer: "By participating, you agree to follow safety guidelines and inform the organizer of your experience level.",
    iUnderstand: "I understand",
    
    // Profile
    certifiedFreediver: "Certified freediver",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    editProfile: "Edit profile",
    certification: "Certification",
    submitCertification: "Submit certification",
    adminDashboard: "Admin Dashboard",
    
    // Roles
    roleRegular: "User",
    roleCertified: "Certified",
    roleInstructor: "Instructor",
    roleAdmin: "Admin",
    
    // Certification status
    certStatusNotSubmitted: "Not submitted",
    certStatusPending: "Pending",
    certStatusApproved: "Approved",
    certStatusRejected: "Rejected",
    
    // Spots
    discoverSpots: "Discover spots",
    filterByType: "Filter by type",
    
    // Groups
    weeklyTraining: "Weekly training",
    basicCourses: "Basic courses",
    weekendTrips: "Weekend trips",
    mixedLevel: "Mixed level",
    createGroupTitle: "Create a group",
    groupTypeLabel: "Group type",
    groupTypeCommunity: "Spontaneous community",
    groupTypeSchool: "School / club",
    groupFocusLabel: "Group focus",
    focusDepth: "Depth",
    focusDynamic: "Dynamic",
    focusStatic: "Static",
    focusDryTraining: "Dry training",
    focusRecreational: "Recreational",
    groupVisibility: "Visibility",
    visibilityOpen: "Open group",
    visibilityApproval: "Approval required",
    groupDescription: "Description",
    verifiedClub: "Verified club",
    schoolPartner: "Partner school",
    spontaneousGroup: "Spontaneous group",
    youAreAdmin: "You're admin",
    manageGroup: "Manage group",
    viewMembers: "View members",
    followGroup: "Follow group",
    goToProfile: "Go to profile",
    upcomingSessions: "Upcoming sessions",
    activeCourses: "Active courses",
    membersSection: "Members",
    allMembers: "View all members",
    groupMainZone: "Main zone",
    groupNamePlaceholder: "E.g. Lake Lovers – Northern Italy",
    groupLocationPlaceholder: "E.g. Lake Garda · Northern Italy",
    groupDescPlaceholder: "Tell us briefly what you do...",
    schoolClubCertified: "Certified Schools & Clubs",
    yourGroups: "Your groups",
    popularGroups: "Popular groups",
    searchGroupsPlaceholder: "Search school or group",
    filterAll: "All",
    filterSchools: "Schools & clubs",
    filterYourGroups: "Your groups",
    filterNearby: "Groups nearby",
    
    // Training
    myTraining: "My training",
    privateLog: "Private log",
    addEntry: "Add training",
    
    // Create
    createSession: "Create session",
    createGroup: "Create group",
    createTraining: "Add training",
    whatCreate: "What do you want to create?",
    
    // Common
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
  },
};

export type Language = "it" | "en";

let currentLanguage: Language = "it";

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  localStorage.setItem("apnea-mate-lang", lang);
};

export const getLanguage = (): Language => {
  const stored = localStorage.getItem("apnea-mate-lang") as Language | null;
  if (stored && (stored === "it" || stored === "en")) {
    currentLanguage = stored;
  }
  return currentLanguage;
};

export const t = (key: TranslationKey): string => {
  return translations[currentLanguage][key] || translations.it[key] || key;
};

export const useTranslation = () => {
  return { t, language: currentLanguage, setLanguage, getLanguage };
};
