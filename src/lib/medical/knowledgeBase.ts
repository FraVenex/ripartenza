// Base di conoscenza medica "curata a mano" e sintetizzata (in parole proprie,
// non citazioni testuali) da letteratura scientifica e linee guida di settore,
// usata per: 1) mostrare schede informative nell'app, 2) essere iniettata nel
// prompt di sistema dell'assistente AI così che le sue proposte di allenamento
// restino ancorate a principi noti, invece che "inventate".
//
// IMPORTANTE: questi contenuti sono materiale educativo generale, non una
// diagnosi né una prescrizione. Non sostituiscono la valutazione di un medico,
// fisioterapista o ortopedico, che resta necessaria prima di riprendere a
// correre in presenza di una patologia attiva o di dolore persistente.

export interface KnowledgeBaseEntry {
  id: string;
  label: string; // nome visualizzato, es. "Artrosi dell'anca"
  aliases: string[]; // sinonimi/termini che l'utente potrebbe usare
  summary: string;
  generalPrinciples: string[];
  graduatedProtocol: {
    phase: string;
    goal: string;
    criteriaToProgress: string;
  }[];
  redFlags: string[]; // quando fermarsi e rivolgersi a un professionista
  references: string[]; // attribuzioni sintetiche, non citazioni testuali
}

export const KNOWLEDGE_BASE: KnowledgeBaseEntry[] = [
  {
    id: 'hip_oa',
    label: "Artrosi dell'anca (coxartrosi)",
    aliases: ['artrosi anca', 'coxartrosi', 'hip osteoarthritis', 'hip oa', 'usura anca'],
    summary:
      "L'artrosi dell'anca non è, di per sé, una controindicazione alla corsa: diverse revisioni sistematiche mostrano che correre in modo ricreativo, con carichi moderati e per storie di corsa inferiori a circa 15 anni, non è associato a un aumento del rischio di artrosi d'anca o ginocchio, e in alcuni casi è associato a un rischio minore rispetto alla sedentarietà. L'obiettivo del ritorno alla corsa non è quindi 'evitare l'anca', ma costruire la capacità di carico dei tessuti attorno all'articolazione, in primis la muscolatura glutea, prima e durante la ripresa.",
    generalPrinciples: [
      "L'esercizio terapeutico è la prima linea di trattamento raccomandata dalle linee guida internazionali per l'artrosi d'anca, con benefici documentati su dolore e funzione, anche se l'entità dell'effetto è spesso descritta come modesta e variabile da persona a persona: va quindi vista come una componente di un piano più ampio, non come una soluzione garantita.",
      "Il rinforzo del medio e grande gluteo e il controllo motorio dell'anca (evitare il collasso del bacino in appoggio monopodalico) sono gli obiettivi più citati nei protocolli di riabilitazione per l'anca, più della semplice mobilità articolare.",
      "L'educazione del paziente sulla natura della patologia e sul fatto che il carico controllato non 'consuma' la cartilagine riduce la paura del movimento (chinesiofobia), che di per sé è un freno al recupero.",
      "Il dolore durante l'attività non è automaticamente un segnale di danno: una soglia pragmatica usata in riabilitazione è restare sotto 3-4/10 durante l'attività, con ritorno al livello basale entro la mattina successiva; dolore che sale progressivamente di sessione in sessione, invece, è un segnale di sovraccarico da correggere.",
    ],
    graduatedProtocol: [
      {
        phase: 'Fase 1 – Base',
        goal:
          'Camminata senza dolore significativo, rinforzo dell\'anca (ponte, clamshell, abduzioni laterali, step-up controllati) 2-3 volte a settimana, mobilità in flessione/estensione/rotazione dell\'anca.',
        criteriaToProgress:
          'Cammina 30-45 minuti senza dolore oltre soglia; sale/scende le scale senza cedimento del bacino; esegue un mini-squat monopodalico con controllo.',
      },
      {
        phase: 'Fase 2 – Cammina-corri',
        goal:
          'Introduzione di brevi tratti di corsa alternati a cammino (es. 1 minuto corsa / 2 minuti cammino, ripetuto), su superficie regolare, a ritmo conversazionale.',
        criteriaToProgress:
          'Nessun aumento di dolore il giorno dopo per 2 sessioni consecutive; il rapporto corsa/cammino può aumentare gradualmente (non più del 10-20% di carico settimanale in più rispetto alla settimana precedente).',
      },
      {
        phase: 'Fase 3 – Corsa continua leggera',
        goal:
          'Corsa continua a bassa intensità, volume ancora limitato, mantenendo 2 sedute di rinforzo settimanali per consolidare la capacità del gluteo.',
        criteriaToProgress:
          'Tollera 3 uscite a settimana senza infiammazione reattiva (dolore che dura oltre 24h); buona qualità del passo senza compensi visibili.',
      },
      {
        phase: 'Fase 4 – Ritorno al volume abituale',
        goal:
          'Reintroduzione gerarchica: prima il volume/la distanza, poi la frequenza, per ultima l\'intensità (salite, ripetute).',
        criteriaToProgress:
          'Il carico settimanale si avvicina all\'80% del volume pre-stop mantenuto per 2-3 settimane senza sintomi prima di considerare obiettivi di intensità o gara.',
      },
    ],
    redFlags: [
      'Dolore notturno che disturba il sonno, indipendente dal carico del giorno.',
      'Rigidità mattutina prolungata (oltre 30-60 minuti) o blocco articolare improvviso.',
      'Dolore che peggiora costantemente sessione dopo sessione nonostante il riposo relativo.',
      'Zoppia persistente anche a riposo, o forte limitazione del movimento non presente prima.',
      "In tutti questi casi: fermarsi e far valutare l'anca da un medico o fisioterapista prima di proseguire il piano.",
    ],
    references: [
      'Cochrane Database of Systematic Reviews, revisione su esercizio terapeutico nell\'artrosi d\'anca (aggiornamento 2026, Lawford et al.)',
      'JOSPT 2017 – revisione sistematica su corsa ricreativa/competitiva e rischio di artrosi di anca e ginocchio',
      'GHOst Trial protocol – esercizio gluteo mirato nell\'artrosi d\'anca',
    ],
  },
  {
    id: 'pfp_runners_knee',
    label: "Sindrome femoro-rotulea (ginocchio del corridore)",
    aliases: ['runners knee', 'ginocchio del corridore', 'dolore anteriore ginocchio', 'pfp', 'sindrome femoro rotulea'],
    summary:
      "È una delle cause più comuni di dolore anteriore al ginocchio nei runner, tipicamente peggiorata da scale, accosciate profonde e sedute prolungate. Il consenso internazionale degli esperti (Patellofemoral Pain Research Retreat) indica l'esercizio terapeutico come intervento di prima scelta, con la prognosi migliore quando si combinano rinforzo dell'anca e del ginocchio.",
    generalPrinciples: [
      "I programmi più efficaci combinano rinforzo del quadricipite con rinforzo dei muscoli dell'anca (medio gluteo, extrarotatori), non l'uno o l'altro da soli.",
      "Nella fase sintomatica è utile ridurre temporaneamente gli accosciamenti profondi (oltre i 90° di flessione) e le attività molto compressive, mantenendo però il carico in archi di movimento tollerati.",
      "La modifica della tecnica di corsa (aumento della cadenza del 5-10%, atterraggio più avampiede/mesopiede) può ridurre il carico sul ginocchio in alcuni corridori, ma va introdotta gradualmente per non creare nuovi sovraccarichi altrove.",
      "Il tasso di recidiva riportato in letteratura è alto se il rinforzo viene interrotto non appena il dolore scompare: i programmi efficaci proseguono per settimane anche dopo la remissione dei sintomi.",
    ],
    graduatedProtocol: [
      {
        phase: 'Fase 1 – Scarico e attivazione',
        goal: 'Ridurre attività molto compressive, iniziare isometrici di quadricipite ed esercizi per l\'anca (clamshell, abduzioni, ponte monopodalico).',
        criteriaToProgress: 'Dolore a riposo assente o minimo; isometrici tollerati senza aumento del dolore.',
      },
      {
        phase: 'Fase 2 – Rinforzo progressivo',
        goal: 'Squat parziali, affondi controllati, step-down, leg press in arco di movimento tollerato; cammino/bici senza dolore.',
        criteriaToProgress: 'Esegue 3x10-15 ripetizioni con carico progressivo senza dolore oltre soglia il giorno dopo.',
      },
      {
        phase: 'Fase 3 – Reintroduzione della corsa',
        goal: 'Cammina-corri su superficie piana, valutando eventualmente un piccolo aumento di cadenza; prosegue il rinforzo 2x/settimana.',
        criteriaToProgress: 'Nessun aumento di dolore a 24-48h; sale le scale senza sintomi.',
      },
      {
        phase: 'Fase 4 – Ritorno a volumi/intensità pre-infortunio',
        goal: 'Reintroduzione di salite, curve, superfici irregolari e lavori di intensità, un elemento alla volta.',
        criteriaToProgress: 'Tollera 2-3 settimane a volume quasi abituale prima di aggiungere qualità (ripetute, gare).',
      },
    ],
    redFlags: [
      'Gonfiore evidente e caldo al ginocchio, o blocco meccanico (il ginocchio "si incastra").',
      "Instabilità franca (il ginocchio 'cede') durante il cammino.",
      'Dolore notturno o dolore che non risponde affatto dopo 4-6 settimane di programma ben condotto.',
    ],
    references: [
      'Consensus statement Patellofemoral Pain Research Retreat, Manchester (Crossley et al. 2016) e aggiornamenti successivi',
      'Scoping review su rieducazione del gesto di corsa ed esercizi neuromuscolari in runner con PFP',
    ],
  },
  {
    id: 'achilles_tendinopathy',
    label: 'Tendinopatia achillea',
    aliases: ['tendine achille', 'achille infiammato', 'achilles tendinopathy', 'tendinite achillea'],
    summary:
      "La tendinopatia achillea (a livello del corpo del tendine o dell'inserzione calcaneare) risponde meglio a programmi di carico progressivo che al riposo puro: il tendine si adatta allo stress meccanico, e la remissione prolungata dall'attività tende a peggiorare la tolleranza al carico nel medio termine.",
    generalPrinciples: [
      "Il carico isometrico (es. sollevamenti sui polpacci mantenuti) è spesso usato nelle fasi iniziali o molto dolorose per ridurre il dolore mantenendo comunque uno stimolo sul tendine.",
      "Il protocollo eccentrico di Alfredson resta un riferimento storico, ma il consenso più recente tra esperti indica che diversi tipi di contrazione (isometrica, concentrica-eccentrica, pliometrica) hanno un ruolo nelle diverse fasi della riabilitazione, non solo l'eccentrico puro.",
      "Un principio pratico condiviso: il dolore durante l'esercizio fino a circa 3-5/10 è generalmente accettabile se rientra entro 24h, mentre dolore che peggiora di giorno in giorno indica un carico eccessivo.",
      "Per la forma inserzionale (vicino al calcagno) vanno evitati nelle fasi iniziali gli stretching in massima dorsiflessione e gli eccentrici a tallone fuori dal gradino, che possono irritare la zona di inserzione.",
    ],
    graduatedProtocol: [
      {
        phase: 'Fase 1 – Isometrico e scarico del picco',
        goal: 'Sollevamenti sui polpacci isometrici (mantenuti 30-45s), riduzione temporanea di salite/scatti, cammino tollerato.',
        criteriaToProgress: 'Dolore mattutino/rigidità in calo settimana su settimana.',
      },
      {
        phase: 'Fase 2 – Carico progressivo',
        goal: 'Sollevamenti sui polpacci concentrici-eccentrici, prima a due gambe poi monopodalici, con carico crescente.',
        criteriaToProgress: 'Esegue 3x15 sollevamenti monopodalici con controllo e dolore contenuto.',
      },
      {
        phase: 'Fase 3 – Energia elastica e cammina-corri',
        goal: 'Introduzione di piccoli balzi/saltelli controllati, poi cammina-corri su terreno regolare.',
        criteriaToProgress: 'Tollera balzi ripetuti senza dolore acuto; nessun peggioramento a 24h dopo il cammina-corri.',
      },
      {
        phase: 'Fase 4 – Corsa continua e intensità',
        goal: 'Ritorno graduale a volumi abituali, poi reintroduzione di salite, cambi di ritmo, superfici più dure.',
        criteriaToProgress: 'Il tendine tollera 2-3 settimane a carico quasi abituale prima di aggiungere qualità.',
      },
    ],
    redFlags: [
      "Dolore acuto e improvviso 'a schiocco' con perdita di forza nella spinta (possibile lesione/rottura): richiede valutazione medica urgente, non riabilitazione autogestita.",
      'Gonfiore diffuso e importante lungo il tendine con dolore che non regredisce affatto in 6-8 settimane di carico ben gestito.',
    ],
    references: [
      'Delphi consensus su parametri di esercizio per tendinopatia achillea, British Journal of Sports Medicine',
      'Studio pilota su programma a 4 stadi con carico isometrico progressivo nella tendinopatia achillea',
    ],
  },
  {
    id: 'bone_stress_injury',
    label: 'Frattura da stress / reazione da stress osseo',
    aliases: ['frattura da stress', 'stress fracture', 'periostite', 'reazione da stress', 'bone stress injury'],
    summary:
      "È l'infortunio da rientrare più cautamente: il tessuto osseo ha una capacità di guarigione più lenta e un fallimento 'silenzioso' più rischioso di un tendine o un muscolo. Le sedi 'ad alto rischio' (collo del femore, tibia anteriore, scafoide tarsale, base del 5° metatarso) richiedono un approccio ancora più conservativo delle sedi 'a basso rischio' (tibia posteromediale, metatarsi centrali).",
    generalPrinciples: [
      "Prima di reintrodurre la corsa, le linee guida indicano che dovrebbero essere risolti: dolorabilità alla palpazione dell'osso, cammino senza dolore, ed evidenza di guarigione radiologica nelle sedi ad alto rischio.",
      'La decisione su quando ripartire dovrebbe idealmente essere condivisa tra il runner e un professionista sanitario, non basata solo sul calendario.',
      "Il programma di rientro parte tipicamente da cammina-corri, con progressione della distanza prima della velocità, e con la comparsa di sintomi come criterio-guida per rallentare.",
      "Va sempre indagata la causa che ha contribuito alla frattura da stress (aumento troppo rapido dei volumi, deficit energetico, carenze nutrizionali, ciclo mestruale irregolare, cambio di scarpe/superficie): senza correggerla, il rischio di recidiva resta alto.",
    ],
    graduatedProtocol: [
      {
        phase: 'Fase 0 – Guarigione (prima della corsa)',
        goal: 'Scarico o carico protetto secondo indicazione medica, attività cross-training non a impatto (nuoto, bici, ellittica) se tollerate.',
        criteriaToProgress: "Nulla-osta esplicito di un medico/fisioterapista a iniziare il cammina-corri, non un'auto-valutazione.",
      },
      {
        phase: 'Fase 1 – Cammina-corri molto graduale',
        goal: 'Intervalli brevi di corsa su superficie regolare (es. 1 minuto corsa / 4 minuti cammino), a giorni alterni.',
        criteriaToProgress: 'Nessuna dolorabilità ossea né dolore durante o dopo per 3-4 sessioni consecutive.',
      },
      {
        phase: 'Fase 2 – Aumento molto conservativo del volume',
        goal: "Incremento della quota di corsa più lentamente rispetto a un rientro da infortunio muscolare/tendineo, restando ben sotto il classico +10% settimanale nelle prime settimane.",
        criteriaToProgress: 'Il carico osseo cumulato è tollerato per 2 settimane consecutive senza dolorabilità.',
      },
      {
        phase: 'Fase 3 – Ritorno al volume e poi all\'intensità',
        goal: "Solo dopo un volume stabile e asintomatico si reintroducono salite, terreni duri e lavori di velocità.",
        criteriaToProgress: 'Nessun sintomo osseo per diverse settimane a volume quasi abituale prima di aggiungere qualità.',
      },
    ],
    redFlags: [
      'Qualunque dolore osseo puntiforme, localizzato, che peggiora con il carico e migliora col riposo: va fatto valutare prima di continuare, non gestito da soli.',
      'Dolore notturno osseo.',
      'Sedi ad alto rischio (anca/collo femore, tibia anteriore, scafoide, base V metatarso): massima cautela, coinvolgimento medico indispensabile.',
    ],
    references: [
      'Scoping review su criteri e linee guida per il ritorno alla corsa dopo frattura da stress tibiale',
      'Revisione su prevenzione, riabilitazione e ritorno allo sport negli infortuni da overuse nel trail running',
    ],
  },
  {
    id: 'plantar_fasciitis',
    label: 'Fascite plantare',
    aliases: ['fascite plantare', 'plantar fasciitis', 'dolore sotto il piede', 'tallonite'],
    summary:
      "Tipicamente dolore sotto il tallone o l'arco plantare, più intenso ai primi passi del mattino. Come per i tendini, risponde meglio a un carico progressivo mirato che al solo riposo, anche se nelle fasi iniziali può essere utile ridurre temporaneamente il volume di corsa e l'impatto su superfici molto dure.",
    generalPrinciples: [
      "Protocolli di carico progressivo per la fascia plantare (es. sollevamenti sulle punte con l'alluce in estensione) mostrano risultati promettenti nel medio termine rispetto al solo stretching.",
      'La scelta della calzatura (ammortizzazione, supporto dell\'arco) e la gestione del carico giornaliero totale in piedi contano quanto il programma di esercizi specifico.',
      "Come regola pratica: dolore lieve durante l'attività che si attenua col riscaldamento e non peggiora il giorno dopo è generalmente gestibile; dolore che peggiora progressivamente richiede una riduzione del carico.",
    ],
    graduatedProtocol: [
      {
        phase: 'Fase 1 – Scarico relativo e carico isometrico',
        goal: 'Riduzione temporanea di corsa su terreni duri e di stazione eretta prolungata; inizio di carico progressivo della fascia plantare e rinforzo dei muscoli intrinseci del piede.',
        criteriaToProgress: 'Dolore mattutino ai primi passi in calo.',
      },
      {
        phase: 'Fase 2 – Cammina-corri',
        goal: 'Reintroduzione graduale della corsa su superfici morbide/regolari, mantenendo gli esercizi per il piede.',
        criteriaToProgress: 'Nessun peggioramento del dolore mattutino dopo le uscite.',
      },
      {
        phase: 'Fase 3 – Ritorno ai volumi abituali',
        goal: 'Incremento progressivo di volume e poi di intensità/terreni più impegnativi.',
        criteriaToProgress: 'Diverse settimane senza sintomi a volume quasi abituale.',
      },
    ],
    redFlags: [
      'Intorpidimento o formicolio (possibile componente nervosa, va differenziata da un fisioterapista/medico).',
      'Dolore che non migliora affatto dopo 6-8 settimane di gestione appropriata del carico.',
    ],
    references: [
      'Protocollo di carico progressivo per la fascia plantare (Rathleff et al.) e revisioni successive',
    ],
  },
  {
    id: 'long_layoff_detraining',
    label: 'Rientro dopo una lunga pausa (decondizionamento)',
    aliases: ['ripresa dopo pausa', 'rientro dopo stop', 'detraining', 'decondizionamento', 'ho smesso di correre'],
    summary:
      "Dopo settimane o mesi di stop, il sistema cardiovascolare perde capacità più rapidamente della forza muscolare: dopo circa due settimane di stop il VO2max e il volume plasmatico iniziano già a calare, mentre forza e resistenza muscolare restano relativamente preservate più a lungo. Questo significa che ci si può sentire 'sulle gambe' ma affannati: è normale, e chi ha già una storia di allenamento tende a recuperare più velocemente di chi parte da zero, perché parte degli adattamenti strutturali (compresa parte dell'architettura muscolare) resta parzialmente presente anche dopo mesi di pausa.",
    generalPrinciples: [
      "Come riferimento pratico riportato in ambito di allenamento (non una regola rigida): un runner che ha fermato per circa 6 mesi può realisticamente riavvicinarsi al proprio volume precedente in 8-12 settimane di ripresa strutturata; chi riparte da zero impiega tipicamente più a lungo.",
      "Allenarsi 'a sensazione'/frequenza cardiaca nelle prime settimane, invece che inseguire i ritmi pre-stop, riduce il rischio di infortunio da sovraccarico in tessuti che non sono più abituati al carico specifico della corsa.",
      "Il principio più citato per il rientro è evitare salti bruschi nella singola uscita più lunga: superare di molto (es. oltre il 10%) la distanza più lunga percorsa nell'ultimo mese è associato a un rischio di infortunio più alto.",
      "Se il periodo di stop è dovuto a un problema medico o ortopedico specifico (non solo mancanza di tempo/motivazione), il rientro va combinato con il protocollo specifico per quella condizione, non gestito come un semplice de-allenamento.",
    ],
    graduatedProtocol: [
      {
        phase: 'Settimane 1-2 – Ripartenza aerobica',
        goal: 'Cammina-corri a bassa intensità, 3-4 volte a settimana, ritmo conversazionale, nessun obiettivo di passo.',
        criteriaToProgress: 'Recupero pieno tra una sessione e l\'altra, nessun dolore muscoloscheletrico oltre il normale indolenzimento.',
      },
      {
        phase: 'Settimane 3-5 – Consolidamento',
        goal: 'Aumento graduale della quota di corsa continua, introduzione di 1-2 sedute di rinforzo generale a settimana.',
        criteriaToProgress: 'Il carico settimanale sale di non più del 10-20% rispetto alla settimana precedente, restando stabile per almeno 2 settimane prima di un ulteriore salto.',
      },
      {
        phase: 'Settimane 6-10 – Ritorno al volume abituale',
        goal: 'Avvicinamento progressivo al volume settimanale pre-stop, ancora senza lavori di intensità elevata.',
        criteriaToProgress: 'Raggiunge circa l\'80% del volume pre-stop per 2-3 settimane senza sintomi.',
      },
      {
        phase: 'Dopo la settimana 10 – Reintroduzione dell\'intensità',
        goal: 'Solo a questo punto si reintroducono ripetute, tempo run e obiettivi di gara, in modo graduale.',
        criteriaToProgress: 'Nessun infortunio o dolore persistente nelle fasi precedenti.',
      },
    ],
    redFlags: [
      'Dolore articolare (non muscolare) che compare con la ripresa e non migliora entro pochi giorni.',
      'Affaticamento sproporzionato, capogiri o dolore toracico durante lo sforzo: va sempre indagato prima di proseguire, specie se non ci si è mai sottoposti a una valutazione cardiologica dopo una lunga pausa e in presenza di fattori di rischio.',
    ],
    references: [
      'Letteratura su decondizionamento cardiorespiratorio dopo periodi di stop (Mujika & Padilla; studi su atleti master)',
      "Analisi epidemiologiche su incremento del carico e rischio di infortunio nel running",
    ],
  },
  {
    id: 'general_return_to_running',
    label: 'Principi generali di ritorno alla corsa dopo infortunio',
    aliases: ['ritorno alla corsa', 'return to running', 'rientro da infortunio', 'protocollo generico'],
    summary:
      "Al di là della patologia specifica, la letteratura su vari tipi di infortunio da corsa converge su alcuni principi comuni per il rientro, che l'assistente di Ripartenza usa come cornice generale quando non è disponibile (o non è necessario) un protocollo più specifico.",
    generalPrinciples: [
      "Progredire prima la distanza/il volume, poi la frequenza, e per ultima l'intensità (salite, ripetute, gare): è l'ordine con cui la maggior parte dei protocolli di rientro introduce il carico.",
      "Il cammina-corri è lo strumento più usato per reintrodurre l'impatto in modo graduale, indipendentemente dal tessuto coinvolto.",
      'Il carico di allenamento inappropriato (aumenti troppo rapidi) è stimato come causa contribuente nella maggioranza degli infortuni da corsa: il rapporto tra carico recente e carico abituale è più predittivo del solo volume assoluto.',
      "Un criterio pragmatico diffuso in riabilitazione sportiva: dolore fino a circa 3-4/10 durante l'attività, che rientra entro 24h, è generalmente accettabile; dolore che sale progressivamente sessione dopo sessione non lo è.",
      "Avanzare in base a criteri oggettivi di capacità del tessuto (es. test di forza, salti, giorni consecutivi senza sintomi) è preferibile ad avanzare solo 'perché è passata una settimana sul calendario'.",
    ],
    graduatedProtocol: [
      {
        phase: 'Fase 1 – Gestione dei sintomi',
        goal: 'Ridurre il carico che provoca dolore, mantenere attività non dolorose (cross-training, rinforzo mirato).',
        criteriaToProgress: 'Dolore a riposo assente o minimo e stabile.',
      },
      {
        phase: 'Fase 2 – Ricostruzione della capacità',
        goal: 'Rinforzo progressivo dei tessuti coinvolti, ripristino di mobilità e controllo motorio.',
        criteriaToProgress: 'Supera i test di carico/forza specifici per il tessuto coinvolto senza dolore.',
      },
      {
        phase: 'Fase 3 – Reintroduzione della corsa',
        goal: 'Cammina-corri, poi corsa continua leggera, con progressione lenta del volume.',
        criteriaToProgress: 'Nessun aumento di sintomi a 24-48h per sessioni consecutive.',
      },
      {
        phase: 'Fase 4 – Ritorno alla normale attività/gara',
        goal: 'Reintroduzione di intensità e specificità (salite, ripetute, superfici di gara).',
        criteriaToProgress: 'Volume vicino all\'abituale mantenuto per alcune settimane senza sintomi prima di aggiungere qualità.',
      },
    ],
    redFlags: [
      'Dolore che peggiora progressivamente nonostante la gestione del carico.',
      'Gonfiore, blocco articolare, instabilità, dolore notturno o dolore osseo puntiforme.',
      'Qualsiasi dubbio diagnostico: la valutazione di un medico o fisioterapista viene sempre prima di seguire un protocollo generico.',
    ],
    references: [
      "Sintesi di più fonti cliniche e di medicina dello sport su gestione del carico e criteri di progressione nel ritorno alla corsa",
    ],
  },
];

export function findKnowledgeBaseEntry(idOrAlias: string): KnowledgeBaseEntry | undefined {
  const q = idOrAlias.trim().toLowerCase();
  return KNOWLEDGE_BASE.find(
    (e) => e.id === q || e.label.toLowerCase() === q || e.aliases.some((a) => a.toLowerCase() === q)
  );
}

// Ricerca "morbida" per keyword, usata per costruire il contesto medico
// dell'assistente a partire dal profilo medico dell'utente (testo libero incluso).
export function searchKnowledgeBase(query: string): KnowledgeBaseEntry[] {
  const q = query.toLowerCase();
  return KNOWLEDGE_BASE.filter(
    (e) =>
      q.includes(e.id.replace(/_/g, ' ')) ||
      e.aliases.some((alias) => q.includes(alias.toLowerCase())) ||
      q.includes(e.label.toLowerCase())
  );
}
