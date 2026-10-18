import React from 'react';
import { UserCheck, Activity, Users, type LucideIcon } from 'lucide-react';
import { Persona, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface PersonaSwitcherProps {
  persona: Persona;
  setPersona: (p: Persona) => void;
  language: Language;
  className?: string;
}

export const PERSONA_STYLES: Record<
  Persona,
  { icon: LucideIcon; label: string; active: string }
> = {
  executive: { icon: UserCheck, label: 'Executive', active: 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300' },
  agronomist: { icon: Activity, label: 'Agronomist', active: 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-300' },
  farmer_coop: { icon: Users, label: 'Farmer Coop', active: 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300' },
};

const PERSONA_ORDER: Persona[] = ['executive', 'agronomist', 'farmer_coop'];

/**
 * Segmented toggle for the active persona view.
 */
export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({ persona, setPersona, language, className = '' }) => {
  const t = TRANSLATIONS[language];

  return (
    <div role="group" aria-label="Persona view" className={`flex items-center gap-1 p-1 rounded-xl border border-slate-200 ${className}`}>
      {PERSONA_ORDER.map((id) => {
        const { icon: Icon, label, active } = PERSONA_STYLES[id];
        const isActive = persona === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPersona(id)}
            aria-pressed={isActive}
            title={t.personas[id].description}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive ? active : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
