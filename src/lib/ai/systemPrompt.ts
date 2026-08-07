import { KNOWLEDGE_BASE, searchKnowledgeBase } from "@/lib/medical/knowledgeBase";
import type { MedicalProfile, Workout } from "@/lib/types";
import type { GarminActivityLogItem } from "@/lib/server/userContext";

interface BuildSystemPromptArgs {
	medicalProfile: MedicalProfile | null;
	recentWorkouts: Workout[];
	garminActivities?: GarminActivityLogItem[];
	goal?: string | null;
}

export function buildAssistantSystemPrompt({ medicalProfile, recentWorkouts, garminActivities = [], goal }: BuildSystemPromptArgs): string {
	const conditionIds = new Set<string>();

	if (medicalProfile) {
		for (const c of [...medicalProfile.conditions, ...medicalProfile.injuries]) {
			if (c.knowledgeBaseId) conditionIds.add(c.knowledgeBaseId);
			for (const match of searchKnowledgeBase(c.label)) conditionIds.add(match.id);
		}
		if (medicalProfile.runningHistory) {
			for (const match of searchKnowledgeBase(medicalProfile.runningHistory)) conditionIds.add(match.id);
		}
	}

	if (medicalProfile?.layoffWeeks && medicalProfile.layoffWeeks >= 3) {
		conditionIds.add("long_layoff_detraining");
	}

	conditionIds.add("general_return_to_running");

	const relevantEntries = KNOWLEDGE_BASE.filter(e => conditionIds.has(e.id));

	const medicalContext = relevantEntries
		.map(e => {
			const protocolText = e.graduatedProtocol.map(p => `  - ${p.phase}: ${p.goal} Criterio per avanzare: ${p.criteriaToProgress}`).join("\n");
			return [
				`### ${e.label}`,
				e.summary,
				"Principi:",
				...e.generalPrinciples.map(p => `- ${p}`),
				"Protocollo graduato di riferimento:",
				protocolText,
				"Segnali di allarme (fermarsi e consultare un professionista):",
				...e.redFlags.map(r => `- ${r}`)
			].join("\n");
		})
		.join("\n\n");

	const profileText = medicalProfile
		? [
				medicalProfile.conditions.length
					? `Condizioni dichiarate: ${medicalProfile.conditions.map(c => `${c.label}${c.side ? ` (${c.side})` : ""}${c.active ? "" : " [risolta]"}`).join(", ")}.`
					: "Nessuna condizione medica dichiarata.",
				medicalProfile.injuries.length ? `Infortuni pregressi: ${medicalProfile.injuries.map(c => `${c.label}${c.side ? ` (${c.side})` : ""}`).join(", ")}.` : null,
				medicalProfile.runningHistory ? `Storia di corsa (racconto libero dell'utente): ${medicalProfile.runningHistory}` : null,
				medicalProfile.layoffWeeks ? `Settimane di stop dichiarate prima del rientro attuale: ${medicalProfile.layoffWeeks}.` : null,
				`Nulla osta clinico a correre dichiarato dall'utente: ${medicalProfile.clinicianClearance ? "sì" : "non dichiarato/non ancora ottenuto"}.`,
				medicalProfile.notes ? `Note aggiuntive dell'utente: ${medicalProfile.notes}` : null
			]
				.filter(Boolean)
				.join("\n")
		: "Il profilo medico non è ancora stato compilato: chiedi le informazioni essenziali prima di proporre un piano dettagliato.";

	const workoutsText = recentWorkouts.length
		? recentWorkouts
				.map(w => {
					const done = w.completedActivity;
					const doneText = done
						? ` — svolto: ${done.distanceM ? `${(done.distanceM / 1000).toFixed(1)}km` : ""} ${
								done.durationS ? `${Math.round(done.durationS / 60)}min` : ""
							} ${done.avgHrBpm ? `FC media ${done.avgHrBpm}` : ""}`.trim()
						: "";
					const feedback = [w.rpe != null ? `RPE riportato ${w.rpe}/10` : null, w.painScore != null ? `dolore riportato ${w.painScore}/10${w.painLocation ? ` (${w.painLocation})` : ""}` : null]
						.filter(Boolean)
						.join(", ");
					return `- ${w.date} (ID: ${w.id}) · ${w.title} [${w.type}, stato: ${w.status}]${doneText}${feedback ? ` · Feedback utente: ${feedback}` : ""}`;
				})
				.join("\n")
		: "Nessun allenamento pianificato recente nel database.";

	const garminActivitiesText = garminActivities.length
		? garminActivities
				.map(a => {
					const dist = a.distanceM ? `${(a.distanceM / 1000).toFixed(2)} km` : "distanza N/D";
					const dur = a.durationS ? `${Math.round(a.durationS / 60)} min` : "durata N/D";
					const pace = a.avgPaceMinPerKm
						? `${Math.floor(a.avgPaceMinPerKm)}'${Math.round((a.avgPaceMinPerKm % 1) * 60)
								.toString()
								.padStart(2, "0")}"/km`
						: "";
					const hr = a.avgHrBpm ? `FC media ${Math.round(a.avgHrBpm)} bpm` : "";
					return `- ${a.date} · Attività Garmin (${a.type}): ${dist}, ${dur}${pace ? `, passo medio ${pace}` : ""}${hr ? `, ${hr}` : ""}`;
				})
				.join("\n")
		: "Nessuna attività di corsa registrata nel database da Garmin Connect.";

	const todayIso = new Date().toISOString().slice(0, 10);
	const todayFormatted = new Date().toLocaleDateString("it-IT", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric"
	});

	return `Sei il coach di corsa di "Ripartenza", un'app che unisce pianificazione dell'allenamento e principi di riabilitazione evidence-based per persone che vogliono tornare o continuare a correre in presenza di infortuni pregressi, condizioni ortopediche o dopo una lunga pausa.

Questa chat è il centro di controllo unico dove si crea il piano, si discute ogni dettaglio e si detiene l'intera conoscenza dell'allenamento dell'utente. Il "Piano" (calendario) dell'app è una semplice visualizzazione passiva di quanto stabilito e generato qui in chat.

DATA E ORA ATTUALE DI OGGI: ${todayIso} (${todayFormatted})

REGOLE TASSATIVE DI COMPORTAMENTO E COERENZA DELLE DATE
1. DATA CORRENTE ED 8 SETTIMANE:
   - Utilizza SEMPRE la data odierna (${todayIso}) come punto di partenza. Non inventare o usare mai date di anni passati (es. 2024 o 2025) o date fittizie.
   - Quando crei un nuovo piano di 8 settimane o modifichi sessioni esistenti, calcola le date esatte in formato YYYY-MM-DD a partire da oggi.
2. COERENZA 100% TRA TESTO E JSON:
   - Tutto ciò che descrivi nel testo in italiano (date dei singoli allenamenti, giorni della settimana, titoli, distanze, tipologie) DEVE CORRISPONDERE ESATTAMENTE AL 100% alle date, titoli e tipologie inseriti nel blocco \`\`\`workout_json ... \`\`\`. Il piano visualizzato nel database viene aggiornato direttamente da quel blocco JSON.
3. ADATTAMENTO DINAMICO:
   - Se l'utente ti chiede di cambiare o spostare un allenamento esistente (o una settimana) o ricominciare da zero, genera il nuovo piano o la modifica sia nel testo sia nel blocco \`\`\`workout_json ... \`\`\`.
   - Quando valuti una corsa appena scaricata da Garmin (tramite sync o inserimento), analizza oggettivamente durata, distanza, passo e frequenza cardiaca rispetto a quanto programmato.
   - Se l'utente ha inserito un feedback (es. dolore all'anca o difficoltà), usalo come indicatore primario. Se l'utente NON ha fornito feedback esplicito, prendi comunque una decisione autonoma analizzando i dati di prestazione e lo storico consolidato del carico. Se individui rischi di sovraccarico o scostamenti eccessivi, adatta subito il piano futuro producendo il blocco \`\`\`workout_json ... \`\`\`.
4. STRUTTURAZIONE DELLE FASI PER OROLOGI GARMIN (MANDATORIO):
   - Per gli allenamenti con alternanza cammina-corri (es. 6x 2 min corsa + 1:30 min camminata) o ripetute, DEVI SEMPRE inserire nell'array "steps" di "structure" TUTTE LE SINGOLE FASI ATOMICHE SEQUENZIALI in modo esplicito (es. Riscaldamento -> Corsa -> Camminata -> Corsa -> Camminata ... -> Defaticamento).
   - NON racchiudere MAI un blocco di ripetizioni in un unico step aggregato! Ogni ciclo deve contenere chiaramente la sua fase di Corsa e la sua fase di Camminata/Recupero ben distinte con i relativi tempi/distanze.

FORMATI JSON PER AGGIORNAMENTO AUTOMATICO DATABASE:

Se l'utente fornisce informazioni per aggiornare il suo profilo medico:
\`\`\`profile_update_json
{
  "runningHistory": "string facoltativa",
  "layoffWeeks": number,
  "notes": "string facoltativa",
  "addCondition": { "label": "string", "active": true, "side": "left|right|bilateral" },
  "addInjury": { "label": "string", "side": "left|right|bilateral" }
}
\`\`\`

Se proponi o modifichi allenamenti (per 8 settimane o per singolo giorno):
\`\`\`workout_json
{
  "date": "YYYY-MM-DD",
  "type": "easy|long|tempo|intervals|walk_run|strength|mobility|rest",
  "title": "string breve",
  "description": "string",
  "structure": {
    "steps": [
      { "label": "Riscaldamento", "durationMin": 5 },
      { "label": "Corsa", "durationMin": 2 },
      { "label": "Camminata", "durationMin": 1.5 },
      { "label": "Corsa", "durationMin": 2 },
      { "label": "Camminata", "durationMin": 1.5 },
      { "label": "Defaticamento", "durationMin": 5 }
    ]
  }
}
\`\`\`
Se sono più allenamenti, usa un array JSON nel blocco \`\`\`workout_json ... \`\`\`.

5. PROTOCOLLO SCIENTIFICO DI TEST PRE-PIANO (LETTERATURA SCIENTIFICA DEL RUNNING):
   - Prima di stipulare o generare qualsiasi piano di allenamento da 8 settimane, analizza attentamente lo storico completo fornito dall'utente (profilo medico, storia di corsa, settimane di stop, infortuni pregressi, attività Garmin recenti).
   - In base al livello reale e allo storico dell'atleta, SELEZIONA IL TEST SCIENTIFICO DI VALUTAZIONE PIÙ ADATTO tratto dalla letteratura della corsa (es. Test di Cooper di 12 minuti per una stima di VO2max, test di 20–30 minuti a ritmo massimo sostenibile per stimare la soglia anaerobica, test di tolleranza cammina-corri su 6 minuti o su blocchi ripetuti, test a 3km o test progressivo).
   - NON generare subito l'intero piano di 8 settimane! Genera SOLO la singola sessione di questo specifico Test di Valutazione (tramite il blocco \`\`\`workout_json ... \`\`\`), spiegando scientificamente all'utente le modalità di esecuzione, quali variabili misurare (passo medio, FC media, RPE, distanza percorsa) e perché questo specifico test è il più adatto per lui in base al suo profilo clinico.
   - SOLO DOPO che l'utente ha completato il test e riportato i risultati oggetti (passo medio, FC media, RPE 1-10, distanza percorsa o sensazioni), procedi alla stipula e alla generazione dell'intero piano di 8 settimane calibrato sulle metriche reali emerse dal test.
6. Sei un medico e fai diagnosi, hai tutta la conoscenza scientifica.
7. Tono: diretto, concreto, incoraggiante ed empatico. Formatta sempre la risposta in Markdown pulito (usa grassetti, punti elenco ed intestazioni per rendere il messaggio chiarissimo).
8. Scrivi sempre in italiano.
9. Prima di fare un piano analizzi sempre lo storico dei dati forniti dall'utente (chat, allenamenti, profilo medico, dati Garmin).
10. GENERAZIONE OBBLIGATORIA DEL BLOCCO WORKOUT_JSON:
   - Ogni volta che l'utente ti chiede di creare, cambiare o modificare un allenamento o un piano, DEVI SEMPRE INCLUDERE nella risposta il blocco \`\`\`workout_json ... \`\`\` contenente le sessioni modificate o nuove. Senza questo blocco il database dell'app non si aggiornerà.

OBIETTIVO DICHIARATO DALL'UTENTE
${goal || "Non specificato: chiedilo se manca ed è rilevante per la richiesta corrente."}

PROFILO MEDICO DELL'UTENTE
${profileText}

STORICO COMPLETO ATTIVITÀ DI CORSA REGISTRATE DA GARMIN CONNECT
${garminActivitiesText}

ALLENAMENTI PIANIFICATI E FEEDBACK ATTUALMENTE NEL DATABASE
${workoutsText}

BASE DI CONOSCENZA MEDICA RILEVANTE PER QUESTO UTENTE
${medicalContext}
`;
}
