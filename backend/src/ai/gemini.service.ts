import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;

  async recommendSpecializationsFromText(text: string): Promise<{
    specializations: { name: string; confidence: number }[];
    source: 'gemini' | 'heuristic';
    raw?: string;
  }> {
    try {
      const modelFromUrl = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const aiClient = new GoogleGenAI({ apiKey: this.apiKey });
      const response = await aiClient.models.generateContent({
        model: modelFromUrl,
        contents: [
          {
            parts: [{ text }],
          },
        ],
        config: {
          systemInstruction:
            'You are a medical assistant. Return a JSON object with key "specializations" which is an array of objects with "name" and "confidence" (0-1).',
        },
      });

      // SDK may expose text directly or nested in output - support both
      const outText =
        (response as any).text ??
        (response as any).output?.[0]?.content?.[0]?.text ??
        JSON.stringify(response);

      // Try parse JSON
      let parsed: any = null;
      try {
        parsed = JSON.parse(outText);
      } catch (e) {
        const m = outText.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            parsed = JSON.parse(m[0]);
          } catch {}
        }
      }

      if (parsed && Array.isArray(parsed.specializations)) {
        const specs = parsed.specializations.map((s: any) => ({
          name: s.name,
          confidence: Number(s.confidence) || 0,
        }));
        return { specializations: specs, source: 'gemini', raw: outText };
      }
    } catch (err: any) {
      this.logger.warn(
        'Gemini SDK call failed, falling back to fetch/heuristic: ' +
          (err?.message || err),
      );
    }

    // Fallback heuristic
    return {
      specializations: this.heuristicFromText(text),
      source: 'heuristic',
    };
  }

  heuristicFromText(text: string) {
    const symptomMap: Record<string, string[]> = {
      // General symptoms
      fever: ['General Medicine'],
      chills: ['General Medicine'],
      fatigue: ['General Medicine'],
      weakness: ['General Medicine'],
      dizziness: ['General Medicine', 'Neurology'],
      fainting: ['Cardiology', 'Neurology'],
      weight: ['General Medicine', 'Endocrinology'],
      dehydration: ['General Medicine'],

      // Respiratory
      cough: ['Pulmonology', 'General Medicine'],
      'dry cough': ['Pulmonology'],
      'persistent cough': ['Pulmonology'],
      wheezing: ['Pulmonology'],
      asthma: ['Pulmonology'],
      'shortness of breath': ['Pulmonology', 'Cardiology'],
      breathlessness: ['Pulmonology', 'Cardiology'],
      congestion: ['ENT', 'General Medicine'],
      'runny nose': ['ENT', 'General Medicine'],
      sneezing: ['ENT', 'Allergy & Immunology'],
      sore: ['ENT'],
      throat: ['ENT'],
      hoarseness: ['ENT'],

      // Cardiology
      chest: ['Cardiology'],
      'chest pain': ['Cardiology'],
      palpitations: ['Cardiology'],
      heartbeat: ['Cardiology'],
      hypertension: ['Cardiology'],
      'high blood pressure': ['Cardiology'],
      swelling: ['Cardiology', 'Nephrology'],
      edema: ['Cardiology', 'Nephrology'],

      // Neurology
      headache: ['Neurology', 'General Medicine'],
      migraine: ['Neurology'],
      seizure: ['Neurology'],
      seizures: ['Neurology'],
      numbness: ['Neurology'],
      tingling: ['Neurology'],
      tremor: ['Neurology'],
      memory: ['Neurology'],
      confusion: ['Neurology'],

      // Dermatology
      skin: ['Dermatology'],
      rash: ['Dermatology'],
      acne: ['Dermatology'],
      eczema: ['Dermatology'],
      psoriasis: ['Dermatology'],
      itching: ['Dermatology'],
      itchiness: ['Dermatology'],
      mole: ['Dermatology'],
      hives: ['Dermatology'],

      // Gastroenterology
      abdominal: ['Gastroenterology', 'General Medicine'],
      stomach: ['Gastroenterology'],
      nausea: ['Gastroenterology'],
      vomiting: ['Gastroenterology'],
      diarrhea: ['Gastroenterology'],
      constipation: ['Gastroenterology'],
      bloating: ['Gastroenterology'],
      indigestion: ['Gastroenterology'],
      heartburn: ['Gastroenterology'],
      reflux: ['Gastroenterology'],
      liver: ['Gastroenterology'],
      jaundice: ['Gastroenterology'],

      // Orthopedics / Musculoskeletal
      back: ['Orthopedics'],
      'back pain': ['Orthopedics'],
      neck: ['Orthopedics'],
      shoulder: ['Orthopedics'],
      knee: ['Orthopedics'],
      hip: ['Orthopedics'],
      joint: ['Orthopedics', 'Rheumatology'],
      arthritis: ['Rheumatology'],
      fracture: ['Orthopedics'],
      sprain: ['Orthopedics'],
      injury: ['Orthopedics'],

      // Ophthalmology
      eye: ['Ophthalmology'],
      vision: ['Ophthalmology'],
      blurry: ['Ophthalmology'],
      blindness: ['Ophthalmology'],
      redness: ['Ophthalmology'],
      cataract: ['Ophthalmology'],

      // ENT
      ear: ['ENT'],
      hearing: ['ENT'],
      tinnitus: ['ENT'],
      nose: ['ENT'],
      sinus: ['ENT'],
      sinusitis: ['ENT'],

      // Endocrinology
      diabetes: ['Endocrinology'],
      thyroid: ['Endocrinology'],
      sugar: ['Endocrinology'],
      obesity: ['Endocrinology'],
      overweight: ['Endocrinology'],

      // Urology / Nephrology
      kidney: ['Nephrology'],
      urination: ['Urology'],
      urine: ['Urology'],
      'painful urination': ['Urology'],
      bladder: ['Urology'],
      prostate: ['Urology'],
      blood: ['Nephrology', 'Urology'],

      // Gynecology
      menstrual: ['Obstetrics & Gynecology'],
      period: ['Obstetrics & Gynecology'],
      pregnancy: ['Obstetrics & Gynecology'],
      pregnant: ['Obstetrics & Gynecology'],
      vaginal: ['Obstetrics & Gynecology'],
      pelvic: ['Obstetrics & Gynecology'],

      // Mental Health
      anxiety: ['Psychiatry'],
      depression: ['Psychiatry'],
      stress: ['Psychiatry'],
      panic: ['Psychiatry'],
      insomnia: ['Psychiatry'],
      sleep: ['Psychiatry'],

      // Pediatrics
      child: ['Pediatrics'],
      infant: ['Pediatrics'],
      baby: ['Pediatrics'],
      newborn: ['Pediatrics'],

      // Allergy / Immunology
      allergy: ['Allergy & Immunology'],
      allergies: ['Allergy & Immunology'],
      allergic: ['Allergy & Immunology'],
      anaphylaxis: ['Allergy & Immunology'],
    };

    const lower = (text || '').toLowerCase();
    const counts = new Map<string, number>();
    for (const [k, specs] of Object.entries(symptomMap)) {
      if (lower.includes(k)) {
        for (const s of specs) counts.set(s, (counts.get(s) || 0) + 1);
      }
    }

    if (counts.size === 0) {
      return [{ name: 'General Medicine', confidence: 0.5 }];
    }

    const arr = Array.from(counts.entries()).map(([name, score]) => ({
      name,
      confidence: Math.min(1, score / 1),
    }));
    return arr.sort((a, b) => b.confidence - a.confidence);
  }
}
