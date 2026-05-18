// Apnea Mate — GDPR privacy policy content.
// Italian is the legally binding version; English is an unofficial translation.
// Updated whenever the company details or wording change.

import type { Language } from "@/lib/i18n";

export const PRIVACY_CONTROLLER = {
  company: "Apnea Mate S.r.l.",
  address: "Via Mazzini 37, 13836 Cossato (BI), Italia",
  vat: "02847820020",
  email: "privacy@apneamate.com",
} as const;

export const PRIVACY_LAST_UPDATED = {
  it: "18 maggio 2026",
  en: "18 May 2026",
} as const;

export interface PrivacySection {
  /** Section number, e.g. "1", "3.1" */
  number: string;
  title: string;
  /** Plain paragraphs of body text, rendered in order. */
  paragraphs?: string[];
  /** Optional list rendered as a <ul>. */
  list?: string[];
  /** Optional label/value pairs (e.g. "Base giuridica: …"). */
  meta?: Array<{ label: string; body: string }>;
}

export interface PrivacyPolicy {
  pageTitle: string;
  intro: string;
  langDisclaimer?: string;
  lastUpdatedLabel: string;
  sections: PrivacySection[];
}

const it = (): PrivacyPolicy => ({
  pageTitle: "Informativa Privacy",
  intro: `Informativa sul trattamento dei dati personali ai sensi dell'art. 13 del Regolamento (UE) 2016/679 ("GDPR").`,
  lastUpdatedLabel: "Ultimo aggiornamento",
  sections: [
    {
      number: "1",
      title: "Titolare del trattamento",
      paragraphs: [
        `Il titolare del trattamento dei dati personali è ${PRIVACY_CONTROLLER.company}, con sede legale in ${PRIVACY_CONTROLLER.address}, C.F. e P.IVA ${PRIVACY_CONTROLLER.vat} (di seguito, il "Titolare" o la "Società").`,
        `Per qualsiasi richiesta relativa al trattamento dei dati personali, è possibile contattare la Società all'indirizzo e-mail ${PRIVACY_CONTROLLER.email}.`,
      ],
    },
    {
      number: "2",
      title: "Tipologie di dati trattati",
      paragraphs: [
        `${PRIVACY_CONTROLLER.company} tratta esclusivamente dati personali identificativi e di contatto, forniti dall'interessato in occasione:`,
      ],
      list: [
        "dell'instaurazione di rapporti contrattuali con la Società;",
        `dell'iscrizione all'applicazione "Apnea Mate" e alle attività, servizi, corsi o iniziative ivi contenuti.`,
      ],
      meta: [
        { label: "Dati identificativi", body: "nome, cognome, luogo e data di nascita." },
        { label: "Dati di contatto", body: "indirizzo di residenza o domicilio, indirizzo e-mail, numero di telefono fisso e/o mobile." },
        { label: "Altri dati comuni", body: "dichiarazione di possesso di brevetto per attività in apnea." },
        {
          label: "Categorie particolari",
          body: "La Società non tratta dati appartenenti a categorie particolari ai sensi dell'art. 9 GDPR (quali dati relativi alla salute, dati genetici o biometrici, ecc.), né dati giudiziari, fatte salve eventuali, diverse e specifiche informative rese in caso di necessità.",
        },
      ],
    },
    {
      number: "3",
      title: "Finalità del trattamento e basi giuridiche",
      paragraphs: [
        "I dati personali dell'interessato saranno trattati dalla Società per le seguenti finalità.",
      ],
    },
    {
      number: "3.1",
      title: "Finalità di Legge",
      paragraphs: [
        "I dati personali sono trattati per adempiere a obblighi derivanti da normative nazionali e dell'Unione europea, incluse norme di natura fiscale, contabile, civilistica, amministrativa, nonché per ottemperare a richieste provenienti da autorità competenti e organi di vigilanza e controllo.",
      ],
      meta: [
        { label: "Base giuridica", body: "art. 6, par. 1, lett. c) GDPR (adempimento di un obbligo legale al quale è soggetto il Titolare)." },
        { label: "Carattere del conferimento", body: "il conferimento dei dati per tali finalità è obbligatorio; l'eventuale mancato conferimento comporta l'impossibilità per il Titolare di adempiere ai relativi obblighi di legge." },
      ],
    },
    {
      number: "3.2",
      title: "Finalità Contrattuali",
      paragraphs: ["I dati personali sono trattati per:"],
      list: [
        `instaurare, gestire ed eseguire rapporti contrattuali con l'interessato, in particolare con riferimento all'iscrizione all'applicazione "Apnea Mate";`,
        `gestire richieste di informazioni, preventivi e iscrizioni a servizi, corsi o iniziative della Società, in particolare quelli previsti all'interno dell'applicazione "Apnea Mate";`,
        "gestire eventuali attività amministrative e contabili connesse (es. fatturazione, pagamenti);",
        "inviare comunicazioni di servizio con riferimento ai rapporti in essere (es. comunicazioni su organizzazione, modifiche o aggiornamenti di servizi, scadenze);",
        `con riferimento al possesso di brevetto per attività in apnea: esclusivamente per attestare un titolo formativo e/o competenza tecnica dell'interessato al fine di "sbloccare" funzioni specifiche dell'applicazione "Apnea Mate", senza che tale attestazione sia in alcun modo riconducibile a eventuali informazioni circa lo stato di salute dell'interessato.`,
      ],
      meta: [
        { label: "Base giuridica", body: "art. 6, par. 1, lett. b) GDPR (esecuzione di un contratto o di misure precontrattuali adottate su richiesta dell'interessato)." },
        { label: "Carattere del conferimento", body: `il conferimento dei dati per tali finalità è necessario per la conclusione e l'esecuzione del rapporto contrattuale e/o in particolare per l'installazione e l'utilizzo dell'applicazione "Apnea Mate"; il mancato conferimento comporta l'impossibilità di instaurare o proseguire il rapporto con la Società.` },
      ],
    },
    {
      number: "3.3",
      title: "Finalità Commerciali / di Marketing",
      paragraphs: [
        `Previo specifico consenso dell'interessato, fornito — con riferimento agli iscritti all'applicazione "Apnea Mate" — tramite apposita e univoca sezione dedicata all'interno dell'applicazione, i dati personali (limitati ai dati identificativi e di contatto) potranno essere trattati dalla Società per l'invio di:`,
      ],
      list: [
        `comunicazioni commerciali e promozionali relative a prodotti, servizi, iniziative o eventi di ${PRIVACY_CONTROLLER.company} e/o dei relativi partner commerciali;`,
        `newsletter informative di ${PRIVACY_CONTROLLER.company} e/o dei relativi partner commerciali;`,
        `inviti a eventi, corsi, campagne o iniziative promozionali di ${PRIVACY_CONTROLLER.company} e/o dei relativi partner commerciali.`,
      ],
      meta: [
        { label: "Base giuridica", body: "art. 6, par. 1, lett. a) GDPR (consenso dell'interessato)." },
        { label: "Carattere del conferimento e facoltatività del consenso", body: "il conferimento dei dati e il rilascio del consenso per le Finalità Commerciali/di Marketing sono del tutto facoltativi. Il mancato rilascio del consenso — o la successiva revoca dello stesso — non pregiudicano la possibilità di usufruire dei servizi principali offerti dalla Società, né impediscono la conclusione o l'esecuzione del rapporto contrattuale o l'adempimento di obblighi di legge." },
        { label: "Revoca del consenso", body: `l'interessato potrà in qualsiasi momento revocare il consenso prestato per le Finalità Commerciali/di Marketing, senza pregiudicare la liceità del trattamento basato sul consenso prima della revoca. La revoca può essere esercitata dalle impostazioni del proprio profilo nell'applicazione, oppure scrivendo all'indirizzo e-mail della Società indicato nella presente informativa.` },
        { label: "Profilazione", body: `${PRIVACY_CONTROLLER.company} non effettua attività di profilazione sulla base dei dati trattati per le Finalità Commerciali/di Marketing.` },
      ],
    },
    {
      number: "4",
      title: "Modalità del trattamento e misure di sicurezza",
      paragraphs: [
        "I dati personali saranno trattati in modo lecito, corretto e trasparente, mediante strumenti cartacei e informatici, secondo logiche di minimizzazione strettamente correlate alle finalità indicate.",
        "La Società adotta misure tecniche e organizzative adeguate ai sensi in particolare dell'art. 32 GDPR, volte a prevenire la perdita dei dati, usi illeciti o non corretti, accessi non autorizzati o divulgazioni non autorizzate.",
      ],
    },
    {
      number: "5",
      title: "Destinatari dei dati personali",
      paragraphs: ["I dati personali potranno essere trattati:"],
      list: [
        "da dipendenti e collaboratori del Titolare, espressamente autorizzati e istruiti ai sensi dell'art. 29 GDPR;",
        "da soggetti terzi che agiscono in qualità di responsabili del trattamento ai sensi dell'art. 28 GDPR, tra cui, a titolo esemplificativo: società che erogano servizi informatici e telematici; società che svolgono servizi amministrativi, contabili e fiscali; consulenti e professionisti (es. legali, fiscali, contabili); fornitori di servizi di invio di comunicazioni (es. piattaforme di e-mail marketing); eventuali partner commerciali della Società (dietro espresso consenso per le Finalità Commerciali/di Marketing);",
        "da soggetti che operano in qualità di titolari autonomi del trattamento.",
      ],
    },
    {
      number: "6",
      title: "Trasferimento dei dati verso Paesi extra SEE",
      paragraphs: [
        "I dati personali sono trattati e conservati all'interno dello Spazio Economico Europeo (SEE).",
        "Qualora si rendesse necessario effettuare trasferimenti di dati personali verso Paesi situati al di fuori del SEE, tali trasferimenti avverranno nel rispetto degli artt. 44–49 GDPR, assicurando un livello di protezione adeguato.",
      ],
    },
    {
      number: "7",
      title: "Periodo di conservazione dei dati",
      paragraphs: [
        "I dati forniti verranno conservati secondo una periodica revisione ai sensi del criterio need-to-store e, in ogni caso, saranno conservati dalla Società per tutta la durata del rapporto con l'interessato. Alla sua cessazione, saranno archiviati fino alla scadenza degli ordinari termini di prescrizione di cui all'art. 2946 c.c.",
        "I dati personali trattati per Finalità Commerciali/di Marketing avranno un periodo di conservazione più breve, determinato in un massimo di 24 mesi dall'ultimo contatto significativo con l'interessato (es. ultima richiesta, ultima iscrizione a iniziativa, ultima interazione con comunicazioni di marketing), salvo revoca anticipata del consenso.",
        "Al termine dei periodi di conservazione, i dati saranno cancellati, anonimizzati o conservati in forma aggregata, se possibile, per finalità meramente statistiche e senza possibilità di identificare gli interessati.",
      ],
    },
    {
      number: "8",
      title: "Diritti dell'interessato",
      paragraphs: [
        "In qualità di interessato, tramite comunicazione agli indirizzi indicati nella presente informativa, l'utente può esercitare in qualsiasi momento, nei confronti della Società, i diritti previsti dagli artt. 15–22 del GDPR, tra cui:",
      ],
      meta: [
        { label: "Art. 15 — Diritto di accesso", body: "diritto di ottenere la conferma che sia o meno in corso un trattamento di dati personali che lo riguardano e, in tal caso, di ottenere l'accesso ai dati personali e alle informazioni riguardanti il trattamento." },
        { label: "Art. 16 — Diritto di rettifica", body: "diritto di ottenere la rettifica dei dati personali inesatti che lo riguardano senza ingiustificato ritardo. Tenuto conto delle finalità del trattamento, l'interessato ha il diritto di ottenere l'integrazione dei dati personali incompleti, anche fornendo una dichiarazione integrativa." },
        { label: "Art. 17 — Diritto alla cancellazione (diritto all'oblio)", body: "diritto di ottenere la cancellazione dei dati personali che lo riguardano senza ingiustificato ritardo." },
        { label: "Art. 18 — Diritto di limitazione del trattamento", body: "diritto di ottenere la limitazione del trattamento quando ricorre una delle ipotesi previste dall'art. 18 GDPR (es. contestazione dell'esattezza dei dati, opposizione al trattamento in pendenza di verifica)." },
        { label: "Art. 20 — Diritto alla portabilità dei dati", body: "diritto di ricevere in un formato strutturato, di uso comune e leggibile da dispositivo automatico i dati personali che lo riguardano forniti al Titolare e di trasmettere tali dati a un altro titolare del trattamento senza impedimenti, anche ottenendone, ove tecnicamente fattibile, la trasmissione diretta." },
        { label: "Art. 21 — Diritto di opposizione", body: "diritto di opporsi in qualsiasi momento, per motivi connessi alla sua situazione particolare, al trattamento dei dati personali che lo riguardano ai sensi dell'art. 6, par. 1, lett. e) o f)." },
        { label: "Art. 22 — Decisioni automatizzate e profilazione", body: "diritto di non essere sottoposto a una decisione basata unicamente sul trattamento automatizzato, compresa la profilazione, che produca effetti giuridici che lo riguardano o che incida in modo analogo significativamente sulla sua persona." },
      ],
    },
  ],
});

const en = (): PrivacyPolicy => ({
  pageTitle: "Privacy Policy",
  intro: `Information on the processing of personal data pursuant to art. 13 of Regulation (EU) 2016/679 ("GDPR").`,
  langDisclaimer: "Unofficial translation provided for convenience. In case of discrepancy, the Italian version prevails.",
  lastUpdatedLabel: "Last updated",
  sections: [
    {
      number: "1",
      title: "Data Controller",
      paragraphs: [
        `The data controller is ${PRIVACY_CONTROLLER.company}, with registered office at ${PRIVACY_CONTROLLER.address}, Italian tax code and VAT number ${PRIVACY_CONTROLLER.vat} (the "Controller" or the "Company").`,
        `For any request relating to the processing of personal data, you can contact the Company at the e-mail address ${PRIVACY_CONTROLLER.email}.`,
      ],
    },
    {
      number: "2",
      title: "Types of data processed",
      paragraphs: [
        `${PRIVACY_CONTROLLER.company} processes only personal identification and contact data, provided by the data subject when:`,
      ],
      list: [
        "entering into contractual relationships with the Company;",
        `signing up to the "Apnea Mate" application and to the activities, services, courses or initiatives offered therein.`,
      ],
      meta: [
        { label: "Identification data", body: "first name, last name, place and date of birth." },
        { label: "Contact data", body: "residential address, e-mail address, landline and/or mobile phone number." },
        { label: "Other ordinary data", body: "declaration of holding a freediving certification." },
        {
          label: "Special categories",
          body: "The Company does not process special categories of data under art. 9 GDPR (such as health, genetic or biometric data), nor judicial data, save for any specific and different notices provided where necessary.",
        },
      ],
    },
    {
      number: "3",
      title: "Purposes of the processing and legal bases",
      paragraphs: ["Personal data will be processed by the Company for the following purposes."],
    },
    {
      number: "3.1",
      title: "Legal purposes",
      paragraphs: [
        "Personal data is processed to comply with obligations arising from national and EU regulations, including tax, accounting, civil and administrative rules, as well as to comply with requests from competent authorities and supervisory bodies.",
      ],
      meta: [
        { label: "Legal basis", body: "art. 6(1)(c) GDPR (compliance with a legal obligation to which the Controller is subject)." },
        { label: "Mandatory nature", body: "providing the data for these purposes is mandatory; failure to provide it makes it impossible for the Controller to fulfil the related legal obligations." },
      ],
    },
    {
      number: "3.2",
      title: "Contractual purposes",
      paragraphs: ["Personal data is processed in order to:"],
      list: [
        `establish, manage and execute contractual relationships with the data subject, in particular with regard to registration to the "Apnea Mate" application;`,
        "manage requests for information, quotes and registrations for services, courses or initiatives of the Company;",
        "manage related administrative and accounting activities (e.g. invoicing, payments);",
        "send service communications relating to ongoing relationships (e.g. organisational communications, changes or updates to services, deadlines);",
        `with reference to holding a freediving certification: solely to attest to the data subject's training qualification and/or technical competence in order to "unlock" specific features of the "Apnea Mate" application, without such attestation being in any way related to information about the data subject's state of health.`,
      ],
      meta: [
        { label: "Legal basis", body: "art. 6(1)(b) GDPR (performance of a contract or pre-contractual measures taken at the data subject's request)." },
        { label: "Mandatory nature", body: `providing the data for these purposes is necessary for the conclusion and execution of the contractual relationship and in particular for the installation and use of the "Apnea Mate" application; failure to provide it makes it impossible to establish or continue the relationship with the Company.` },
      ],
    },
    {
      number: "3.3",
      title: "Commercial / marketing purposes",
      paragraphs: [
        `Subject to specific consent of the data subject, given — for users of the "Apnea Mate" application — through a dedicated section within the application, personal data (limited to identification and contact data) may be processed by the Company to send:`,
      ],
      list: [
        `commercial and promotional communications relating to products, services, initiatives or events of ${PRIVACY_CONTROLLER.company} and/or its commercial partners;`,
        `informational newsletters of ${PRIVACY_CONTROLLER.company} and/or its commercial partners;`,
        `invitations to events, courses, campaigns or promotional initiatives of ${PRIVACY_CONTROLLER.company} and/or its commercial partners.`,
      ],
      meta: [
        { label: "Legal basis", body: "art. 6(1)(a) GDPR (consent of the data subject)." },
        { label: "Optional nature of consent", body: "providing the data and giving consent for Commercial/Marketing purposes are entirely optional. Failure to give consent — or subsequent withdrawal of it — does not affect the possibility of using the Company's main services, nor does it prevent the conclusion or execution of the contractual relationship or compliance with legal obligations." },
        { label: "Withdrawal of consent", body: "the data subject may withdraw consent for Commercial/Marketing purposes at any time, without affecting the lawfulness of processing based on consent before its withdrawal. Withdrawal can be exercised from the profile settings within the application, or by writing to the Company's e-mail address indicated in this notice." },
        { label: "Profiling", body: `${PRIVACY_CONTROLLER.company} does not carry out profiling activities based on the data processed for Commercial/Marketing purposes.` },
      ],
    },
    {
      number: "4",
      title: "Processing methods and security measures",
      paragraphs: [
        "Personal data will be processed lawfully, fairly and transparently, by paper and electronic means, according to data-minimisation principles strictly related to the purposes indicated.",
        "The Company adopts technical and organisational measures appropriate in particular under art. 32 GDPR, aimed at preventing data loss, unlawful or incorrect uses, unauthorised access and unauthorised disclosures.",
      ],
    },
    {
      number: "5",
      title: "Recipients of personal data",
      paragraphs: ["Personal data may be processed:"],
      list: [
        "by employees and collaborators of the Controller, expressly authorised and instructed pursuant to art. 29 GDPR;",
        "by third parties acting as data processors pursuant to art. 28 GDPR, including by way of example: providers of IT and telematic services; providers of administrative, accounting and tax services; consultants and professionals (e.g. legal, tax, accounting); providers of communication services (e.g. e-mail marketing platforms); any commercial partners of the Company (subject to express consent for Commercial/Marketing purposes);",
        "by entities operating as independent data controllers.",
      ],
    },
    {
      number: "6",
      title: "Transfers of data outside the EEA",
      paragraphs: [
        "Personal data is processed and stored within the European Economic Area (EEA).",
        "Should it become necessary to transfer personal data to countries outside the EEA, such transfers will take place in compliance with artt. 44–49 GDPR, ensuring an adequate level of protection.",
      ],
    },
    {
      number: "7",
      title: "Data retention period",
      paragraphs: [
        "The data provided will be retained subject to periodic review based on a need-to-store criterion and, in any case, will be kept by the Company for the entire duration of the relationship with the data subject. Upon its termination, the data will be archived until the expiry of the ordinary limitation periods under art. 2946 of the Italian Civil Code.",
        "Personal data processed for Commercial/Marketing purposes will have a shorter retention period, determined as a maximum of 24 months from the last significant contact with the data subject (e.g. last request, last registration to an initiative, last interaction with marketing communications), unless consent is withdrawn earlier.",
        "At the end of the retention periods, data will be deleted, anonymised, or kept in aggregated form, where possible, for purely statistical purposes and without the possibility of identifying the data subjects.",
      ],
    },
    {
      number: "8",
      title: "Rights of the data subject",
      paragraphs: [
        "As a data subject, by contacting the addresses indicated in this notice, the user may exercise at any time, vis-à-vis the Company, the rights provided by artt. 15–22 GDPR, including:",
      ],
      meta: [
        { label: "Art. 15 — Right of access", body: "the right to obtain confirmation as to whether or not personal data concerning the data subject is being processed and, where that is the case, access to the personal data and information about the processing." },
        { label: "Art. 16 — Right to rectification", body: "the right to obtain rectification of inaccurate personal data concerning the data subject without undue delay. Taking into account the purposes of the processing, the data subject has the right to have incomplete personal data completed, including by means of providing a supplementary statement." },
        { label: "Art. 17 — Right to erasure (right to be forgotten)", body: "the right to obtain the erasure of personal data concerning the data subject without undue delay." },
        { label: "Art. 18 — Right to restriction of processing", body: "the right to obtain restriction of processing where one of the cases provided for in art. 18 GDPR applies (e.g. contestation of the accuracy of the data, objection to processing pending verification)." },
        { label: "Art. 20 — Right to data portability", body: "the right to receive personal data provided to a Controller in a structured, commonly used and machine-readable format and to transmit those data to another controller without hindrance, including obtaining, where technically feasible, their direct transmission." },
        { label: "Art. 21 — Right to object", body: "the right to object at any time, on grounds relating to the data subject's particular situation, to processing of personal data concerning him or her under art. 6(1)(e) or (f)." },
        { label: "Art. 22 — Automated decision-making and profiling", body: "the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning the data subject or similarly significantly affects him or her." },
      ],
    },
  ],
});

export const getPrivacyPolicy = (lang: Language): PrivacyPolicy => {
  return lang === "en" ? en() : it();
};

export const getPrivacyLastUpdated = (lang: Language): string => {
  return lang === "en" ? PRIVACY_LAST_UPDATED.en : PRIVACY_LAST_UPDATED.it;
};