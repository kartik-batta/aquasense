import { Language, Persona } from '../types';

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  cupBadge: string;
  totalBudget: string;
  sensorQuota: string;
  runSimulation: string;
  running: string;
  resetScenario: string;
  kpiLossTitle: string;
  kpiLossSubtitle: string;
  kpiFairnessTitle: string;
  kpiFairnessSubtitle: string;
  kpiComplianceTitle: string;
  kpiComplianceSubtitle: string;
  kpiVoiAdvantageTitle: string;
  kpiVoiAdvantageSubtitle: string;
  signatureTitle: string;
  signatureSubtitle: string;
  highestUncertaintyCard: string;
  voiOptimalCard: string;
  whyVoiWins: string;
  fieldGridTitle: string;
  fieldGridSubtitle: string;
  matrixTitle: string;
  matrixSubtitle: string;
  droneVisionTitle: string;
  droneVisionSubtitle: string;
  copilotTitle: string;
  copilotSubtitle: string;
  askCopilot: string;
  voiceBriefing: string;
  voiceListening: string;
  voicePromptPlaceholder: string;
  exportAudit: string;
  lossReducedBy: string;
  equityIndex: string;
  cropStress: string;
  waterAllocated: string;
  measuredBySensor: string;
  personas: Record<Persona, { title: string; subtitle: string; description: string }>;
  scenarios: {
    selectScenario: string;
    customSandbox: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'AquaSense',
    appSubtitle: 'Adaptive Water Intelligence Engine',
    cupBadge: 'AI Builder Cup 2026 · Sustainability & Social Impact',
    totalBudget: 'Total Water Supply Budget',
    sensorQuota: 'Sensor Sensing Budget (K)',
    runSimulation: 'Run Decision Engine',
    running: 'Optimizing...',
    resetScenario: 'Reset Basin State',
    kpiLossTitle: 'Crop-Stress Loss Proxy',
    kpiLossSubtitle: 'Lower is better · Quadratic deficit penalty',
    kpiFairnessTitle: "Jain's Fairness Index",
    kpiFairnessSubtitle: 'Regional equity · 1.0 = Perfect equity',
    kpiComplianceTitle: 'Budget Compliance',
    kpiComplianceSubtitle: 'Strict hard-constraint audit',
    kpiVoiAdvantageTitle: 'AquaSense VOI Advantage',
    kpiVoiAdvantageSubtitle: 'Stress reduction vs Max-Uncertainty',
    signatureTitle: 'The Core Mathematical Delineation',
    signatureSubtitle: 'Why reducing uncertainty is NOT equivalent to maximizing decision value',
    highestUncertaintyCard: 'Max-Uncertainty Field (Standard Heuristic)',
    voiOptimalCard: 'AquaSense VOI Field (Decision-Aware Choice)',
    whyVoiWins: 'Why AquaSense Wins:',
    fieldGridTitle: 'Management Unit GIS Basin Matrix',
    fieldGridSubtitle: 'Real-time prior beliefs, uncertainty halos (±2σ), and allocated water volumes',
    matrixTitle: 'Matched Baseline Comparative Matrix',
    matrixSubtitle: 'Evaluating all 4 resource and information allocation policies under identical constraints',
    droneVisionTitle: 'Multispectral Drone & NDVI Canopy Scanner',
    droneVisionSubtitle: 'Computer-vision canopy stress estimation dynamically updating uncertainty bounds (σ)',
    copilotTitle: 'Grounded Gemini Decision Copilot',
    copilotSubtitle: 'Audited against mathematical invariants · Zero metric hallucination',
    askCopilot: 'Ask AquaSense Copilot',
    voiceBriefing: 'Voice Briefing',
    voiceListening: 'Listening to your voice...',
    voicePromptPlaceholder: 'Ask why Unit D was chosen or request an equity summary...',
    exportAudit: 'Export Audit Log (JSON)',
    lossReducedBy: 'Deficit Loss Reduced By',
    equityIndex: 'Fairness Index',
    cropStress: 'Crop Stress Loss',
    waterAllocated: 'Water Allocated',
    measuredBySensor: 'Field Measured',
    personas: {
      executive: {
        title: 'Watershed Director',
        subtitle: 'Executive Macro View',
        description: 'Macro basin balance, regional equity index, policy trade-offs, and exportable regulatory compliance audits.',
      },
      agronomist: {
        title: 'Field Agronomist',
        subtitle: 'Telemetry & Sensors',
        description: 'High-density sensor telemetry, Gaussian uncertainty distributions (μ ± 2σ), and drone multispectral NDVI imagery.',
      },
      farmer_coop: {
        title: 'Farmer Cooperative Lead',
        subtitle: 'Actionable Schedules',
        description: 'Plain-language canal gate schedules, equitable water delivery volumes, and voice-enabled local advisories.',
      },
    },
    scenarios: {
      selectScenario: 'Select Basin Scenario',
      customSandbox: 'Custom Scenario Sandbox',
    },
  },
  hi: {
    appTitle: 'एक्वासेंस (AquaSense)',
    appSubtitle: 'अनुकूली जल बुद्धिमत्ता प्रणाली',
    cupBadge: 'AI बिल्डर कप 2026 · स्थिरता एवं सामाजिक प्रभाव',
    totalBudget: 'कुल उपलब्ध जल बजट',
    sensorQuota: 'सेंसर माप कोटा (K)',
    runSimulation: 'सिमुलेशन चलाएं',
    running: 'अनुकूलन जारी...',
    resetScenario: 'रीसेट करें',
    kpiLossTitle: 'सिमुलेटेड फसल-तनाव हानि',
    kpiLossSubtitle: 'कम मान बेहतर · द्विघात घाटा जुर्माना',
    kpiFairnessTitle: 'जैन निष्पक्षता सूचकांक',
    kpiFairnessSubtitle: 'क्षेत्रीय समानता · 1.0 = पूर्ण समानता',
    kpiComplianceTitle: 'बजट अनुपालन',
    kpiComplianceSubtitle: 'सख्त सीमा सत्यापन (100% शून्य उल्लंघन)',
    kpiVoiAdvantageTitle: 'एक्वासेंस VOI लाभ',
    kpiVoiAdvantageSubtitle: 'अधिकतम-अनिश्चितता हेयूरिस्टिक की तुलना में लाभ',
    signatureTitle: 'मूल गणितीय अंतर (The Core Delineation)',
    signatureSubtitle: 'अनिश्चितता कम करना निर्णय मूल्य को अधिकतम करने के बराबर क्यों नहीं है',
    highestUncertaintyCard: 'अधिकतम अनिश्चितता क्षेत्र (मानक हेयूरिस्टिक)',
    voiOptimalCard: 'एक्वासेंस VOI क्षेत्र (निर्णय-सचेत विकल्प)',
    whyVoiWins: 'एक्वासेंस क्यों बेहतर है:',
    fieldGridTitle: 'कृषि प्रबंधन इकाइयाँ (GIS बेसिन मैट्रिक्स)',
    fieldGridSubtitle: 'पूर्व अनुमान, अनिश्चितता चक्र (±2σ), और आवंटित जल',
    matrixTitle: 'तुलनात्मक नीति मैट्रिक्स (4 नीतियां)',
    matrixSubtitle: 'समान परिस्थितियों में 4 नीतियों का सीधा मूल्यांकन',
    droneVisionTitle: 'ड्रोन एवं उपग्रह NDVI कैनोपी स्कैनर',
    droneVisionSubtitle: 'कैनोपी तनाव का वास्तविक समय में अनुमान और अनिश्चितता अद्यतन',
    copilotTitle: 'सत्यापित जेमिनी सहायक',
    copilotSubtitle: 'कठोर वैज्ञानिक सीमाओं के साथ · शून्य काल्पनिक डेटा',
    askCopilot: 'सहायक से पूछें',
    voiceBriefing: 'ध्वनि ब्रीफिंग',
    voiceListening: 'आपकी आवाज सुनी जा रही है...',
    voicePromptPlaceholder: 'पूछें कि यूनिट D को यूनिट A पर क्यों चुना गया...',
    exportAudit: 'ऑडिट लॉग निर्यात (JSON)',
    lossReducedBy: 'हानि में कमी',
    equityIndex: 'निष्पक्षता सूचकांक',
    cropStress: 'फसल तनाव हानि',
    waterAllocated: 'आवंटित जल',
    measuredBySensor: 'सेंसर मापित',
    personas: {
      executive: {
        title: 'बेसिन निदेशक',
        subtitle: 'कार्यकारी अवलोकन',
        description: 'मैक्रो जल संतुलन, निष्पक्षता सूचकांक, नीतिगत व्यापार-बंद और विनियामक ऑडिट।',
      },
      agronomist: {
        title: 'क्षेत्रीय कृषिविज्ञानी',
        subtitle: 'टेलीमेट्री एवं सेंसर',
        description: 'गॉसियन संभाव्यता वक्र (μ ± 2σ), सेंसर बैटरी, और NDVI कैनोपी स्कैन।',
      },
      farmer_coop: {
        title: 'किसान सहकारी प्रमुख',
        subtitle: 'कार्रवाई योग्य समय सारिणी',
        description: 'सरल भाषा में नहर जल आपूर्ति सारिणी और स्थानीय ऑडियो रिपोर्ट।',
      },
    },
    scenarios: {
      selectScenario: 'बेसिन परिदृश्य चुनें',
      customSandbox: 'कस्टम सैंडबॉक्स',
    },
  },
  es: {
    appTitle: 'AquaSense',
    appSubtitle: 'Motor de Inteligencia Hídrica Adaptativa',
    cupBadge: 'AI Builder Cup 2026 · Sostenibilidad e Impacto Social',
    totalBudget: 'Presupuesto Total de Agua',
    sensorQuota: 'Cuota de Medición de Sensores (K)',
    runSimulation: 'Ejecutar Simulación',
    running: 'Optimizando...',
    resetScenario: 'Restablecer Cuenca',
    kpiLossTitle: 'Proxy de Pérdida por Estrés Hídrico',
    kpiLossSubtitle: 'Menor es mejor · Penalización cuadrática',
    kpiFairnessTitle: 'Índice de Equidad de Jain',
    kpiFairnessSubtitle: 'Equidad regional · 1.0 = Equidad perfecta',
    kpiComplianceTitle: 'Cumplimiento Presupuestario',
    kpiComplianceSubtitle: 'Auditoría estricta de restricciones duras',
    kpiVoiAdvantageTitle: 'Ventaja AquaSense VOI',
    kpiVoiAdvantageSubtitle: 'Reducción de estrés vs Máxima Incertidumbre',
    signatureTitle: 'La Delineación Matemática Fundamental',
    signatureSubtitle: 'Por qué reducir incertidumbre NO equivale a maximizar valor de decisión',
    highestUncertaintyCard: 'Campo de Máxima Incertidumbre (Heurística Habitual)',
    voiOptimalCard: 'Campo Óptimo AquaSense VOI (Elección Decisional)',
    whyVoiWins: 'Por qué AquaSense Supera la Heurística:',
    fieldGridTitle: 'Matriz GIS de Unidades de Gestión',
    fieldGridSubtitle: 'Creencias a priori, halos de incertidumbre (±2σ) y volúmenes asignados',
    matrixTitle: 'Matriz Comparativa de Políticas de Base',
    matrixSubtitle: 'Evaluación emparejada de 4 políticas bajo restricciones idénticas',
    droneVisionTitle: 'Escáner Multiespectral Drone y NDVI',
    droneVisionSubtitle: 'Estimación de estrés foliar que actualiza en tiempo real los límites de varianza (σ)',
    copilotTitle: 'Copiloto Gemini Anclado en Datos',
    copilotSubtitle: 'Auditado contra invariantes matemáticos · Cero alucinaciones',
    askCopilot: 'Consultar Copiloto',
    voiceBriefing: 'Informe por Voz',
    voiceListening: 'Escuchando tu voz...',
    voicePromptPlaceholder: 'Pregunte por qué se priorizó la Unidad D sobre la A...',
    exportAudit: 'Exportar Registro de Auditoría',
    lossReducedBy: 'Pérdida Reducida en',
    equityIndex: 'Índice de Equidad',
    cropStress: 'Estrés de Cultivo',
    waterAllocated: 'Agua Asignada',
    measuredBySensor: 'Medido en Campo',
    personas: {
      executive: {
        title: 'Director de Cuenca',
        subtitle: 'Visión Macro Ejecutiva',
        description: 'Balance hídrico macro, equidad regional de Jain y auditorías de cumplimiento.',
      },
      agronomist: {
        title: 'Agrónomo de Campo',
        subtitle: 'Telemetría y Sensores',
        description: 'Telemetría de alta densidad, distribuciones gaussianas (μ ± 2σ) y reflectancia NDVI.',
      },
      farmer_coop: {
        title: 'Líder Cooperativo Agrícola',
        subtitle: 'Cronogramas Claros',
        description: 'Programación de compuertas en lenguaje claro, volúmenes de entrega y resúmenes de audio.',
      },
    },
    scenarios: {
      selectScenario: 'Seleccionar Escenario',
      customSandbox: 'Laboratorio Personalizado',
    },
  },
  sw: {
    appTitle: 'AquaSense',
    appSubtitle: 'Injini ya Akili ya Maji Inayobadilika',
    cupBadge: 'AI Builder Cup 2026 · Uendelevu na Athari za Kijamii',
    totalBudget: 'Bajeti Kamili ya Maji',
    sensorQuota: 'Kiwango cha Sensorer (K)',
    runSimulation: 'Endesha Uigaji',
    running: 'Inaboresha...',
    resetScenario: 'Rudisha Mfumo',
    kpiLossTitle: 'Kipimo cha Hasara ya Mkazo wa Mazao',
    kpiLossSubtitle: 'Chini ni bora · Adhabu ya mraba ya upungufu',
    kpiFairnessTitle: 'Kielezo cha Usawa cha Jain',
    kpiFairnessSubtitle: 'Usawa wa kikanda · 1.0 = Usawa kamili',
    kpiComplianceTitle: 'Uzingatiaji wa Bajeti',
    kpiComplianceSubtitle: 'Ukaguzi thabiti usio na ukiukaji wowote',
    kpiVoiAdvantageTitle: 'Faida ya AquaSense VOI',
    kpiVoiAdvantageSubtitle: 'Kupungua kwa hasara kulinganisha na mashaka makubwa',
    signatureTitle: 'Tofauti ya Msingi ya Hesabu',
    signatureSubtitle: 'Kwa nini kupunguza mashaka si sawa na kuongeza thamani ya uamuzi',
    highestUncertaintyCard: 'Sehemu ya Mashaka Makubwa (Mbinu ya Kawaida)',
    voiOptimalCard: 'Sehemu ya AquaSense VOI (Chaguo Sahihi la Uamuzi)',
    whyVoiWins: 'Kwa nini AquaSense Inashinda:',
    fieldGridTitle: 'Matrix ya GIS ya Maeneo ya Kilimo',
    fieldGridSubtitle: 'Makadirio ya awali, duara za mashaka (±2σ), na kiasi cha maji kilichogawiwa',
    matrixTitle: 'Jedwali Linganishi la Sera 4',
    matrixSubtitle: 'Kutathmini sera 4 chini ya vikwazo sawa kabisa',
    droneVisionTitle: 'Kichanganuzi cha Drone na NDVI ya Mazao',
    droneVisionSubtitle: 'Uchambuzi wa picha unaoboresha kipimo cha mashaka (σ) moja kwa moja',
    copilotTitle: 'Msaidizi wa Gemini Aliyethibitishwa',
    copilotSubtitle: 'Imejikita katika takwimu thabiti bila kubuni namba',
    askCopilot: 'Uliza Msaidizi',
    voiceBriefing: 'Muhtasari wa Sauti',
    voiceListening: 'Inasikiliza sauti yako...',
    voicePromptPlaceholder: 'Uliza kwa nini Kitengo D kilichaguliwa badala ya Kitengo A...',
    exportAudit: 'Hamisha Rekodi za Ukaguzi',
    lossReducedBy: 'Hasara Imepunguzwa kwa',
    equityIndex: 'Kielezo cha Usawa',
    cropStress: 'Hasara ya Mazao',
    waterAllocated: 'Maji Yaliyogawiwa',
    measuredBySensor: 'Imepimwa na Sensa',
    personas: {
      executive: {
        title: 'Mkurugenzi wa Bonde',
        subtitle: 'Mtazamo wa Kiongozi',
        description: 'Usawa wa bonde, kielezo cha Jain cha ugavi, na ukaguzi wa sheria.',
      },
      agronomist: {
        title: 'Mtaalamu wa Kilimo',
        subtitle: 'Sensorer na Takwimu',
        description: 'Mikondo ya uwezekano wa Gaussian (μ ± 2σ), betri za sensorer, na picha za NDVI.',
      },
      farmer_coop: {
        title: 'Kiongozi wa Ushirika wa Wakulima',
        subtitle: 'Ratiba Wazi za Maji',
        description: 'Ratiba ya mifereji kwa lugha nyepesi na maelezo ya sauti ya papo hapo.',
      },
    },
    scenarios: {
      selectScenario: 'Chagua Hali ya Bonde',
      customSandbox: 'Eneo la Majaribio',
    },
  },
};
