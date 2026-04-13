

# Replace hardcoded Italian strings with t() in remaining 11 files

All ~80 i18n keys already exist in `src/lib/i18n.ts` (both IT and EN). This is purely a mechanical replacement in 11 files.

## Files and changes

### 1. `src/pages/Onboarding.tsx`
- Line 88: `"Posizione rilevata"` → `t("locationDetected")`
- Line 89: description → `t("locationDetectedDesc")` (need to check if exists, else use location string)
- Lines 92-96: toast not found → `t("locationNotFound")` + `t("insertLocationManually")`
- Lines 100-103: cannot detect → `t("cannotDetectLocation")` + `t("grantLocationPermission")`
- Lines 121-125: name required → `t("nameRequired")` + `t("nameRequiredDesc")`
- Lines 129-133: location required → `t("locationRequired")` + `t("locationRequiredDesc")`
- Lines 139-144: select option → `t("selectAnOption")` + `t("selectAnOptionDesc")`
- Lines 150-154: agency required → `t("agencyRequired")` + `t("agencyRequiredDesc")`
- Lines 158-162: level required → `t("levelRequired")` + `t("levelRequiredDesc")`
- Line 251: `"Profilo completato!"` → `t("profileCompleted")`
- Line 252: `"Benvenuto in Apnea Mate"` → `t("welcomeToApneaMate")`
- Lines 259-260: error saving → `t("error")` + `t("cannotSaveProfile")`
- Lines 273-275: file too large → `t("fileTooLarge")` + `t("fileTooLargeDesc")`
- Line 331: placeholder `"Mario Rossi"` → `t("namePlaceholder")` (add key if missing)
- Line 342: placeholder `"Racconta qualcosa di te..."` → `t("bioPlaceholder")` (add key if missing)
- Line 363: title `"Usa la mia posizione"` → `t("useMyLocation")`
- Line 505: placeholder `"es. AIDA-12345"` → `t("certIdPlaceholder")`
- Line 514: `"Carica documento"` → `t("uploadCertificateBtn")`

### 2. `src/pages/Admin.tsx`
- Lines 37-41: `roleLabels` → use `t("user")`, `t("certifiedFreediverRole")`, `t("instructor")`, `"Admin"`
- Lines 43-46: `groupTypeLabels` → use `t("communityGroupType")`, `t("schoolClubGroupType")`
- Lines 78-79: access denied toast → `t("accessDenied")` + `t("noPermissionForPage")`
- Lines 94-96: error toast → `t("error")` + `t("cannotUpdateRole")`
- Lines 99-101: role updated → `t("roleUpdated")`
- Lines 114-116: error verification → `t("error")` + `t("cannotUpdateVerification")`
- Lines 121-124: verified/removed → `t("verificationRemoved")` / `t("groupVerified")`
- Line 167: `Utenti` → `t("users")`
- Line 178: `Gruppi` → `t("groups")`
- Line 189: `Nessun gruppo trovato` → `t("noGroupFound")`
- Line 212: `membri` → `t("members")`
- Line 217: `Verificato`/`Non verificato` → `t("verified")`/`t("notVerified")`
- Line 269: `Modifica ruolo` → `t("editRole")`
- Line 271: `Cambia il ruolo di` → `t("changeRoleOf")`
- Line 276: `Ruolo` → `t("role")`
- Lines 282-285: SelectItems → `t("user")`, `t("certifiedFreediverRole")`, `t("instructor")`
- Lines 291-295: `Annulla`/`Salva` → `t("cancel")`/`t("save")`

### 3. `src/pages/DiscoverFreedivers.tsx`
- Lines 31-34: follow/unfollow toast → `t("nowFollowing")` + user.name, `t("noLongerFollowing")` + user.name, `t("sessionsWillAppear")`
- Lines 38-40: error → `t("error")` + `t("cannotCompleteAction")`
- Line 62: `Certificato` → `t("certifiedBadge")`
- Line 108: `"Seguito"` / `"Segui"` → `t("followed")` / `t("follow")`
- Line 150: `"Scopri apneisti"` → `t("discoverFreedivers")`
- Line 157: `"Cerca apneisti..."` → `t("searchFreedivers")`
- Lines 170-174: follow suggestion → `t("followAtLeastOne")` + `t("followAtLeastOneDesc")`
- Line 183: `"Suggeriti per te"` → `t("suggestedForYou")`
- Lines 204-205: empty state → `t("noFreediversFound")` / `t("noSuggestionsNow")`
- Line 214: `"Mostra tutti i suggerimenti"` → `t("showAllSuggestions")`

### 4. `src/pages/MySessions.tsx`
- Replace local `mapSessionType` with imported `mapSessionType` from `@/lib/i18n`
- Line 108: `"In attesa"` / `"Confermato"` → `t("waitingBadge")` / `t("confirmedBadge")`
- Line 125: `partecipanti` → `t("participantsLabel")`
- Line 128: `Organizzatore:` → `t("organizerLabel")`
- Line 160: `"Creata da te"` → `t("createdByYouBadge")`
- Line 178: `confermati` → `t("confirmedBadge")`
- Line 182: `richieste in attesa` → `t("requestsWaiting")`
- Lines 197, 219: `"Le mie sessioni"` → `t("mySessions")`
- Line 242: `"Nessuna sessione"` → `t("noSessions")`
- Lines 243-244: description → `t("noSessionsDesc")`
- Line 247: `"Esplora sessioni"` → `t("exploreSessions")`
- Lines 259, 274, 289, 304: section headers → `t("pendingRequestsSection")`, `t("waitingApprovalSection")`, `t("confirmedSection")`, `t("createdByYouSection")`

### 5. `src/pages/Groups.tsx`
- Line 26: toast → `t("mustLoginToJoin")`
- Line 31: error toast title → `t("error")`
- Line 33: `"Richiesta inviata"` → `t("requestSentGroup")` + `t("waitingApprovalGroup")`
- Line 35: `"Iscrizione effettuata!"` → `t("subscriptionDone")`
- Line 82: `Crea` → `t("create")`
- Line 108: `"Nessun gruppo trovato"` → `t("noGroupsFound")`

### 6. `src/pages/GroupManage.tsx`
- All hardcoded strings replaced with matching t() keys from `manageGroupTitle`, `requests`, `settingsTab`, `noPendingRequests`, `noMembers`, `memberApproved`, `requestRejected`, `ownerRole`, `adminRole`, `memberRole`, `makeOwner`, `makeAdmin`, `removeRole`, `removeFromGroup`, `creatorLabel`, `pendingRequest`, `groupNameRequired`, `settingsSaved`, `groupNameLabel`, `describeYourGroup`, `saveSettings`, `tapToChangePhoto`, `groupNotFound`, `backToGroups`, `noPermissionManage`, `backToGroup`, `memberRemoved`, `roleUpdatedTo`, `error`, `cancel`, `save`

### 7. `src/components/sessions/SessionCalendar.tsx`
- Lines 28-31: `statusConfig` labels → `t("statusConfirmed")`, `t("statusPending")`, `t("statusCreatedByYou")`, `t("statusAvailable")`
- Since `t()` is called at render time, convert `statusConfig` to a function or compute labels inline

### 8. `src/components/spots/SpotCreator.tsx`
- Lines 30-35: `environmentTypes` labels → use `getEnvironmentTypes()` from i18n
- All hardcoded labels/toasts → corresponding t() keys (`newSpot`, `spotNameLabel`, `environmentType`, `searchAddress`, `orClickOnMap`, `saveSpot`, `spotCreated`, etc.)

### 9. `src/components/certification/CertificationForm.tsx`
- All labels, toasts, placeholders → `t("submitCertificationTitle")`, `t("willBeVerified")`, `t("certAgencyLabel")`, `t("certLevelLabel")`, `t("certLevelPlaceholder")`, `t("certIdLabel")`, `t("certIdPlaceholder")`, `t("documentOptional")`, `t("uploadCertificateBtn")`, `t("formats")`, `t("requiredFields")`, `t("requiredFieldsDesc")`, `t("mustBeAuthenticated")`, `t("certificationAdded")`, `t("nowCertifiedFreediver")`, `t("cannotSubmitCert")`, `t("sendRequest")`, `t("cancel")`, `t("error")`, `t("fileTooLarge")`, `t("fileTooLargeDesc")`

### 10. `src/components/certification/CertificationStatus.tsx`
- Status config labels/descriptions → `t("certStatusNotSubmitted")`, `t("certStatusNotSubmittedDesc")`, `t("certStatusApprovedLabel")`, `t("certStatusApprovedDesc")`
- `"Certificato"` badge → `t("certifiedBadge")`

### 11. `src/pages/Community.tsx` (line 579)
- `"Nessun altro gruppo da unirsi."` → `t("noOtherGroups")`
- `"Nessun gruppo disponibile."` → `t("noGroupsAvailable")`
- `"Crea un gruppo"` → `t("createAGroup")`

## Missing i18n keys to add
- `namePlaceholder`: IT "Mario Rossi" / EN "John Doe"
- `bioPlaceholder`: IT "Racconta qualcosa di te..." / EN "Tell us about yourself..."
- `uploadDocument`: IT "Carica documento" / EN "Upload document"
- `user` (for admin role label): IT "Utente" / EN "User"
- `members` (for admin group count): IT "membri" / EN "members"
- `confirmedCount` (for MySessions): IT "confermati" / EN "confirmed"

## Implementation order
1. Add ~6 missing keys to i18n.ts
2. Update all 11 files replacing hardcoded strings with t() calls

