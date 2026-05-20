# Mostra la foto profilo nella pagina utente

## Problema
In `/users/:id` l'avatar mostra sempre solo l'iniziale del nome, anche se l'utente ha caricato una foto profilo (`avatar_url` esiste su `profiles`).

## Fix
Modificare `src/pages/UserProfile.tsx` (riga ~138): se `profile.avatar_url` è presente, renderizzare un `<img>` che riempie il cerchio gradient; altrimenti mantenere il fallback con l'iniziale (comportamento attuale).

```tsx
<div className="w-20 h-20 mx-auto rounded-full avatar-gradient flex items-center justify-center text-2xl font-bold text-white mb-4 overflow-hidden">
  {profile.avatar_url ? (
    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
  ) : (
    profile.name.charAt(0).toUpperCase()
  )}
</div>
```

## Fuori scope
Nessun'altra modifica: niente nuovi campi, niente upload, niente cambi al hook `useProfile`.
