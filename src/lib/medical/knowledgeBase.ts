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
		id: "hip_oa",
		label: "Artrosi dell'anca (coxartrosi)",
		aliases: ["artrosi anca", "coxartrosi", "hip osteoarthritis", "hip oa", "usura anca"],
		summary:
			"L'artrosi dell'anca, nelle forme lievi-moderate e in assenza di red flag, non è di per sé una controindicazione assoluta alla corsa: le revisioni su popolazioni di podisti mostrano che la corsa ricreativa a carichi moderati, per storie di corsa inferiori a circa 15 anni, non è associata a un aumento del rischio di artrosi d'anca o ginocchio rispetto ai non-runner, e sembra anzi associata a una prevalenza più bassa rispetto a uno stile di vita sedentario, mentre volumi molto elevati e anni di corsa competitiva si associano a un rischio maggiore.",
		generalPrinciples: [
			"Tutte le principali linee guida internazionali raccomandano l'esercizio terapeutico come componente di prima linea nel trattamento dell'artrosi d'anca, con benefici medi mediamente piccoli-moderati su dolore e funzione: non è una 'cura' definitiva, ma una base su cui costruire capacità di carico, autonomia e gestione a lungo termine.",
			"Non esiste un unico 'esercizio migliore': programmi che combinano rinforzo (in particolare muscolatura glutea e abduttoria), esercizi aerobici, lavoro di equilibrio e mobilità hanno efficacia paragonabile, per cui va scelto ciò che è sostenibile per la persona nel tempo.",
			"Il rinforzo del medio e grande gluteo e il controllo motorio dell'anca (evitare il collasso del bacino in appoggio monopodalico, migliorare la stabilità durante squat, step-up, single-leg stance) sono obiettivi centrali nei protocolli di riabilitazione per l'anca, supportati da studi che mostrano come interventi mirati sui glutei possano modificare la cinematica e il carico articolare durante il passo.",
			"Molte persone con artrosi d'anca camminano con carichi articolari alterati: il lavoro su forza, controllo del tronco e pattern di deambulazione (gait retraining) è parte integrante del trattamento, insieme alla scelta graduale della superficie di corsa (inizialmente più regolare e cedevole) e all'evitare per quanto possibile dislivelli importanti nelle fasi iniziali.",
			"L'educazione sul fatto che il carico meccanico ben dosato non 'consuma' automaticamente la cartilagine, e che la corsa a volumi ricreativi può essere compatibile con la patologia, aiuta a ridurre la paura del movimento (chinesiofobia) e a favorire l'aderenza agli esercizi.",
			"Il dolore durante l'attività non è automaticamente un segnale di danno: in riabilitazione si utilizza spesso un criterio pragmatico di tollerabilità intorno a 3–4/10 durante l'esercizio, con ritorno al livello basale entro la mattina successiva; dolore che aumenta di giorno in giorno, che persiste oltre 24–48 ore o che modifica il passo indica un carico eccessivo da ridurre o modulare.",
			"La progressione del carico (cammino, corsa, rinforzo) dovrebbe essere guidata da criteri oggettivi (tempo o distanza tollerati senza peggioramento, test di forza, test funzionali come sit-to-stand, 6-minute walk test) più che da scadenze rigide sul calendario."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Base e controllo dei sintomi",
				goal: "Camminata regolare senza dolore significativo, rinforzo dell'anca (ponte, clamshell, abduzioni laterali, step-up controllati, esercizi di equilibrio) 2-3 volte a settimana, mobilità in flessione/estensione/rotazione dell'anca, educazione sui criteri di carico.",
				criteriaToProgress:
					"Cammina 30–45 minuti su terreno regolare a passo sostenuto senza dolore oltre soglia né zoppia il giorno stesso o quello successivo; sale/scende le scale senza cedimento del bacino; esegue uno squat monopodalico parziale o uno step-down basso con buon controllo."
			},
			{
				phase: "Fase 2 – Cammina-corri strutturato",
				goal: "Introduzione di brevi tratti di corsa alternati a cammino (es. 1 minuto corsa / 2–3 minuti cammino, ripetuti), su superficie regolare e tendenzialmente morbida, a ritmo conversazionale, mantenendo 2 sedute di rinforzo settimanali.",
				criteriaToProgress:
					"Nessun aumento significativo di dolore o rigidità a 24–48 ore dopo 2–3 sessioni consecutive; l'utente tollera il rapporto corsa/cammino corrente percependo il dolore entro i limiti concordati (≤3–4/10) e senza peggioramento progressivo; il volume di corsa può aumentare non più del 10–20% a settimana rispetto al carico tollerato nella settimana precedente."
			},
			{
				phase: "Fase 3 – Corsa continua leggera",
				goal: "Transizione da cammina-corri a tratti di corsa continua a bassa intensità, con volume ancora limitato e giorni di recupero tra le uscite di corsa, mantenendo il rinforzo di anca e core per consolidare la capacità di carico.",
				criteriaToProgress:
					"Tollera 3 uscite a settimana con tratti di corsa continua senza infiammazione reattiva (dolore che dura oltre 24h o peggiora di sessione in sessione); qualità del passo discreta, senza compensi visibili importanti o zoppia; riesce a identificare un 'baseline' di distanza/tempo di corsa che non peggiora i sintomi a 48h."
			},
			{
				phase: "Fase 4 – Ritorno al volume abituale e modulazione del carico",
				goal: "Reintroduzione gerarchica del carico: prima il volume/la distanza fino ad avvicinarsi all'80% del volume pre-stop, poi la frequenza delle uscite, e solo per ultima l'intensità (salite, ripetute, trail tecnico), con attenzione particolare a discese e variazioni brusche di carico.",
				criteriaToProgress:
					"Il carico settimanale si avvicina all'80% del volume pre-stop mantenuto per 2–3 settimane senza sintomi significativi o regressioni; nessun dolore notturno o zoppia persistente; l'utente mantiene esercizi di rinforzo e ha strategie chiare per ridurre temporaneamente il carico se i sintomi aumentano."
			}
		],
		redFlags: [
			"Dolore notturno che disturba il sonno in modo ricorrente, indipendente dal carico del giorno.",
			"Rigidità mattutina marcata e prolungata (oltre 30–60 minuti) o blocco articolare improvviso che limita fortemente il movimento rispetto al solito.",
			"Dolore che peggiora costantemente sessione dopo sessione nonostante la riduzione del carico, o che richiede farmaci antidolorifici sempre più forti per essere gestito.",
			"Zoppia persistente anche a riposo o nel cammino quotidiano, o forte limitazione del movimento non presente prima.",
			"Dolore profondo in sede inguinale o a livello del femore che peggiora nettamente con il carico e migliora solo con riposo prolungato: va esclusa la presenza di lesioni da stress osseo o altre patologie serie.",
			"In tutti questi casi: fermarsi e far valutare l'anca da un medico o fisioterapista prima di proseguire il piano di corsa o aumentare il carico."
		],
		references: [
			"Cochrane Review 2026 su esercizio terapeutico nell'artrosi d'anca: piccoli-moderati miglioramenti medi di dolore e funzione rispetto a nessun esercizio, con ampia variabilità individuale.",
			"Young et al. 2023 – revisione su exercise therapy per ginocchio e anca: tutti i principali tipi di esercizio (aerobico, rinforzo, flessibilità) hanno efficacia comparabile quando ben dosati.",
			"Krauß et al. 2014 – trial randomizzato: 12 settimane di esercizio in pazienti con artrosi d'anca riducono il dolore e migliorano la funzione rispetto a controllo.",
			"Bennell et al. 2014 (JAMA) – confronto tra fisioterapia attiva e sham in OA d'anca: risultati contrastanti sull'effetto globale, a supporto di un'aspettativa realistica sugli esiti.",
			"Alentorn-Geli et al. 2017 – meta-analisi su corsa ricreativa/competitiva e rischio di OA di anca/ginocchio: prevalenza più bassa di OA nei runner ricreativi rispetto a sedentari e corridori competitivi con lunghi anni di esposizione.",
			"Williams et al. 2013 – analisi su cammino e corsa e rischio di OA/arthroplasty: corsa associata a minor rischio rispetto ad altre forme di esercizio, in parte mediato da BMI più basso.",
			"Revisioni 2022–2024 su attività fisica e progressione di OA: evidenza consistente che cammino e corsa a basso-moderato volume non accelerano la progressione strutturale e possono essere compatibili con la malattia.",
			"Linee guida cliniche 2025 per l'artrosi d'anca: forte raccomandazione per esercizio, manual therapy, educazione, training di equilibrio/gait; uso di scale come HOOS/WOMAC e test funzionali per monitoraggio.",
			"GHoST trial e studi correlati su esercizi glutei nell'artrosi d'anca: programmi mirati ai glutei migliorano attivazione e controllo durante il passo e sono promettenti sul piano sintomatologico.",
			"Articoli su return to running dopo chirurgia d'anca: protocolli a fasi che richiedono cammino 30’ pain-free, introduzione graduale di cammina-corri, attenzione a collinare e velocità, con monitoraggio dei sintomi a 24–48h."
		]
	},
	{
		id: "pfp_runners_knee",
		label: "Sindrome femoro-rotulea (ginocchio del corridore)",
		aliases: ["runners knee", "ginocchio del corridore", "dolore anteriore ginocchio", "pfp", "sindrome femoro rotulea"],
		summary:
			"È una delle cause più comuni di dolore anteriore al ginocchio nei runner, tipicamente peggiorata da scale, accosciate profonde e sedute prolungate. Il consenso internazionale degli esperti (Patellofemoral Pain Research Retreat) indica l'esercizio terapeutico come intervento di prima scelta, con la prognosi migliore quando si combinano rinforzo dell'anca e del ginocchio.",
		generalPrinciples: [
			"I programmi più efficaci combinano rinforzo del quadricipite con rinforzo dei muscoli dell'anca (medio gluteo, extrarotatori), non l'uno o l'altro da soli.",
			"Nella fase sintomatica è utile ridurre temporaneamente gli accosciamenti profondi (oltre i 90° di flessione) e le attività molto compressive, mantenendo però il carico in archi di movimento tollerati.",
			"La modifica della tecnica di corsa (aumento della cadenza del 5–10%, atterraggio più avampiede/mesopiede) può ridurre il carico sul ginocchio in alcuni corridori, ma va introdotta gradualmente per non creare nuovi sovraccarichi altrove.",
			"Il tasso di recidiva riportato in letteratura è alto se il rinforzo viene interrotto non appena il dolore scompare: i programmi efficaci proseguono per settimane anche dopo la remissione dei sintomi."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Scarico e attivazione",
				goal: "Ridurre attività molto compressive, iniziare isometrici di quadricipite ed esercizi per l'anca (clamshell, abduzioni, ponte monopodalico).",
				criteriaToProgress: "Dolore a riposo assente o minimo; isometrici tollerati senza aumento del dolore."
			},
			{
				phase: "Fase 2 – Rinforzo progressivo",
				goal: "Squat parziali, affondi controllati, step-down, leg press in arco di movimento tollerato; cammino/bici senza dolore.",
				criteriaToProgress: "Esegue 3x10–15 ripetizioni con carico progressivo senza dolore oltre soglia il giorno dopo."
			},
			{
				phase: "Fase 3 – Reintroduzione della corsa",
				goal: "Cammina-corri su superficie piana, valutando eventualmente un piccolo aumento di cadenza; prosegue il rinforzo 2x/settimana.",
				criteriaToProgress: "Nessun aumento di dolore a 24–48h; sale le scale senza sintomi."
			},
			{
				phase: "Fase 4 – Ritorno a volumi/intensità pre-infortunio",
				goal: "Reintroduzione di salite, curve, superfici irregolari e lavori di intensità, un elemento alla volta.",
				criteriaToProgress: "Tollera 2–3 settimane a volume quasi abituale prima di aggiungere qualità (ripetute, gare)."
			}
		],
		redFlags: [
			'Gonfiore evidente e caldo al ginocchio, o blocco meccanico (il ginocchio "si incastra").',
			"Instabilità franca (il ginocchio 'cede') durante il cammino.",
			"Dolore notturno o dolore che non risponde affatto dopo 4–6 settimane di programma ben condotto."
		],
		references: [
			"Consensus statement Patellofemoral Pain Research Retreat (Crossley et al. 2016) e aggiornamenti successivi.",
			"Scoping review su rieducazione del gesto di corsa ed esercizi neuromuscolari in runner con PFP."
		]
	},
	{
		id: "achilles_tendinopathy",
		label: "Tendinopatia achillea",
		aliases: ["tendine achille", "achille infiammato", "achilles tendinopathy", "tendinite achillea"],
		summary:
			"La tendinopatia achillea (a livello del corpo del tendine o dell'inserzione calcaneare) risponde meglio a programmi di carico progressivo che al riposo puro: il tendine si adatta allo stress meccanico, e la remissione prolungata dall'attività tende a peggiorare la tolleranza al carico nel medio termine.",
		generalPrinciples: [
			"Il carico isometrico (es. sollevamenti sui polpacci mantenuti) è spesso usato nelle fasi iniziali o molto dolorose per ridurre il dolore mantenendo comunque uno stimolo sul tendine.",
			"Il protocollo eccentrico di Alfredson resta un riferimento storico, ma il consenso più recente tra esperti indica che diversi tipi di contrazione (isometrica, concentrica-eccentrica, pliometrica) hanno un ruolo nelle diverse fasi della riabilitazione, non solo l'eccentrico puro.",
			"Un principio pratico condiviso: il dolore durante l'esercizio fino a circa 3–5/10 è generalmente accettabile se rientra entro 24h, mentre dolore che peggiora di giorno in giorno indica un carico eccessivo.",
			"Per la forma inserzionale (vicino al calcagno) vanno evitati nelle fasi iniziali gli stretching in massima dorsiflessione e gli eccentrici a tallone fuori dal gradino, che possono irritare la zona di inserzione."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Isometrico e scarico del picco",
				goal: "Sollevamenti sui polpacci isometrici (mantenuti 30–45s), riduzione temporanea di salite/scatti, cammino tollerato.",
				criteriaToProgress: "Dolore mattutino/rigidità in calo settimana su settimana."
			},
			{
				phase: "Fase 2 – Carico progressivo",
				goal: "Sollevamenti sui polpacci concentrici-eccentrici, prima a due gambe poi monopodalici, con carico crescente.",
				criteriaToProgress: "Esegue 3x15 sollevamenti monopodalici con controllo e dolore contenuto."
			},
			{
				phase: "Fase 3 – Energia elastica e cammina-corri",
				goal: "Introduzione di piccoli balzi/saltelli controllati, poi cammina-corri su terreno regolare.",
				criteriaToProgress: "Tollera balzi ripetuti senza dolore acuto; nessun peggioramento a 24h dopo il cammina-corri."
			},
			{
				phase: "Fase 4 – Corsa continua e intensità",
				goal: "Ritorno graduale a volumi abituali, poi reintroduzione di salite, cambi di ritmo, superfici più dure.",
				criteriaToProgress: "Il tendine tollera 2–3 settimane a carico quasi abituale prima di aggiungere qualità."
			}
		],
		redFlags: [
			"Dolore acuto e improvviso 'a schiocco' con perdita di forza nella spinta (possibile lesione/rottura): richiede valutazione medica urgente, non riabilitazione autogestita.",
			"Gonfiore diffuso e importante lungo il tendine con dolore che non regredisce affatto in 6–8 settimane di carico ben gestito."
		],
		references: [
			"Delphi consensus su parametri di esercizio per tendinopatia achillea, British Journal of Sports Medicine.",
			"Studio pilota su programma a 4 stadi con carico isometrico progressivo nella tendinopatia achillea."
		]
	},
	{
		id: "bone_stress_injury",
		label: "Frattura da stress / reazione da stress osseo",
		aliases: ["frattura da stress", "stress fracture", "periostite", "reazione da stress", "bone stress injury"],
		summary:
			"È l'infortunio da rientrare più cautamente: il tessuto osseo ha una capacità di guarigione più lenta e un fallimento 'silenzioso' più rischioso di un tendine o un muscolo. Le sedi 'ad alto rischio' (collo del femore, tibia anteriore, scafoide tarsale, base del 5° metatarso) richiedono un approccio ancora più conservativo delle sedi 'a basso rischio' (tibia posteromediale, metatarsi centrali).",
		generalPrinciples: [
			"Prima di reintrodurre la corsa, le linee guida indicano che dovrebbero essere risolti: dolorabilità alla palpazione dell'osso, cammino senza dolore, ed evidenza di guarigione radiologica nelle sedi ad alto rischio.",
			"La decisione su quando ripartire dovrebbe idealmente essere condivisa tra il runner e un professionista sanitario, non basata solo sul calendario.",
			"Il programma di rientro parte tipicamente da cammina-corri, con progressione della distanza prima della velocità, e con la comparsa di sintomi come criterio-guida per rallentare.",
			"Va sempre indagata la causa che ha contribuito alla frattura da stress (aumento troppo rapido dei volumi, deficit energetico, carenze nutrizionali, ciclo mestruale irregolare, cambio di scarpe/superficie): senza correggerla, il rischio di recidiva resta alto."
		],
		graduatedProtocol: [
			{
				phase: "Fase 0 – Guarigione (prima della corsa)",
				goal: "Scarico o carico protetto secondo indicazione medica, attività cross-training non a impatto (nuoto, bici, ellittica) se tollerate.",
				criteriaToProgress: "Nulla-osta esplicito di un medico/fisioterapista a iniziare il cammina-corri, non un'auto-valutazione."
			},
			{
				phase: "Fase 1 – Cammina-corri molto graduale",
				goal: "Intervalli brevi di corsa su superficie regolare (es. 1 minuto corsa / 4 minuti cammino), a giorni alterni.",
				criteriaToProgress: "Nessuna dolorabilità ossea né dolore durante o dopo per 3–4 sessioni consecutive."
			},
			{
				phase: "Fase 2 – Aumento molto conservativo del volume",
				goal: "Incremento della quota di corsa più lentamente rispetto a un rientro da infortunio muscolare/tendineo, restando ben sotto il classico +10% settimanale nelle prime settimane.",
				criteriaToProgress: "Il carico osseo cumulato è tollerato per 2 settimane consecutive senza dolorabilità."
			},
			{
				phase: "Fase 3 – Ritorno al volume e poi all'intensità",
				goal: "Solo dopo un volume stabile e asintomatico si reintroducono salite, terreni duri e lavori di velocità.",
				criteriaToProgress: "Nessun sintomo osseo per diverse settimane a volume quasi abituale prima di aggiungere qualità."
			}
		],
		redFlags: [
			"Qualunque dolore osseo puntiforme, localizzato, che peggiora con il carico e migliora col riposo: va fatto valutare prima di continuare, non gestito da soli.",
			"Dolore notturno osseo.",
			"Sedi ad alto rischio (anca/collo femore, tibia anteriore, scafoide, base V metatarso): massima cautela, coinvolgimento medico indispensabile."
		],
		references: [
			"Scoping review su criteri e linee guida per il ritorno alla corsa dopo frattura da stress tibiale.",
			"Revisione su prevenzione, riabilitazione e ritorno allo sport negli infortuni da overuse nel trail running."
		]
	},
	{
		id: "plantar_fasciitis",
		label: "Fascite plantare",
		aliases: ["fascite plantare", "plantar fasciitis", "dolore sotto il piede", "tallonite"],
		summary:
			"Tipicamente dolore sotto il tallone o l'arco plantare, più intenso ai primi passi del mattino. Come per i tendini, risponde meglio a un carico progressivo mirato che al solo riposo, anche se nelle fasi iniziali può essere utile ridurre temporaneamente il volume di corsa e l'impatto su superfici molto dure.",
		generalPrinciples: [
			"Protocolli di carico progressivo per la fascia plantare (es. sollevamenti sulle punte con l'alluce in estensione) mostrano risultati promettenti nel medio termine rispetto al solo stretching.",
			"La scelta della calzatura (ammortizzazione, supporto dell'arco) e la gestione del carico giornaliero totale in piedi contano quanto il programma di esercizi specifico.",
			"Come regola pratica: dolore lieve durante l'attività che si attenua col riscaldamento e non peggiora il giorno dopo è generalmente gestibile; dolore che peggiora progressivamente richiede una riduzione del carico."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Scarico relativo e carico isometrico",
				goal: "Riduzione temporanea di corsa su terreni duri e di stazione eretta prolungata; inizio di carico progressivo della fascia plantare e rinforzo dei muscoli intrinseci del piede.",
				criteriaToProgress: "Dolore mattutino ai primi passi in calo."
			},
			{
				phase: "Fase 2 – Cammina-corri",
				goal: "Reintroduzione graduale della corsa su superfici morbide/regolari, mantenendo gli esercizi per il piede.",
				criteriaToProgress: "Nessun peggioramento del dolore mattutino dopo le uscite."
			},
			{
				phase: "Fase 3 – Ritorno ai volumi abituali",
				goal: "Incremento progressivo di volume e poi di intensità/terreni più impegnativi.",
				criteriaToProgress: "Diverse settimane senza sintomi a volume quasi abituale."
			}
		],
		redFlags: [
			"Intorpidimento o formicolio (possibile componente nervosa, va differenziata da un fisioterapista/medico).",
			"Dolore che non migliora affatto dopo 6–8 settimane di gestione appropriata del carico."
		],
		references: ["Protocollo di carico progressivo per la fascia plantare (Rathleff et al.) e revisioni successive."]
	},
	{
		id: "long_layoff_detraining",
		label: "Rientro dopo una lunga pausa (decondizionamento)",
		aliases: ["ripresa dopo pausa", "rientro dopo stop", "detraining", "decondizionamento", "ho smesso di correre"],
		summary:
			"Dopo settimane o mesi di stop, il sistema cardiovascolare perde capacità più rapidamente della forza muscolare: dopo circa due settimane di stop il VO2max e il volume plasmatico iniziano già a calare, mentre forza e resistenza muscolare restano relativamente preservate più a lungo. Questo significa che ci si può sentire 'sulle gambe' ma affannati: è normale, e chi ha già una storia di allenamento tende a recuperare più velocemente di chi parte da zero, perché parte degli adattamenti strutturali (compresa parte dell'architettura muscolare) resta parzialmente presente anche dopo mesi di pausa.",
		generalPrinciples: [
			"Come riferimento pratico riportato in ambito di allenamento (non una regola rigida): un runner che ha fermato per circa 6 mesi può realisticamente riavvicinarsi al proprio volume precedente in 8–12 settimane di ripresa strutturata; chi riparte da zero impiega tipicamente più a lungo.",
			"Allenarsi 'a sensazione'/frequenza cardiaca nelle prime settimane, invece che inseguire i ritmi pre-stop, riduce il rischio di infortunio da sovraccarico in tessuti che non sono più abituati al carico specifico della corsa.",
			"Il principio più citato per il rientro è evitare salti bruschi nella singola uscita più lunga: superare di molto (es. oltre il 10%) la distanza più lunga percorsa nell'ultimo mese è associato a un rischio di infortunio più alto.",
			"Se il periodo di stop è dovuto a un problema medico o ortopedico specifico (non solo mancanza di tempo/motivazione), il rientro va combinato con il protocollo specifico per quella condizione, non gestito come un semplice de-allenamento."
		],
		graduatedProtocol: [
			{
				phase: "Settimane 1–2 – Ripartenza aerobica",
				goal: "Cammina-corri a bassa intensità, 3–4 volte a settimana, ritmo conversazionale, nessun obiettivo di passo.",
				criteriaToProgress: "Recupero pieno tra una sessione e l'altra, nessun dolore muscoloscheletrico oltre il normale indolenzimento."
			},
			{
				phase: "Settimane 3–5 – Consolidamento",
				goal: "Aumento graduale della quota di corsa continua, introduzione di 1–2 sedute di rinforzo generale a settimana.",
				criteriaToProgress: "Il carico settimanale sale di non più del 10–20% rispetto alla settimana precedente, restando stabile per almeno 2 settimane prima di un ulteriore salto."
			},
			{
				phase: "Settimane 6–10 – Ritorno al volume abituale",
				goal: "Avvicinamento progressivo al volume settimanale pre-stop, ancora senza lavori di intensità elevata.",
				criteriaToProgress: "Raggiunge circa l'80% del volume pre-stop per 2–3 settimane senza sintomi."
			},
			{
				phase: "Dopo la settimana 10 – Reintroduzione dell'intensità",
				goal: "Solo a questo punto si reintroducono ripetute, tempo run e obiettivi di gara, in modo graduale.",
				criteriaToProgress: "Nessun infortunio o dolore persistente nelle fasi precedenti."
			}
		],
		redFlags: [
			"Dolore articolare (non muscolare) che compare con la ripresa e non migliora entro pochi giorni.",
			"Affaticamento sproporzionato, capogiri o dolore toracico durante lo sforzo: va sempre indagato prima di proseguire, specie se non ci si è mai sottoposti a una valutazione cardiologica dopo una lunga pausa e in presenza di fattori di rischio."
		],
		references: [
			"Letteratura su decondizionamento cardiorespiratorio dopo periodi di stop (Mujika & Padilla; studi su atleti master).",
			"Analisi epidemiologiche su incremento del carico e rischio di infortunio nel running."
		]
	},
	{
		id: "general_return_to_running",
		label: "Principi generali di ritorno alla corsa dopo infortunio",
		aliases: ["ritorno alla corsa", "return to running", "rientro da infortunio", "protocollo generico"],
		summary:
			"Al di là della patologia specifica, la letteratura su vari tipi di infortunio da corsa converge su alcuni principi comuni per il rientro, che l'assistente di Ripartenza usa come cornice generale quando non è disponibile (o non è necessario) un protocollo più specifico.",
		generalPrinciples: [
			"Progredire prima la distanza/il volume, poi la frequenza, e per ultima l'intensità (salite, ripetute, gare): è l'ordine con cui la maggior parte dei protocolli di rientro introduce il carico.",
			"Il cammina-corri è lo strumento più usato per reintrodurre l'impatto in modo graduale, indipendentemente dal tessuto coinvolto.",
			"Il carico di allenamento inappropriato (aumenti troppo rapidi) è stimato come causa contribuente nella maggioranza degli infortuni da corsa: il rapporto tra carico recente e carico abituale è più predittivo del solo volume assoluto.",
			"Un criterio pragmatico diffuso in riabilitazione sportiva: dolore fino a circa 3–4/10 durante l'attività, che rientra entro 24h, è generalmente accettabile; dolore che sale progressivamente sessione dopo sessione non lo è.",
			"Avanzare in base a criteri oggettivi di capacità del tessuto (es. test di forza, salti, giorni consecutivi senza sintomi) è preferibile ad avanzare solo 'perché è passata una settimana sul calendario'.",
			"Per definire i ritmi di lavoro nelle fasi avanzate è utile basarsi su test campo validati (es. test di 12 minuti tipo Cooper per stimare VO2max, time trial di 20–30 minuti per stimare la soglia, test sui 3–5km) piuttosto che su riferimenti generici: questo permette di calibrare zone di intensità e progressioni in modo più individualizzato."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Gestione dei sintomi",
				goal: "Ridurre il carico che provoca dolore, mantenere attività non dolorose (cross-training, rinforzo mirato).",
				criteriaToProgress: "Dolore a riposo assente o minimo e stabile."
			},
			{
				phase: "Fase 2 – Ricostruzione della capacità",
				goal: "Rinforzo progressivo dei tessuti coinvolti, ripristino di mobilità e controllo motorio.",
				criteriaToProgress: "Supera i test di carico/forza specifici per il tessuto coinvolto senza dolore."
			},
			{
				phase: "Fase 3 – Reintroduzione della corsa",
				goal: "Cammina-corri, poi corsa continua leggera, con progressione lenta del volume.",
				criteriaToProgress: "Nessun aumento di sintomi a 24–48h per sessioni consecutive."
			},
			{
				phase: "Fase 4 – Ritorno alla normale attività/gara",
				goal: "Reintroduzione di intensità e specificità (salite, ripetute, superfici di gara).",
				criteriaToProgress: "Volume vicino all'abituale mantenuto per alcune settimane senza sintomi prima di aggiungere qualità."
			}
		],
		redFlags: [
			"Dolore che peggiora progressivamente nonostante la gestione del carico.",
			"Gonfiore, blocco articolare, instabilità, dolore notturno o dolore osseo puntiforme.",
			"Qualsiasi dubbio diagnostico: la valutazione di un medico o fisioterapista viene sempre prima di seguire un protocollo generico."
		],
		references: ["Sintesi di più fonti cliniche e di medicina dello sport su gestione del carico e criteri di progressione nel ritorno alla corsa."]
	},
	{
		id: "kenyan_running_method",
		label: "Metodologia e Filosofia Keniota di Corsa",
		aliases: [
			"metodo keniano",
			"metodo keniota",
			"corsa keniana",
			"corsa keniota",
			"allenamento keniano",
			"allenamento keniota",
			"kenyan method",
			"pole pole",
			"fartlek keniano",
			"fartlek keniota",
			"progressione keniana",
			"progressione keniota",
			"kenyan progression",
			"kenyan shuffle",
			"renato canova",
			"eliud kipchoge",
			"iten",
			"corsa a sensazione",
			"effort based running",
			"sterrato e saliscendi"
		],
		summary:
			"Il metodo di corsa keniota, sviluppato nei centri di alta quota della Rift Valley come Iten e Kaptagat e teorizzato da tecnici di fama mondiale come Renato Canova e Brother Colm O'Connell oltre a campioni leggendari come Eliud Kipchoge, si fonda su principi di estrema semplicità, sostenibilità biologica e perfetta autoregolazione. I suoi cardini sono la rigenerazione autentica tramite corsa lenta ('Pole Pole'), la progressione graduale dal trotto iniziale ('Kenyan Shuffle') fino a ritmi più sostenuti, il fartlek continuo su sterrato a sensazione (senza pause da fermi), l'allenamento collinare per la forza elastica naturale e una biomeccanica efficiente con appoggio di mesopiede e alta cadenza, integrandosi perfettamente con i criteri evidence-based di prevenzione infortuni e gestione graduale del carico.",
		generalPrinciples: [
			"Principio 'Pole Pole' (Lento di Autentica Rigenerazione): le corse facili e di recupero devono essere corse a ritmi straordinariamente lenti e rilassati (Zona 1 o bassa Zona 2, RPE 2–3/10, anche 2–3 min/km più lenti del ritmo di soglia), azzerando l'ego per permettere la reale rigenerazione cellulare, la capillarizzazione, la sintesi di collagene nei tendini e il recupero articolare senza accumulo di fatica residua.",
			"Il 'Kenyan Shuffle' e la Progressione Naturale: ogni seduta inizia con un trotto blando e rilassato a passo d'uomo nei primi chilometri (riscaldamento dinamico attivo), consentendo a cartilagini, liquido sinoviale, muscoli e tendini di lubrificarsi e scaldarsi in modo fisiologico; l'andatura aumenta in progressione continua e spontanea soltanto se il corpo risponde con sensazioni positive e scioltezza muscolare.",
			"Fartlek Continuo a Sensazione (Kenyan Fartlek): le variazioni di ritmo vengono svolte a tempo (ad es. 1' svelto / 1' facile, 2'/1', piramidali) senza pause da fermi: la fase di recupero è sempre corsa a ritmo facile e continuo, stimolando la clearance e il riutilizzo del lattato in movimento (flessibilità metabolica) e sviluppando una percezione dello sforzo precisa e indipendente da riferimenti rigidi di passo al GPS.",
			"Terreni Naturali, Sterrato e Collinare ('Red Dirt Roads'): predilezione per percorsi sterrati, sentieri campestri e saliscendi naturali, superfici che riducono i picchi di impatto sulle grandi articolazioni (anca, ginocchio) rispetto all'asfalto duro e allenano la forza reattiva dei piedi, delle caviglie e della catena posteriore (glutei e polpacci) senza la necessità di sovraccarichi artificiali.",
			"Autoregolazione e Sforzo Percepito (Effort-Based Running): l'intensità della corsa viene sempre guidata dalla risposta fisiologica del corpo, dalla respirazione e dal livello di energia quotidiano, adattando lo sforzo alle condizioni climatiche, all'altimetria e allo stato di recupero piuttosto che inseguire parametri astratti fissati a tavolino.",
			"Biomeccanica Naturale, Postura Alta e Ritorno Elastico: tronco allineato e rilassato ('running tall') con leggera proiezione in avanti dalle caviglie, spalle basse, oscillazione naturale e decontratta delle braccia, contatto reattivo di mesopiede/avampiede sotto il baricentro corporeo e cadenza agile (175–185+ passi/minuto) per minimizzare il tempo di contatto al suolo e massimizzare l'accumulo e il rilascio di energia elastica del complesso gastrocnemio-tendine d'Achille e della fascia plantare.",
			"Recupero Sacro, Riposo e Stile di Vita Essenziale: il riposo non è l'assenza di allenamento ma la fase in cui avvengono tutti gli adattamenti strutturali e biologici; sonno quantitativo e qualitativo, idratazione costante, alimentazione nutriente non processata e costanza cronica (consistency) hanno la precedenza su picchi di carico improvvisi o sedute estreme.",
			"Sinergia con la Riabilitazione e la Prevenzione Infortuni: per chi rientra da infortuni o gestisce condizioni articolari (artrosi d'anca, dolore femoro-rotuleo, tendinopatia achillea), l'adozione del Pole Pole, dello sterrato, del riscaldamento progressivo e della cadenza elastica costituisce una barriera protettiva essenziale contro le recidive da sovraccarico meccanico."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Fondamenta 'Pole Pole' e Shuffle di Riscaldamento",
				goal: "Imparare a correre i tratti facili a ritmo lentissimo e decontratto (RPE 2–3/10) su terreno morbido/sterrato, iniziando ogni sessione con 5–10 minuti di trotto blando prima di qualsiasi incremento di ritmo.",
				criteriaToProgress: "Capacità di mantenere la corsa in Zona 1/Z2 bassa a respiro facile e rilassato, senza cedere alla tentazione di accelerare; recupero asintomatico e assenza di indolenzimenti articolari o tendinei il giorno successivo."
			},
			{
				phase: "Fase 2 – Introduzione al Fartlek Continuo Breve",
				goal: "Inserimento di brevi variazioni di ritmo a sensazione (es. 10–12 ripetizioni da 1 minuto svelto a RPE 6–7/10 alternate a 1 minuto di corsa facile continua, mai da fermi) su sterrato regolare o lievi saliscendi.",
				criteriaToProgress: "Completamento dell'intera sequenza mantenendo una corsa fluida e continua anche nei minuti di recupero, con frequenza cardiaca e sforzo ben controllati e senza dolore muscoloscheletrico residuo a 24–48 ore."
			},
			{
				phase: "Fase 3 – Progressioni Keniane e Collinari Dolci",
				goal: "Introduzione di corse progressive (partenza molto lenta nei primi km e finale a ritmo medio-brillante solo se le gambe rispondono spontaneamente) e collinari su sentieri sterrati per lo sviluppo della forza reattiva naturale.",
				criteriaToProgress: "Esecuzione naturale della progressione senza strappi forzati o affanno respiratorio precoce; perfetta tolleranza articolare dell'anca, del ginocchio e del tendine d'Achille sui saliscendi."
			},
			{
				phase: "Fase 4 – Consolidamento Specifico e Padronanza dell'Autoregolazione",
				goal: "Integrazione completa della periodizzazione keniota: alternanza rigorosa di giornate 'Pole Pole' puramente rigeneranti, sedute di fartlek strutturato o progressivo continuo e mantenimento della postura decontratta ad alta cadenza.",
				criteriaToProgress: "Piena capacità di autoregolare i ritmi e la durata in base alla fatica percepita, eccellente efficienza di corsa e continuità di allenamento su più settimane senza interruzioni per sovraccarico."
			}
		],
		redFlags: [
			"Correre le sessioni facili o rigeneranti a ritmi sostenuti per ansia o 'dettatura del cronometro/GPS', trasformando ogni uscita in una prova di ritmo e impedendo il recupero biologico dei tessuti.",
			"Partire subito veloci o al ritmo target senza i primi minuti di trotto blando di adattamento articolare e cardiovascolare.",
			"Trasformare il fartlek a sensazione in ripetute anaerobiche massimali con affanno estremo, che inducono deterioramento della tecnica di corsa e sovraccarico dei tendini.",
			"Insorgenza o aumento di dolore muscoloscheletrico localizzato (dolore >3–4/10 o che persiste il giorno dopo) durante tratti collinari o variazioni di ritmo: in presenza di dolore, interrompere la frazione veloce e tornare al passo blando o al cammino.",
			"Ignorare la stanchezza profonda o la mancanza di sonno continuando a forzare l'intensità delle sedute."
		],
		references: [
			"Renato Canova – Specificity, Special Blocks and Extension of Intensity in Distance and Marathon Running.",
			"Eliud Kipchoge & Patrick Sang – Holistic Coaching Philosophy, Consistency, Regeneration and Long Run Discipline.",
			"Brother Colm O'Connell – The St. Patrick's High School Training Philosophy, Natural Progression and Group Dynamics in Iten.",
			"Toby Tanser (2008) – 'More Fire: How to Run the Kenyan Way' e 'Train Hard, Win Easy'.",
			"Adharanand Finn (2012) – 'Running with the Kenyans: Discovering the Secrets of the Fastest People on Earth'.",
			"Billat et al. (2001, 2003) – Fisiologia, costo energetico, clearance del lattato e pattern di allenamento dei mezzofondisti e maratoneti dell'Africa orientale.",
			"Larsen (2003) – Potential mechanisms for the success of East African distance runners: running economy, muscle elasticity, and lifestyle factors.",
			"Bramble & Lieberman (2004) – Endurance running and the evolution of the genus Homo: elastic energy storage in human tendons and barefoot/midfoot mechanics."
		]
	},
	{
		id: "natural_running_principles",
		label: "Correre Naturale e Biomeccanica Funzionale (Scuola Vecchioni)",
		aliases: [
			"correre naturale",
			"corsa naturale",
			"daniele vecchioni",
			"barefoot running",
			"rieducazione del piede",
			"7 pilastri tecnica corsa",
			"cadenza naturale",
			"mobilità piedi",
			"appoggio mesopiede",
			"propriocezione piedi",
			"salute articolare"
		],
		summary:
			"Il metodo 'Correre Naturale' ideato da Daniele Vecchioni riscopre la biomeccanica ancestrale del corpo umano, considerando la corsa non come causa di infortuni ma come medicina per la salute, purché eseguita con schemi motori corretti. Si focalizza sui 7 pilastri della tecnica (postura, ritmo/cadenza, relax, appoggio come conseguenza, testa/sguardo, braccia, minima oscillazione verticale) e sulla riattivazione funzionale dei piedi ('risveglio dei piedi'), superando l'analfabetismo motorio indotto da calzature iper-strutturate e posture sedentarie con una transizione progressiva e consapevole.",
		generalPrinciples: [
			"I 7 Pilastri della Tecnica di Corsa: 1) Postura eretta con allineamento strutturale; 2) Ritmo e cadenza elevata (175–185 spm) per minimizzare l'impatto al suolo; 3) Relax muscolare (contrarre solo i muscoli necessari e decontrarre istantaneamente gli antagonisti); 4) Appoggio del piede come conseguenza naturale di postura e cadenza, non come gesto forzato; 5) Testa eretta con sguardo all'orizzonte; 6) Braccia a 90° con oscillazione avanti-indietro decontratta; 7) Bassa oscillazione verticale per convertire l'energia in avanzamento orizzontale.",
			"Ristrutturazione e Risveglio dei Piedi ('Feet First'): il piede umano possiede 26 ossa, 33 articolazioni e oltre 100 muscoli e legamenti. Esercizi di mobilità articolare delle dita, estensione dell'alluce, rinforzo della muscolatura intrinseca plantare e camminata scalzi (barefoot) in ambiente domestico o su superfici naturali (erba, sabbia) restituiscono sensibilità propriocettiva e stabilità all'intera catena cinetica.",
			"Inclinazione Naturale dalle Caviglie (Non dal Bacino): l'inclinazione in avanti del corpo deve partire dall'asse delle caviglie, sfruttando la forza di gravità per l'avanzamento senza spezzare il busto in avanti all'altezza della vita (che sovraccaricherebbe la zona lombare e le anche).",
			"Transizione Graduale e Consapevole: il passaggio verso una corsa naturale e calzature meno restrittive (drop ridotto o barefoot) deve essere estremamente graduale per permettere a tendine d'Achille, polpacci e fascia plantare di riadattarsi senza subire sovraccarichi infiammatori.",
			"Mobilità Articolare Globale e Schemi Motori di Base: il recupero del deep squat (accosciata profonda a terra), la mobilità delle anche e la dorsiflessione della caviglia sono prerequisiti fondamentali per consentire alle gambe di ammortizzare naturalmente l'impatto durante la corsa."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Risveglio dei Piedi, Mobilità Caviglia/Anche e Postura Statica",
				goal: "Esercizi quotidiani per le dita e l'arco plantare, camminata a piedi nudi in casa, stretching della catena posteriore e lavoro sull'allineamento testa-tronco-bacino.",
				criteriaToProgress: "Capacità di eseguire un deep squat confortevole a talloni a terra e controllo della postura senza tensioni alla schiena o al collo."
			},
			{
				phase: "Fase 2 – Camminata Consapevole, Barefoot Domestico e Cadenza Agile",
				goal: "Rieducazione dello schema del passo, camminata barefoot su erba/sabbia e introduzione di esercizi di ritmo con metronomo a 175–180 bpm sul posto.",
				criteriaToProgress: "Passo fluido senza impatto pesante sul tallone nel cammino e facilità nel mantenere il ritmo leggero senza affaticamento dei polpacci."
			},
			{
				phase: "Fase 3 – Transizione Dinamica, Cammina-Corri e Decontrazione",
				goal: "Brevi tratti di corsa naturale alternati a cammino, focalizzandosi sul rilassamento di spalle e braccia e sull'appoggio spontaneo sotto il baricentro.",
				criteriaToProgress: "Assenza di sovraccarichi al tendine d'Achille o alla fascia plantare a 24–48 ore e corsa rilassata senza rigidità muscolare."
			},
			{
				phase: "Fase 4 – Consolidamento del Gesto Naturale e Corsa Elastica Sostenibile",
				goal: "Integrazione duratura della tecnica corretta nelle uscite continue di corsa, con oscillazione verticale minima ed elevata efficienza energetica.",
				criteriaToProgress: "Corsa continua confortevole, cadenza stabile attorno a 175–185 passi/minuto e assenza totale di infortuni da sovraccarico biomeccanico."
			}
		],
		redFlags: [
			"Forzare artificialmente l'appoggio di avampiede 'a ballerina' senza correggere prima la postura e la cadenza, provocando sovraccarichi acuti su tendine d'Achille e polpacci.",
			"Passare bruscamente a scarpe a drop zero o correre scalzi su asfalto senza aver prima condizionato i tessuti e i piedi per diversi mesi.",
			"Rigidità muscolare marcata con mascella serrata, spalle alzate verso le orecchie o pugni chiusi durante la corsa.",
			"Dolore acuto alla pianta del piede o alla tibia: fermarsi immediatamente e ripristinare il carico protetto."
		],
		references: [
			"Daniele Vecchioni – 'Corsa, la medicina perfetta: Come correre naturalmente, prevenire gli infortuni e vivere meglio'.",
			"Daniele Vecchioni – Metodo Correre Naturale e 'I 7 Pilastri della Tecnica di Corsa'.",
			"Lieberman et al. (2010) – Foot strike patterns and collision forces in habitually barefoot versus shod runners (Nature).",
			"Romanov – The Pose Method of Running: A Revolutionary Approach to Injury-Free Running.",
			"McDougall (2009) – 'Born to Run: The Hidden Tribe, the Ultra-Runners, and the Greatest Race the World Has Never Seen'."
		]
	},
	{
		id: "vital_running_method",
		label: "Metodo V.I.T.A.L.E. e Corsa Consapevole (Scuola Esco a Correre)",
		aliases: [
			"esco a correre",
			"simone luciani",
			"metodo vitale",
			"metodo v.i.t.a.l.e.",
			"corsa consapevole",
			"il cammino del runner",
			"mindful running",
			"longevità del runner",
			"runner evoluto",
			"anime di corsa"
		],
		summary:
			"Ideato da Simone Luciani, fondatore della community e scuola 'Esco a Correre' e autore de 'Il cammino del runner', il metodo V.I.T.A.L.E. è un approccio olistico e sistemico che trasforma la corsa in uno strumento di longevità, benessere ed equilibrio personale. Si basa su 6 pilastri interconnessi (Visione, Intenzione, Tecnica, Allenamento, Longevità, Energia) e promuove la figura del 'Runner Evoluto': un atleta consapevole che non segue ciecamente le tabelle ma sa ascoltare i segnali del corpo, adattando il carico con intelligenza per correre senza farsi male per tutta la vita.",
		generalPrinciples: [
			"Il Framework V.I.T.A.L.E.: 1) Visione: chiarire il proprio 'perché' profondo per mantenere motivazione e gioia a lungo termine; 2) Intenzione: agire con presenza mentale e consapevolezza dello scopo di ogni singola seduta; 3) Tecnica: curare allineamento, cadenza e appoggio per rendere il gesto economico e non traumatico; 4) Allenamento: modulazione polarizzata del carico (predominanza di volume aerobico facile rispetto all'intensità); 5) Longevità: integrazione indispensabile di forza muscolare funzionale, mobilità e recupero; 6) Energia: ottimizzazione di sonno, alimentazione nutriente e gestione dello stress.",
			"Il Concetto di 'Runner Evoluto': il vero runner maturo è colui che sa prendere decisioni intelligenti quando il piano di allenamento incontra la realtà quotidiana (stanchezza lavorativa, stress emotivo, un piccolo fastidio muscolare). Saper rallentare, accorciare o riposare è un segno di forza e competenza, non di debolezza.",
			"Longevità Prima della Performance: la vera vittoria di un corridore non è il record personale isolato ma la capacità di continuare a correre con salute e gioia a 40, 50, 60 e 70 anni. La forza muscolare e la mobilità non sono accessori opzionali ma 'l'armatura protettiva' che protegge ossa, tendini e articolazioni.",
			"Intenzione e Corsa Consapevole (Mindful Running): correre con presenza, percependo il ritmo del respiro, il contatto con il suolo e lo stato di tensione corporea, trasformando ogni uscita in un momento di ricarica mentale ed equilibrio.",
			"Gradualità Sostenibile e Costanza: per chi riparte o comincia da zero, alternare corsa e camminata (Run-Walk) con volumi contenuti (20–30 minuti a giorni alterni) garantisce un adattamento biologico progressivo e previene il sovraccarico tipico dell'eccesso di entusiasmo iniziale."
		],
		graduatedProtocol: [
			{
				phase: "Fase 1 – Visione, Base Cammina-Corri e Routine di Longevità",
				goal: "Definire la propria motivazione, iniziare con sessioni brevi di cammina-corri a giorni alterni e inserire 2 brevi sedute di forza a corpo libero e mobilità a settimana.",
				criteriaToProgress: "Aderenza costante per 3–4 settimane, piena tolleranza articolare e sensazione di benessere ed energia post-uscita."
			},
			{
				phase: "Fase 2 – Consolidamento Tecnico, Corsa Facile e Gestione dell'Energia",
				goal: "Transizione a tratti di corsa continua a ritmo conversazionale (intenzione aerobica pura), ottimizzazione di sonno e alimentazione per sostenere l'adattamento biologico.",
				criteriaToProgress: "Tollera 30 minuti di corsa continua facile con recupero completo tra le sessioni e sonno ristoratore."
			},
			{
				phase: "Fase 3 – Sviluppo Aerobico, Variazioni Controllate e Mentalità del Runner Evoluto",
				goal: "Aumento progressivo della durata delle uscite facili, introduzione di moderate variazioni di ritmo a sensazione e applicazione dell'autoregolazione nei giorni di stress elevato.",
				criteriaToProgress: "Capacità dimostrata di modulare o rimodulare l'allenamento in base al feedback corporeo, senza forzature quando affaticati."
			},
			{
				phase: "Fase 4 – Longevità Integrata e Obiettivi a Lungo Termine",
				goal: "Consolidamento del triangolo corsa-forza-recupero per una pratica sostenibile per tutto l'arco della vita, affrontando eventuali obiettivi di distanza o gara con equilibrio e serenità.",
				criteriaToProgress: "Continuità di allenamento su mesi e anni senza infortuni da overuse, equilibrio psicofisico e piacere costante nella corsa."
			}
		],
		redFlags: [
			"Schiavitù dalla tabella rigida che spinge a correre a tutti i costi nonostante stanchezza profonda, febbre o dolore muscoloscheletrico persistente.",
			"Trascurare totalmente il lavoro di forza e mobilità considerandolo tempo sottratto ai chilometri di corsa.",
			"Accumulo cronico di stress lavorativo/personale e privazione di sonno combinati con allenamenti intensi, che innalzano il cortisolo e il rischio di infortuni.",
			"Ignorare la gradualità aumentando bruscamente volume o velocità per foga di raggiungere un risultato immediato."
		],
		references: [
			"Simone Luciani – 'Il cammino del runner: Il metodo V.I.T.A.L.E. per correre tutta la vita senza farsi male' (Vallardi).",
			"Simone Luciani – Esco a Correre Academy & Podcast 'Anime di Corsa'.",
			"Seiler (2010) – What is best practice for training characteristics and dosing of endurance athletes? (Polarized Training).",
			"Studi clinici su mindful running, benessere psicofisico e prevenzione degli infortuni da sovraccarico nel running ricreativo."
		]
	}
];

export function findKnowledgeBaseEntry(idOrAlias: string): KnowledgeBaseEntry | undefined {
	const q = idOrAlias.trim().toLowerCase();
	return KNOWLEDGE_BASE.find(e => e.id === q || e.label.toLowerCase() === q || e.aliases.some(a => a.toLowerCase() === q));
}

export function searchKnowledgeBase(query: string): KnowledgeBaseEntry[] {
	const q = query.toLowerCase();
	return KNOWLEDGE_BASE.filter(e => q.includes(e.id.replace(/_/g, " ")) || e.aliases.some(alias => q.includes(alias.toLowerCase())) || q.includes(e.label.toLowerCase()));
}
